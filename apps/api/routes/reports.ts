/**
 * routes/reports.ts - Reports API Routes
 * 
 * Location: apps/api/ → Routes/ → reports.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for reporting functionality. Handles:
 * - Property listing reports
 * - User reporting of inappropriate content
 * 
 * API Endpoints:
 * - POST /api/reports - Submit a report
 * 
 * Related Files:
 * - apps/web/src/pages/reports.tsx - Reports page
 */

import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";
import { getVisibilityScope } from "../rbac-policy";

const router = express.Router();

const ReportSchema = z.object({
  listingId: z.string(),
  reason: z.string().min(3),
});

router.post("/", async (req, res) => {
  try {
    const data = ReportSchema.parse(req.body);
    const userId = (req as any)?.user?.id || null;
    const rec = await storage.createReport({
      listingId: data.listingId,
      reason: data.reason,
    } as any, userId);
    res.status(201).json(rec);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid report", errors: err.errors });
    }
    console.error("Error creating report:", err);
    res.status(500).json({ message: "Failed to create report" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    const items = await storage.listReports(status);
    res.json(items);
  } catch (err) {
    console.error("Error listing reports:", err);
    res.status(500).json({ message: "Failed to list reports" });
  }
});

router.post("/:id/resolve", async (req, res) => {
  try {
    const { note } = req.body || {};
    const updated = await storage.resolveReport(req.params.id, note);
    if (!updated) return res.status(404).json({ message: "Report not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error resolving report:", err);
    res.status(500).json({ message: "Failed to resolve report" });
  }
});


// Helper: normalize deal stage (backend may use 'stage' or 'status')
function getDealStage(deal: any): string {
  const raw = deal?.stage ?? deal?.status;
  return typeof raw === "string" ? raw.toLowerCase().trim() : "";
}

// Dashboard metrics — scoped by role and optional ?view= param
// ?view=personal → always agent's own data (for CORP_AGENT personal cards)
// ?view=org → org-wide data (for CORP_OWNER/CORP_AGENT aggregate cards)
// Default: uses rbac scope (admin=global, corp=corporate, indiv=self)
router.get("/dashboard/metrics", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const viewParam = req.query.view as string | undefined;
    const scope = getVisibilityScope(user.roles);

    let leadsWhere: any = {};
    let dealsWhere: any = {};
    let propertiesWhere: any = {};

    if (viewParam === "personal") {
      // Force personal scope regardless of role
      leadsWhere = { agentId: user.id };
      dealsWhere = { agentId: user.id };
      propertiesWhere = { agentId: user.id };
    } else if (viewParam === "org" && user.organizationId) {
      // Force org scope
      leadsWhere = { organizationId: user.organizationId };
      dealsWhere = { organizationId: user.organizationId };
      propertiesWhere = { organizationId: user.organizationId };
    } else if (scope === "global") {
      // Admin sees all
    } else if (scope === "corporate" && user.organizationId) {
      leadsWhere = { organizationId: user.organizationId };
      dealsWhere = { organizationId: user.organizationId };
      propertiesWhere = { organizationId: user.organizationId };
    } else {
      leadsWhere = { agentId: user.id };
      dealsWhere = { agentId: user.id };
      propertiesWhere = { agentId: user.id };
    }

    const [leadsCount, propertiesCount, deals] = await Promise.all([
      prisma.leads.count({ where: leadsWhere }),
      prisma.properties.count({ where: { ...propertiesWhere, status: "ACTIVE" } }),
      prisma.deals.findMany({ where: dealsWhere, select: { stage: true, agreedPrice: true, commissionPercentage: true, commissionAmount: true, wonAt: true, createdAt: true } }),
    ]);

    const activeDeals = deals.filter((d: any) => !["WON", "LOST"].includes(d.stage));
    const wonDeals = deals.filter((d: any) => d.stage === "WON");

    // Monthly revenue: sum of commission from won deals this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = wonDeals
      .filter((d: any) => new Date(d.wonAt || d.createdAt) >= monthStart)
      .reduce((sum: number, d: any) => {
        if (d.commissionAmount) return sum + Number(d.commissionAmount);
        if (d.agreedPrice && d.commissionPercentage) return sum + Number(d.agreedPrice) * Number(d.commissionPercentage) / 100;
        if (d.agreedPrice) return sum + Number(d.agreedPrice) * 0.025; // default 2.5%
        return sum;
      }, 0);

    res.json({
      totalLeads: leadsCount,
      activeProperties: propertiesCount,
      dealsInPipeline: activeDeals.length,
      monthlyRevenue: Math.round(monthlyRevenue),
      pipelineByStage: {
        lead: deals.filter((d: any) => d.stage === "NEW").length,
        qualified: deals.filter((d: any) => d.stage === "NEGOTIATION").length,
        showing: deals.filter((d: any) => d.stage === "UNDER_OFFER").length,
        negotiation: deals.filter((d: any) => d.stage === "NEGOTIATION").length,
        closed: deals.filter((d: any) => d.stage === "WON").length,
      },
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard metrics" });
  }
});

// Monthly revenue chart data (last 12 months) — scoped to agent
router.get("/dashboard/revenue-chart", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const scope = getVisibilityScope(user.roles);

    let dealsWhere: any = {};
    if (scope === "corporate" && user.organizationId) {
      dealsWhere = { organizationId: user.organizationId };
    } else if (scope !== "global") {
      dealsWhere = { agentId: user.id };
    }

    const deals = await prisma.deals.findMany({
      where: { ...dealsWhere, stage: "WON" },
      select: { agreedPrice: true, commissionAmount: true, commissionPercentage: true, wonAt: true, createdAt: true },
    });

    const now = new Date();
    const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const locale = (req as any).locale || "ar";
    const monthNames = locale === "ar" ? monthNamesAr : monthNamesEn;

    const monthlyRevenueMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyRevenueMap.set(monthNames[date.getMonth()], 0);
    }

    deals.forEach((deal: any) => {
      const closedDate = deal.wonAt || deal.createdAt;
      if (!closedDate) return;
      const date = new Date(closedDate);
      const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (monthsDiff >= 0 && monthsDiff < 12) {
        const monthKey = monthNames[date.getMonth()];
        const current = monthlyRevenueMap.get(monthKey) || 0;
        const commission = deal.commissionAmount
          ? Number(deal.commissionAmount)
          : deal.agreedPrice
            ? Number(deal.agreedPrice) * (deal.commissionPercentage ? Number(deal.commissionPercentage) / 100 : 0.025)
            : 0;
        monthlyRevenueMap.set(monthKey, current + commission);
      }
    });

    res.json(Array.from(monthlyRevenueMap.entries()).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) })));
  } catch (error) {
    console.error("Revenue chart error:", error);
    res.status(500).json({ message: "Failed to fetch revenue chart data" });
  }
});

