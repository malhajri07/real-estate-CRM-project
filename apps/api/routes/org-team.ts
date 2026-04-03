/**
 * org-team.ts — Organization team management routes
 *
 * Allows CORP_OWNER to see and manage agents in their organization.
 * Scoped to the authenticated user's organizationId.
 *
 * Endpoints:
 *   GET    /api/org/team              — List all agents in org (incl. inactive)
 *   GET    /api/org/stats             — Organization overview stats
 *   GET    /api/org/team/performance  — Per-agent metrics for charts
 *   GET    /api/org/team/:id/activity — Agent's recent activity (30 days)
 *   POST   /api/org/team/invite       — Invite (create) new agent
 *   PUT    /api/org/team/:id          — Update agent details
 *   PATCH  /api/org/team/:id/toggle-active — Enable/disable agent
 *   PATCH  /api/org/team/:id/change-role   — Promote/demote agent role
 */

import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../auth";
import { hashPassword } from "../auth";
import { normalizeRoleKeys, UserRole } from "@shared/rbac";

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
// Middleware: require CORP_OWNER or WEBSITE_ADMIN
// ────────────────────────────────────────────────────────────────────────────
const requireOwnerOrAdmin = (req: Request, res: Response, next: any) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Authentication required" });
  const roles = normalizeRoleKeys(user.roles);
  if (!roles.includes(UserRole.CORP_OWNER) && !roles.includes(UserRole.WEBSITE_ADMIN)) {
    return res.status(403).json({ message: "يجب أن تكون مالك المنظمة للوصول لهذه الصفحة" });
  }
  next();
};

