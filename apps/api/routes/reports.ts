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

// @ts-nocheck
import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";

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


// Dashboard metrics
router.get("/dashboard/metrics", async (req, res) => {
  try {
    const leads = await storage.getAllLeads();
    const properties = await storage.getAllProperties();
    const deals = await storage.getAllDeals();

    const activeDeals = deals.filter((deal: any) => !['closed', 'lost'].includes(deal.stage));
    const closedDeals = deals.filter((deal: any) => deal.stage === 'closed');

    const monthlyRevenue = closedDeals.reduce((sum: number, deal: any) => {
      const commission = deal.commission ? parseFloat(deal.commission) : 0;
      return sum + commission;
    }, 0);

    const metrics = {
      totalLeads: leads.length,
      activeProperties: properties.filter((p: any) => p.status === 'active').length,
      dealsInPipeline: activeDeals.length,
      monthlyRevenue: monthlyRevenue,
      pipelineByStage: {
        lead: deals.filter((d: any) => d.stage === 'lead').length,
        qualified: deals.filter((d: any) => d.stage === 'qualified').length,
        showing: deals.filter((d: any) => d.stage === 'showing').length,
        negotiation: deals.filter((d: any) => d.stage === 'negotiation').length,
        closed: deals.filter((d: any) => d.stage === 'closed').length,
      }
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard metrics" });
  }
});

// Monthly revenue chart data (last 12 months)
router.get("/dashboard/revenue-chart", async (req, res) => {
  try {
    const deals = await storage.getAllDeals();
    // Filter closed deals - check for 'closed' stage or 'won' stage
    const closedDeals = deals.filter((deal: any) => {
      const stage = deal.stage?.toLowerCase();
      return (stage === 'closed' || stage === 'won') && (deal.closedAt || deal.wonAt || deal.updatedAt);
    });

    // Get last 12 months
    const now = new Date();
    const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Use locale from middleware if available, otherwise parse Accept-Language header
    const locale = (req as any).locale || (req.headers['accept-language'] || '').split(',')[0]?.split('-')[0] || 'ar';
    const language = locale === 'ar' ? 'ar' : 'en';
    const monthNames = language === 'ar' ? monthNamesAr : monthNamesEn;

    const monthlyRevenueMap = new Map<string, number>();
    
    // Initialize all 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthNames[date.getMonth()];
      monthlyRevenueMap.set(monthKey, 0);
    }

    // Calculate revenue per month from closed deals
    closedDeals.forEach((deal: any) => {
      // Use closedAt, wonAt, or updatedAt as fallback
      const closedDate = deal.closedAt || deal.wonAt || deal.updatedAt;
      if (closedDate) {
        const date = new Date(closedDate);
        // Only include deals from last 12 months
        const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        if (monthsDiff >= 0 && monthsDiff < 12) {
          const monthKey = monthNames[date.getMonth()];
          const currentRevenue = monthlyRevenueMap.get(monthKey) || 0;
          // Try to get commission from various possible fields
          const commission = deal.commission 
            ? parseFloat(deal.commission) 
            : (deal.agreedPrice ? parseFloat(deal.agreedPrice) * 0.03 : 0); // Default 3% if no commission field
          monthlyRevenueMap.set(monthKey, currentRevenue + commission);
        }
      }
    });

    // Convert to array format for chart (last 12 months in order)
    const chartData = Array.from(monthlyRevenueMap.entries()).map(([name, revenue]) => ({
      name,
      revenue: Math.round(revenue)
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Error fetching revenue chart data:", error);
    const locale = (req as any).locale || (req.headers['accept-language'] || '').split(',')[0]?.split('-')[0] || 'ar';
    const errorMessage = locale === 'ar' 
      ? "فشل في جلب بيانات الرسم البياني للإيرادات"
      : "Failed to fetch revenue chart data";
    res.status(500).json({ 
      error: "REVENUE_CHART_FETCH_ERROR",
      message: errorMessage,
      locale 
    });
  }
});

export default router;