// Agent leaderboard — CORP_OWNER sees top agents by deals/revenue
router.get("/dashboard/leaderboard", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const roles = typeof user.roles === "string" ? JSON.parse(user.roles) : user.roles;

    if (!roles.includes("CORP_OWNER") && !roles.includes("WEBSITE_ADMIN")) {
      return res.status(403).json({ message: "صلاحيات غير كافية" });
    }

    const orgId = user.organizationId;
    if (!orgId && !roles.includes("WEBSITE_ADMIN")) {
      return res.json([]);
    }

    const agentWhere = orgId ? { organizationId: orgId, isActive: true } : { isActive: true };

    const agents = await prisma.users.findMany({
      where: agentWhere,
      select: { id: true, firstName: true, lastName: true },
      take: 50,
    });

    const agentIds = agents.map((a) => a.id);

    const [dealCounts, wonCounts, revenues] = await Promise.all([
      prisma.deals.groupBy({ by: ["agentId"], where: { agentId: { in: agentIds } }, _count: true }),
      prisma.deals.groupBy({ by: ["agentId"], where: { agentId: { in: agentIds }, stage: "WON" }, _count: true }),
      prisma.deals.groupBy({ by: ["agentId"], where: { agentId: { in: agentIds }, stage: "WON" }, _sum: { agreedPrice: true } }),
    ]);

    const dealMap = Object.fromEntries(dealCounts.map((r) => [r.agentId, r._count]));
    const wonMap = Object.fromEntries(wonCounts.map((r) => [r.agentId, r._count]));
    const revMap = Object.fromEntries(revenues.map((r) => [r.agentId, Number(r._sum.agreedPrice || 0)]));

    const leaderboard = agents
      .map((agent) => ({
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        deals: dealMap[agent.id] || 0,
        wonDeals: wonMap[agent.id] || 0,
        revenue: revMap[agent.id] || 0,
        conversionRate: (dealMap[agent.id] || 0) > 0
          ? Math.round(((wonMap[agent.id] || 0) / (dealMap[agent.id] || 1)) * 100)
          : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ message: "فشل تحميل ترتيب الوسطاء" });
  }
});

export default router;