// Helper: get the caller's orgId or 400
function getOrgId(req: Request, res: Response): string | null {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(400).json({ message: "لا توجد منظمة مرتبطة بحسابك" });
    return null;
  }
  return orgId;
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/org/team — List ALL agents in my organization (incl. inactive)
// ────────────────────────────────────────────────────────────────────────────
router.get("/team", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const members = await prisma.users.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        roles: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        agent_profiles: {
          select: {
            id: true,
            licenseNo: true,
            licenseValidTo: true,
            territories: true,
            specialties: true,
            status: true,
            isIndividualAgent: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get stats per agent
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const [leadCount, dealCount, appointmentCount, wonDeals] = await Promise.all([
          prisma.leads.count({ where: { agentId: member.id } }),
          prisma.deals.count({ where: { agentId: member.id } }),
          prisma.appointments.count({ where: { agentId: member.id } }),
          prisma.deals.count({ where: { agentId: member.id, stage: "WON" } }),
        ]);

        return {
          ...member,
          stats: {
            leads: leadCount,
            deals: dealCount,
            wonDeals,
            appointments: appointmentCount,
          },
        };
      })
    );

    res.json({
      organizationId: orgId,
      totalMembers: membersWithStats.length,
      members: membersWithStats,
    });
  } catch (error) {
    console.error("Error fetching org team:", error);
    res.status(500).json({ message: "فشل تحميل بيانات الفريق" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/org/stats — Organization overview stats
// ────────────────────────────────────────────────────────────────────────────
router.get("/stats", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const [totalAgents, activeAgents, totalLeads, totalDeals, wonDeals, totalProperties, totalAppointments] = await Promise.all([
      prisma.users.count({ where: { organizationId: orgId } }),
      prisma.users.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.leads.count({ where: { organizationId: orgId } }),
      prisma.deals.count({ where: { organizationId: orgId } }),
      prisma.deals.count({ where: { organizationId: orgId, stage: "WON" } }),
      prisma.properties.count({ where: { organizationId: orgId } }),
      prisma.appointments.count({ where: { organizationId: orgId } }),
    ]);

    const org = await prisma.organizations.findUnique({
      where: { id: orgId },
      select: {
        legalName: true,
        tradeName: true,
        licenseNo: true,
        status: true,
        phone: true,
        email: true,
        website: true,
        address: true,
        city: true,
        region: true,
      },
    });

    res.json({
      organization: org,
      stats: {
        totalAgents,
        activeAgents,
        totalLeads,
        totalDeals,
        wonDeals,
        conversionRate: totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0,
        totalProperties,
        totalAppointments,
      },
    });
  } catch (error) {
    console.error("Error fetching org stats:", error);
    res.status(500).json({ message: "فشل تحميل إحصائيات المنظمة" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/org/team/performance — Per-agent metrics for comparison charts
// ────────────────────────────────────────────────────────────────────────────
router.get("/team/performance", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const members = await prisma.users.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    const agentMetrics = await Promise.all(
      members.map(async (m) => {
        const [leads, deals, wonDeals, appointments] = await Promise.all([
          prisma.leads.count({ where: { agentId: m.id } }),
          prisma.deals.count({ where: { agentId: m.id } }),
          prisma.deals.count({ where: { agentId: m.id, stage: "WON" } }),
          prisma.appointments.count({ where: { agentId: m.id } }),
        ]);

        // Sum agreed price for won deals
        const revenueResult = await prisma.deals.aggregate({
          where: { agentId: m.id, stage: "WON" },
          _sum: { agreedPrice: true },
        });

        return {
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          leads,
          deals,
          wonDeals,
          appointments,
          revenue: Number(revenueResult._sum.agreedPrice || 0),
          conversionRate: deals > 0 ? Math.round((wonDeals / deals) * 100) : 0,
        };
      })
    );

    // Deal stage distribution for the entire org
    const dealStages = await Promise.all(
      ["NEW", "NEGOTIATION", "UNDER_OFFER", "WON", "LOST"].map(async (stage) => ({
        stage,
        count: await prisma.deals.count({ where: { organizationId: orgId, stage: stage as any } }),
      }))
    );

    res.json({ agentMetrics, dealStages });
  } catch (error) {
    console.error("Error fetching performance:", error);
    res.status(500).json({ message: "فشل تحميل بيانات الأداء" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/org/team/:id/activity — Agent's recent activity (last 30 days)
// ────────────────────────────────────────────────────────────────────────────
router.get("/team/:id/activity", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const agentId = req.params.id;

    // Verify agent belongs to our org
    const agent = await prisma.users.findFirst({
      where: { id: agentId, organizationId: orgId },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        roles: true, isActive: true, avatarUrl: true, jobTitle: true, department: true,
        lastLoginAt: true, createdAt: true,
        agent_profiles: {
          select: { licenseNo: true, specialties: true, territories: true, status: true },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ message: "الوكيل غير موجود في منظمتك" });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [leads, deals, appointments, leadCount, dealCount, wonDeals, appointmentCount] = await Promise.all([
      prisma.leads.findMany({
        where: { agentId, createdAt: { gte: thirtyDaysAgo } },
        select: { id: true, status: true, source: true, notes: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.deals.findMany({
        where: { agentId, createdAt: { gte: thirtyDaysAgo } },
        select: {
          id: true, stage: true, agreedPrice: true, currency: true, notes: true, createdAt: true,
          customer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.appointments.findMany({
        where: { agentId, createdAt: { gte: thirtyDaysAgo } },
        select: {
          id: true, status: true, scheduledAt: true, location: true, notes: true, createdAt: true,
          customer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: "desc" },
        take: 20,
      }),
      prisma.leads.count({ where: { agentId } }),
      prisma.deals.count({ where: { agentId } }),
      prisma.deals.count({ where: { agentId, stage: "WON" } }),
      prisma.appointments.count({ where: { agentId } }),
    ]);

    res.json({
      agent,
      stats: { leads: leadCount, deals: dealCount, wonDeals, appointments: appointmentCount },
      recentLeads: leads,
      recentDeals: deals,
      recentAppointments: appointments,
    });
  } catch (error) {
    console.error("Error fetching agent activity:", error);
    res.status(500).json({ message: "فشل تحميل نشاط الوكيل" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/org/team/invite — Add a new agent to the organization
// ────────────────────────────────────────────────────────────────────────────
router.post("/team/invite", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const { firstName, lastName, email, phone, role, specialties, territories } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "الاسم والبريد الإلكتروني مطلوبان" });
    }

    // Check for existing email/username
    const existing = await prisma.users.findFirst({
      where: { OR: [{ email }, { username: email }] },
    });
    if (existing) {
      return res.status(409).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
    }

    // Check phone uniqueness if provided
    if (phone) {
      const existingPhone = await prisma.users.findFirst({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({ message: "رقم الهاتف مستخدم بالفعل" });
      }
    }

    const validRole = role === "CORP_OWNER" ? "CORP_OWNER" : "CORP_AGENT";
    const passwordHash = await hashPassword("agent123");

    // Create user + agent_profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          username: email,
          email,
          firstName,
          lastName,
          phone: phone || null,
          passwordHash,
          roles: JSON.stringify([validRole]),
          organizationId: orgId,
          isActive: true,
          approvalStatus: "APPROVED",
        },
      });

      // Create agent profile
      await tx.agent_profiles.create({
        data: {
          userId: user.id,
          organizationId: orgId,
          licenseNo: `ORG-${Date.now().toString(36).toUpperCase()}`,
          licenseValidTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          territories: territories || "الرياض",
          specialties: specialties || "عام",
          status: "ACTIVE",
          isIndividualAgent: false,
        },
      });

      return user;
    });

    res.status(201).json({
      message: "تم إضافة الوكيل بنجاح",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error inviting agent:", error);
    res.status(500).json({ message: "فشل إضافة الوكيل" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/org/team/:id — Update agent details
// ────────────────────────────────────────────────────────────────────────────
router.put("/team/:id", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const agentId = req.params.id;

    // Verify agent belongs to org
    const agent = await prisma.users.findFirst({
      where: { id: agentId, organizationId: orgId },
      include: { agent_profiles: true },
    });
    if (!agent) {
      return res.status(404).json({ message: "الوكيل غير موجود في منظمتك" });
    }

    const { firstName, lastName, phone, jobTitle, department, specialties, territories } = req.body;

    // Update user record
    const userUpdate: any = {};
    if (firstName) userUpdate.firstName = firstName;
    if (lastName) userUpdate.lastName = lastName;
    if (phone !== undefined) userUpdate.phone = phone || null;
    if (jobTitle !== undefined) userUpdate.jobTitle = jobTitle || null;
    if (department !== undefined) userUpdate.department = department || null;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdate).length > 0) {
        await tx.users.update({ where: { id: agentId }, data: userUpdate });
      }

      // Update agent profile if exists
      if (agent.agent_profiles) {
        const profileUpdate: any = {};
        if (specialties !== undefined) profileUpdate.specialties = specialties;
        if (territories !== undefined) profileUpdate.territories = territories;
        if (Object.keys(profileUpdate).length > 0) {
          await tx.agent_profiles.update({
            where: { id: agent.agent_profiles.id },
            data: profileUpdate,
          });
        }
      }
    });

    res.json({ message: "تم تحديث بيانات الوكيل بنجاح" });
  } catch (error) {
    console.error("Error updating agent:", error);
    res.status(500).json({ message: "فشل تحديث بيانات الوكيل" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// PATCH /api/org/team/:id/toggle-active — Enable/disable agent
// ────────────────────────────────────────────────────────────────────────────
router.patch("/team/:id/toggle-active", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const agentId = req.params.id;

    const agent = await prisma.users.findFirst({
      where: { id: agentId, organizationId: orgId },
    });
    if (!agent) {
      return res.status(404).json({ message: "الوكيل غير موجود في منظمتك" });
    }

    // Prevent disabling yourself
    if (agentId === req.user?.id) {
      return res.status(400).json({ message: "لا يمكنك تعطيل حسابك الخاص" });
    }

    const updated = await prisma.users.update({
      where: { id: agentId },
      data: { isActive: !agent.isActive },
      select: { id: true, isActive: true, firstName: true, lastName: true },
    });

    res.json({
      message: updated.isActive ? "تم تفعيل الوكيل" : "تم تعطيل الوكيل",
      user: updated,
    });
  } catch (error) {
    console.error("Error toggling agent:", error);
    res.status(500).json({ message: "فشل تحديث حالة الوكيل" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// PATCH /api/org/team/:id/change-role — Promote/demote agent
// ────────────────────────────────────────────────────────────────────────────
router.patch("/team/:id/change-role", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const agentId = req.params.id;
    const { role } = req.body;

    if (!role || !["CORP_AGENT", "CORP_OWNER"].includes(role)) {
      return res.status(400).json({ message: "الدور غير صالح" });
    }

    const agent = await prisma.users.findFirst({
      where: { id: agentId, organizationId: orgId },
    });
    if (!agent) {
      return res.status(404).json({ message: "الوكيل غير موجود في منظمتك" });
    }

    // Prevent changing your own role
    if (agentId === req.user?.id) {
      return res.status(400).json({ message: "لا يمكنك تغيير دورك الخاص" });
    }

    await prisma.users.update({
      where: { id: agentId },
      data: { roles: JSON.stringify([role]) },
    });

    res.json({ message: `تم تغيير الدور إلى ${role === "CORP_OWNER" ? "مالك" : "وكيل"} بنجاح` });
  } catch (error) {
    console.error("Error changing role:", error);
    res.status(500).json({ message: "فشل تغيير دور الوكيل" });
  }
});

export default router;
