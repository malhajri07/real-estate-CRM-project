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

export default router;

