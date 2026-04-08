/**
 * org-team.ts — Organization team management routes (Enterprise)
 *
 * Allows CORP_OWNER to see and manage agents in their organization.
 * Scoped to the authenticated user's organizationId.
 *
 * Endpoints:
 *   GET    /api/org/team              — List all agents in org (incl. inactive)
 *   GET    /api/org/stats             — Organization overview stats
 *   GET    /api/org/team/performance  — Per-agent metrics for charts
 *   GET    /api/org/team/leaderboard  — Agent leaderboard with period filter
 *   GET    /api/org/team/export       — Export team data as CSV
 *   GET    /api/org/team/activity-log — Org-wide activity log
 *   GET    /api/org/team/:id/activity — Agent's recent activity (30 days)
 *   GET    /api/org/team/:id/schedule — Agent's weekly schedule
 *   GET    /api/org/team/:id/notes    — Get internal notes about agent
 *   POST   /api/org/team/invite       — Invite (create) new agent
 *   POST   /api/org/team/invite-bulk  — Bulk invite agents
 *   POST   /api/org/team/:id/assign-leads    — Bulk assign leads to agent
 *   POST   /api/org/team/:id/transfer        — Transfer agent's work to another
 *   POST   /api/org/team/:id/set-working-hours — Set agent working hours
 *   POST   /api/org/team/:id/note            — Add internal note about agent
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

// Helper: verify agent belongs to org
async function verifyAgentInOrg(agentId: string, orgId: string) {
  return prisma.users.findFirst({
    where: { id: agentId, organizationId: orgId },
  });
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
        metadata: true,
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

    // Get stats per agent — batch queries instead of N+1
    const memberIds = members.map((m) => m.id);

    const [leadCounts, dealCounts, appointmentCounts, wonDealCounts, revenueResults] = await Promise.all([
      prisma.leads.groupBy({ by: ["agentId"], where: { agentId: { in: memberIds } }, _count: true }),
      prisma.deals.groupBy({ by: ["agentId"], where: { agentId: { in: memberIds } }, _count: true }),
      prisma.appointments.groupBy({ by: ["agentId"], where: { agentId: { in: memberIds } }, _count: true }),
      prisma.deals.groupBy({ by: ["agentId"], where: { agentId: { in: memberIds }, stage: "WON" }, _count: true }),
      prisma.deals.groupBy({ by: ["agentId"], where: { agentId: { in: memberIds }, stage: "WON" }, _sum: { agreedPrice: true } }),
    ]);

    // Build lookup maps
    const leadMap = Object.fromEntries(leadCounts.map((r) => [r.agentId, r._count]));
    const dealMap = Object.fromEntries(dealCounts.map((r) => [r.agentId, r._count]));
    const apptMap = Object.fromEntries(appointmentCounts.map((r) => [r.agentId, r._count]));
    const wonMap = Object.fromEntries(wonDealCounts.map((r) => [r.agentId, r._count]));
    const revMap = Object.fromEntries(revenueResults.map((r) => [r.agentId, Number(r._sum.agreedPrice || 0)]));

    const membersWithStats = members.map((member) => ({
      ...member,
      stats: {
        leads: leadMap[member.id] || 0,
        deals: dealMap[member.id] || 0,
        wonDeals: wonMap[member.id] || 0,
        appointments: apptMap[member.id] || 0,
        revenue: revMap[member.id] || 0,
      },
    }));

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

    // Revenue totals
    const revenueResult = await prisma.deals.aggregate({
      where: { organizationId: orgId, stage: "WON" },
      _sum: { agreedPrice: true },
    });

    // Recent hires (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentHires = await prisma.users.count({
      where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
    });

    // Unassigned leads (agentId is a placeholder or leads without follow-up)
    const unassignedLeads = await prisma.leads.count({
      where: { organizationId: orgId, status: "NEW" },
    });

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
        inactiveAgents: totalAgents - activeAgents,
        totalLeads,
        totalDeals,
        wonDeals,
        conversionRate: totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0,
        totalProperties,
        totalAppointments,
        totalRevenue: Number(revenueResult._sum.agreedPrice || 0),
        recentHires,
        unassignedLeads,
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

    const period = (req.query.period as string) || "all";
    let dateFilter: Date | null = null;

    if (period !== "all") {
      dateFilter = new Date();
      switch (period) {
        case "week":
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case "month":
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case "quarter":
          dateFilter.setMonth(dateFilter.getMonth() - 3);
          break;
        case "year":
          dateFilter.setFullYear(dateFilter.getFullYear() - 1);
          break;
        default:
          dateFilter = null;
      }
    }

    const dateWhere = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    const members = await prisma.users.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    const agentMetrics = await Promise.all(
      members.map(async (m) => {
        const [leads, deals, wonDeals, appointments] = await Promise.all([
          prisma.leads.count({ where: { agentId: m.id, ...dateWhere } }),
          prisma.deals.count({ where: { agentId: m.id, ...dateWhere } }),
          prisma.deals.count({ where: { agentId: m.id, stage: "WON", ...dateWhere } }),
          prisma.appointments.count({ where: { agentId: m.id, ...dateWhere } }),
        ]);

        // Sum agreed price for won deals
        const revenueResult = await prisma.deals.aggregate({
          where: { agentId: m.id, stage: "WON", ...dateWhere },
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
        count: await prisma.deals.count({ where: { organizationId: orgId, stage: stage as any, ...dateWhere } }),
      }))
    );

    // Monthly trend: deals count per month for last 6 months
    const monthlyTrend: { month: string; deals: number; wonDeals: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const [monthDeals, monthWon, monthRevenue] = await Promise.all([
        prisma.deals.count({ where: { organizationId: orgId, createdAt: { gte: start, lt: end } } }),
        prisma.deals.count({ where: { organizationId: orgId, stage: "WON", createdAt: { gte: start, lt: end } } }),
        prisma.deals.aggregate({
          where: { organizationId: orgId, stage: "WON", createdAt: { gte: start, lt: end } },
          _sum: { agreedPrice: true },
        }),
      ]);

      const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      monthlyTrend.push({
        month: monthNames[start.getMonth()],
        deals: monthDeals,
        wonDeals: monthWon,
        revenue: Number(monthRevenue._sum.agreedPrice || 0),
      });
    }

    res.json({ agentMetrics, dealStages, monthlyTrend });
  } catch (error) {
    console.error("Error fetching performance:", error);
    res.status(500).json({ message: "فشل تحميل بيانات الأداء" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/org/team/leaderboard — Agent leaderboard with period filter
// ────────────────────────────────────────────────────────────────────────────
router.get("/team/leaderboard", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const period = (req.query.period as string) || "month";
    let dateFilter = new Date();

    switch (period) {
      case "week":
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case "month":
        dateFilter.setMonth(dateFilter.getMonth() - 1);
        break;
      case "quarter":
        dateFilter.setMonth(dateFilter.getMonth() - 3);
        break;
      case "year":
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        break;
      default:
        dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    const dateWhere = { createdAt: { gte: dateFilter } };

    const members = await prisma.users.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true, department: true, jobTitle: true },
    });

    const leaderboard = await Promise.all(
      members.map(async (m) => {
        const [leadsTotal, leadsConverted, deals, wonDeals, appointments, revenue] = await Promise.all([
          prisma.leads.count({ where: { agentId: m.id, ...dateWhere } }),
          prisma.leads.count({ where: { agentId: m.id, status: "WON", ...dateWhere } }),
          prisma.deals.count({ where: { agentId: m.id, ...dateWhere } }),
          prisma.deals.count({ where: { agentId: m.id, stage: "WON", ...dateWhere } }),
          prisma.appointments.count({ where: { agentId: m.id, ...dateWhere } }),
          prisma.deals.aggregate({
            where: { agentId: m.id, stage: "WON", ...dateWhere },
            _sum: { agreedPrice: true },
          }),
        ]);

        return {
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          avatarUrl: m.avatarUrl,
          department: m.department,
          jobTitle: m.jobTitle,
          leadsTotal,
          leadsConverted,
          deals,
          wonDeals,
          appointments,
          revenue: Number(revenue._sum.agreedPrice || 0),
          conversionRate: deals > 0 ? Math.round((wonDeals / deals) * 100) : 0,
          leadConversionRate: leadsTotal > 0 ? Math.round((leadsConverted / leadsTotal) * 100) : 0,
        };
      })
    );

    // Sort by wonDeals desc, then revenue desc
    leaderboard.sort((a, b) => b.wonDeals - a.wonDeals || b.revenue - a.revenue);

    res.json({ period, leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "فشل تحميل لوحة المتصدرين" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/org/team/export — Export team data as CSV
// ────────────────────────────────────────────────────────────────────────────
router.get("/team/export", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const members = await prisma.users.findMany({
      where: { organizationId: orgId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        roles: true,
        isActive: true,
        jobTitle: true,
        department: true,
        lastLoginAt: true,
        createdAt: true,
        agent_profiles: {
          select: { licenseNo: true, territories: true, specialties: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get stats per member
    const rows = await Promise.all(
      members.map(async (m) => {
        const [leads, deals, wonDeals, revenue] = await Promise.all([
          prisma.leads.count({ where: { agentId: m.email || "" } }),
          prisma.deals.count({ where: { agentId: m.email || "" } }),
          prisma.deals.count({ where: { agentId: m.email || "", stage: "WON" } }),
          prisma.deals.aggregate({ where: { agentId: m.email || "", stage: "WON" }, _sum: { agreedPrice: true } }),
        ]);

        return {
          ...m,
          leads,
          deals,
          wonDeals,
          revenue: Number(revenue._sum.agreedPrice || 0),
        };
      })
    );

    // Build CSV
    const BOM = "\uFEFF"; // For Arabic support in Excel
    const headers = [
      "الاسم الأول",
      "اسم العائلة",
      "البريد الإلكتروني",
      "الهاتف",
      "الدور",
      "الحالة",
      "المسمى الوظيفي",
      "القسم",
      "رقم الرخصة",
      "المنطقة",
      "التخصص",
      "تاريخ الانضمام",
      "آخر دخول",
    ];

    const csvRows = [headers.join(",")];
    for (const m of members) {
      const roles = (() => { try { return JSON.parse(m.roles); } catch { return []; } })();
      csvRows.push(
        [
          m.firstName,
          m.lastName,
          m.email || "",
          m.phone || "",
          roles.includes("CORP_OWNER") ? "مالك المنظمة" : "وكيل",
          m.isActive ? "نشط" : "معطل",
          m.jobTitle || "",
          m.department || "",
          m.agent_profiles?.licenseNo || "",
          m.agent_profiles?.territories || "",
          m.agent_profiles?.specialties || "",
          m.createdAt ? new Date(m.createdAt).toISOString().split("T")[0] : "",
          m.lastLoginAt ? new Date(m.lastLoginAt).toISOString().split("T")[0] : "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    }

    const csv = BOM + csvRows.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=team-export.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting team:", error);
    res.status(500).json({ message: "فشل تصدير بيانات الفريق" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/org/team/activity-log — Org-wide activity log
// ────────────────────────────────────────────────────────────────────────────
router.get("/team/activity-log", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const agentFilter = req.query.agentId as string | undefined;
    const typeFilter = req.query.type as string | undefined;

    // Get all org member IDs
    const orgMembers = await prisma.users.findMany({
      where: { organizationId: orgId },
      select: { id: true, firstName: true, lastName: true },
    });
    const memberIds = orgMembers.map((m) => m.id);
    const memberMap = new Map(orgMembers.map((m) => [m.id, `${m.firstName} ${m.lastName}`]));

    const userIdFilter = agentFilter && memberIds.includes(agentFilter)
      ? agentFilter
      : undefined;

    // Build entity filter
    const entityFilter = typeFilter && ["leads", "deals", "appointments", "users"].includes(typeFilter)
      ? typeFilter
      : undefined;

    const where: any = {
      userId: userIdFilter ? userIdFilter : { in: memberIds },
      ...(entityFilter ? { entity: entityFilter } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          action: true,
          entity: true,
          entityId: true,
          afterJson: true,
          createdAt: true,
        },
      }),
      prisma.audit_logs.count({ where }),
    ]);

    const enrichedLogs = logs.map((log) => ({
      ...log,
      agentName: memberMap.get(log.userId) || "غير معروف",
    }));

    res.json({
      logs: enrichedLogs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.status(500).json({ message: "فشل تحميل سجل النشاط" });
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
        lastLoginAt: true, createdAt: true, metadata: true,
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

    const [leads, deals, appointments, leadCount, dealCount, wonDeals, appointmentCount, revenueResult, notes] = await Promise.all([
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
      prisma.deals.aggregate({
        where: { agentId, stage: "WON" },
        _sum: { agreedPrice: true },
      }),
      // Get internal notes
      prisma.audit_logs.findMany({
        where: { entityId: agentId, action: "AGENT_NOTE" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          userId: true,
          afterJson: true,
          createdAt: true,
          users: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    // Monthly deals for sparkline (last 6 months)
    const monthlyDeals: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const count = await prisma.deals.count({
        where: { agentId, createdAt: { gte: start, lt: end } },
      });
      monthlyDeals.push(count);
    }

    res.json({
      agent,
      stats: {
        leads: leadCount,
        deals: dealCount,
        wonDeals,
        appointments: appointmentCount,
        revenue: Number(revenueResult._sum.agreedPrice || 0),
      },
      monthlyDeals,
      notes: notes.map((n) => ({
        id: n.id,
        content: n.afterJson || "",
        authorName: `${n.users.firstName} ${n.users.lastName}`,
        createdAt: n.createdAt,
      })),
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
// GET /api/org/team/:id/schedule — Agent's weekly schedule
// ────────────────────────────────────────────────────────────────────────────
router.get("/team/:id/schedule", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const agentId = req.params.id;
    const agent = await verifyAgentInOrg(agentId, orgId);
    if (!agent) {
      return res.status(404).json({ message: "الوكيل غير موجود في منظمتك" });
    }

    // Get current week (Saturday to Friday for Saudi week)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    // Adjust to get Saturday as start of week
    const saturdayOffset = dayOfWeek >= 6 ? dayOfWeek - 6 : dayOfWeek + 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - saturdayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const appointments = await prisma.appointments.findMany({
      where: {
        agentId,
        scheduledAt: { gte: weekStart, lt: weekEnd },
      },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        location: true,
        notes: true,
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Group by day
    const dayNames = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
    const schedule: Record<string, typeof appointments> = {};
    dayNames.forEach((d) => { schedule[d] = []; });

    for (const apt of appointments) {
      const aptDate = new Date(apt.scheduledAt);
      const aptDay = aptDate.getDay();
      // Map JS day to Saudi week index
      const saudiIndex = aptDay === 6 ? 0 : aptDay + 1;
      const dayName = dayNames[saudiIndex] || dayNames[0];
      schedule[dayName].push(apt);
    }

    // Get working hours from user metadata
    const user = await prisma.users.findUnique({
      where: { id: agentId },
      select: { metadata: true },
    });

    let workingHours: any[] = [];
    if (user?.metadata && typeof user.metadata === "object" && !Array.isArray(user.metadata)) {
      const meta = user.metadata as Record<string, any>;
      workingHours = meta.workingHours || [];
    }

    res.json({ schedule, workingHours, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ message: "فشل تحميل الجدول" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/org/team/:id/notes — Get internal notes about agent
// ────────────────────────────────────────────────────────────────────────────
router.get("/team/:id/notes", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const agentId = req.params.id;
    const agent = await verifyAgentInOrg(agentId, orgId);
    if (!agent) {
      return res.status(404).json({ message: "الوكيل غير موجود في منظمتك" });
    }

    const notes = await prisma.audit_logs.findMany({
      where: { entityId: agentId, action: "AGENT_NOTE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        afterJson: true,
        createdAt: true,
        users: { select: { firstName: true, lastName: true } },
      },
    });

    res.json({
      notes: notes.map((n) => ({
        id: n.id,
        content: n.afterJson || "",
        authorName: `${n.users.firstName} ${n.users.lastName}`,
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ message: "فشل تحميل الملاحظات" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/org/team/invite — Add a new agent to the organization
// ────────────────────────────────────────────────────────────────────────────
router.post("/team/invite", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const { firstName, lastName, email, phone, role, specialties, territories, department } = req.body;

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
    const passwordHash = await hashPassword(process.env.DEFAULT_AGENT_PASSWORD || "ChangeMe!2025");

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
          department: department || null,
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
// POST /api/org/team/invite-bulk — Bulk invite agents
// ────────────────────────────────────────────────────────────────────────────
router.post("/team/invite-bulk", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const { agents } = req.body as {
      agents: { firstName: string; lastName: string; email: string; phone?: string; role?: string; department?: string }[];
    };

    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      return res.status(400).json({ message: "يجب تقديم قائمة وكلاء صالحة" });
    }

    if (agents.length > 50) {
      return res.status(400).json({ message: "لا يمكن دعوة أكثر من 50 وكيل في المرة الواحدة" });
    }

    const results: { email: string; success: boolean; error?: string }[] = [];
    const passwordHash = await hashPassword(process.env.DEFAULT_AGENT_PASSWORD || "ChangeMe!2025");

    for (const agent of agents) {
      try {
        if (!agent.firstName || !agent.lastName || !agent.email) {
          results.push({ email: agent.email || "unknown", success: false, error: "بيانات ناقصة" });
          continue;
        }

        const existing = await prisma.users.findFirst({
          where: { OR: [{ email: agent.email }, { username: agent.email }] },
        });
        if (existing) {
          results.push({ email: agent.email, success: false, error: "البريد مستخدم" });
          continue;
        }

        const validRole = agent.role === "CORP_OWNER" ? "CORP_OWNER" : "CORP_AGENT";

        await prisma.$transaction(async (tx) => {
          const user = await tx.users.create({
            data: {
              username: agent.email,
              email: agent.email,
              firstName: agent.firstName,
              lastName: agent.lastName,
              phone: agent.phone || null,
              passwordHash,
              roles: JSON.stringify([validRole]),
              organizationId: orgId,
              isActive: true,
              approvalStatus: "APPROVED",
              department: agent.department || null,
            },
          });

          await tx.agent_profiles.create({
            data: {
              userId: user.id,
              organizationId: orgId,
              licenseNo: `ORG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
              licenseValidTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              territories: "الرياض",
              specialties: "عام",
              status: "ACTIVE",
              isIndividualAgent: false,
            },
          });
        });

        results.push({ email: agent.email, success: true });
      } catch {
        results.push({ email: agent.email, success: false, error: "خطأ في الإضافة" });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    res.status(201).json({
      message: `تم إضافة ${successCount} من ${agents.length} وكيل`,
      results,
    });
  } catch (error) {
    console.error("Error bulk inviting agents:", error);
    res.status(500).json({ message: "فشل الدعوة الجماعية" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/org/team/:id/assign-leads — Bulk assign leads to agent
// ────────────────────────────────────────────────────────────────────────────
router.post("/team/:id/assign-leads", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const agentId = req.params.id;
    const { leadIds } = req.body as { leadIds: string[] };

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ message: "يجب تحديد عملاء للتعيين" });
    }

    // Verify agent belongs to org
    const agent = await verifyAgentInOrg(agentId, orgId);
    if (!agent) {
      return res.status(404).json({ message: "الوكيل غير موجود في منظمتك" });
    }

    // Verify all leads belong to org
    const leads = await prisma.leads.findMany({
      where: { id: { in: leadIds }, organizationId: orgId },
      select: { id: true },
    });

    const validIds = leads.map((l) => l.id);

    const updated = await prisma.leads.updateMany({
      where: { id: { in: validIds } },
      data: {
        agentId,
        assignedAt: new Date(),
      },
    });

    // Log the assignment
    await prisma.audit_logs.create({
      data: {
        userId: req.user!.id,
        action: "BULK_ASSIGN_LEADS",
        entity: "leads",
        entityId: agentId,
        afterJson: JSON.stringify({ leadIds: validIds, agentId }),
      },
    });

    res.json({
      message: `تم تعيين ${updated.count} عميل للوكيل`,
      assigned: updated.count,
    });
  } catch (error) {
    console.error("Error assigning leads:", error);
    res.status(500).json({ message: "فشل تعيين العملاء" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/org/team/:id/transfer — Transfer agent's work to another
// ────────────────────────────────────────────────────────────────────────────
router.post("/team/:id/transfer", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const sourceAgentId = req.params.id;
    const { targetAgentId, transferLeads, transferDeals, transferAppointments } = req.body as {
      targetAgentId: string;
      transferLeads: boolean;
      transferDeals: boolean;
      transferAppointments: boolean;
    };

    if (!targetAgentId) {
      return res.status(400).json({ message: "يجب تحديد الوكيل المستلم" });
    }

    if (sourceAgentId === targetAgentId) {
      return res.status(400).json({ message: "لا يمكن النقل لنفس الوكيل" });
    }

    // Verify both agents belong to org
    const [source, target] = await Promise.all([
      verifyAgentInOrg(sourceAgentId, orgId),
      verifyAgentInOrg(targetAgentId, orgId),
    ]);

    if (!source) return res.status(404).json({ message: "الوكيل المصدر غير موجود في منظمتك" });
    if (!target) return res.status(404).json({ message: "الوكيل المستلم غير موجود في منظمتك" });

    const results: Record<string, number> = {};

    if (transferLeads) {
      const result = await prisma.leads.updateMany({
        where: { agentId: sourceAgentId, organizationId: orgId },
        data: { agentId: targetAgentId, assignedAt: new Date() },
      });
      results.leads = result.count;
    }

    if (transferDeals) {
      const result = await prisma.deals.updateMany({
        where: { agentId: sourceAgentId, organizationId: orgId },
        data: { agentId: targetAgentId },
      });
      results.deals = result.count;
    }

    if (transferAppointments) {
      const result = await prisma.appointments.updateMany({
        where: { agentId: sourceAgentId, organizationId: orgId },
        data: { agentId: targetAgentId },
      });
      results.appointments = result.count;
    }

    // Log the transfer
    await prisma.audit_logs.create({
      data: {
        userId: req.user!.id,
        action: "AGENT_WORK_TRANSFER",
        entity: "users",
        entityId: sourceAgentId,
        afterJson: JSON.stringify({
          from: sourceAgentId,
          to: targetAgentId,
          transferred: results,
        }),
      },
    });

    res.json({
      message: "تم نقل الأعمال بنجاح",
      transferred: results,
    });
  } catch (error) {
    console.error("Error transferring work:", error);
    res.status(500).json({ message: "فشل نقل الأعمال" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/org/team/:id/set-working-hours — Set agent working hours
// ────────────────────────────────────────────────────────────────────────────
router.post("/team/:id/set-working-hours", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const agentId = req.params.id;
    const { workingHours } = req.body as {
      workingHours: { day: string; start: string; end: string; isOff: boolean }[];
    };

    if (!workingHours || !Array.isArray(workingHours)) {
      return res.status(400).json({ message: "يجب تقديم ساعات العمل" });
    }

    const agent = await verifyAgentInOrg(agentId, orgId);
    if (!agent) {
      return res.status(404).json({ message: "الوكيل غير موجود في منظمتك" });
    }

    // Get current metadata and merge working hours
    const user = await prisma.users.findUnique({
      where: { id: agentId },
      select: { metadata: true },
    });

    const currentMeta = (user?.metadata && typeof user.metadata === "object" && !Array.isArray(user.metadata))
      ? (user.metadata as Record<string, any>)
      : {};

    await prisma.users.update({
      where: { id: agentId },
      data: {
        metadata: {
          ...currentMeta,
          workingHours,
        },
      },
    });

    res.json({ message: "تم تحديث ساعات العمل بنجاح" });
  } catch (error) {
    console.error("Error setting working hours:", error);
    res.status(500).json({ message: "فشل تحديث ساعات العمل" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/org/team/:id/note — Add internal note about agent
// ────────────────────────────────────────────────────────────────────────────
router.post("/team/:id/note", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req, res);
    if (!orgId) return;

    const agentId = req.params.id;
    const { content } = req.body as { content: string };

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "محتوى الملاحظة مطلوب" });
    }

    const agent = await verifyAgentInOrg(agentId, orgId);
    if (!agent) {
      return res.status(404).json({ message: "الوكيل غير موجود في منظمتك" });
    }

    const note = await prisma.audit_logs.create({
      data: {
        userId: req.user!.id,
        action: "AGENT_NOTE",
        entity: "users",
        entityId: agentId,
        afterJson: content.trim(),
      },
    });

    res.status(201).json({
      message: "تم إضافة الملاحظة بنجاح",
      note: {
        id: note.id,
        content: note.afterJson,
        createdAt: note.createdAt,
      },
    });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ message: "فشل إضافة الملاحظة" });
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

    // Log the toggle
    await prisma.audit_logs.create({
      data: {
        userId: req.user!.id,
        action: updated.isActive ? "AGENT_ACTIVATED" : "AGENT_DEACTIVATED",
        entity: "users",
        entityId: agentId,
        afterJson: JSON.stringify({ isActive: updated.isActive }),
      },
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
