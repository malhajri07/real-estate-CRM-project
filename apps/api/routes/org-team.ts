/**
 * org-team.ts — Organization team management routes
 *
 * Allows CORP_OWNER to see and manage agents in their organization.
 * Scoped to the authenticated user's organizationId.
 */

import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../auth";
import { normalizeRoleKeys, UserRole } from "@shared/rbac";

const router = Router();

// Middleware: require CORP_OWNER or WEBSITE_ADMIN
const requireOwnerOrAdmin = (req: Request, res: Response, next: any) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Authentication required" });
  const roles = normalizeRoleKeys(user.roles);
  if (!roles.includes(UserRole.CORP_OWNER) && !roles.includes(UserRole.WEBSITE_ADMIN)) {
    return res.status(403).json({ message: "يجب أن تكون مالك المنظمة للوصول لهذه الصفحة" });
  }
  next();
};

// GET /api/org/team — List all agents in my organization
router.get("/team", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(400).json({ message: "لا توجد منظمة مرتبطة بحسابك" });

    const members = await prisma.users.findMany({
      where: { organizationId: orgId, isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        roles: true,
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
        const [leadCount, dealCount, appointmentCount] = await Promise.all([
          prisma.leads.count({ where: { agentId: member.id } }),
          prisma.deals.count({ where: { agentId: member.id } }),
          prisma.appointments.count({ where: { agentId: member.id } }),
        ]);

        const wonDeals = await prisma.deals.count({
          where: { agentId: member.id, stage: "WON" },
        });

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

// GET /api/org/stats — Organization overview stats
router.get("/stats", authenticateToken, requireOwnerOrAdmin, async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(400).json({ message: "لا توجد منظمة" });

    const [totalAgents, totalLeads, totalDeals, wonDeals, totalProperties, totalAppointments] = await Promise.all([
      prisma.users.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.leads.count({ where: { organizationId: orgId } }),
      prisma.deals.count({ where: { organizationId: orgId } }),
      prisma.deals.count({ where: { organizationId: orgId, stage: "WON" } }),
      prisma.properties.count({ where: { organizationId: orgId } }),
      prisma.appointments.count({ where: { organizationId: orgId } }),
    ]);

    const org = await prisma.organizations.findUnique({
      where: { id: orgId },
      select: { legalName: true, tradeName: true, licenseNo: true, status: true, phone: true, email: true, website: true },
    });

    res.json({
      organization: org,
      stats: {
        totalAgents,
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

export default router;
