import express, { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";

const router = express.Router();

const ReportSchema = z.object({
  listingId: z.string(),
  reason: z.string().min(3),
});

const getUserId = (req: Request): string | undefined => req.user?.id ?? undefined;

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = ReportSchema.parse(req.body);
    const userId = getUserId(req);
    const rec = await storage.createReport({
      listingId: data.listingId,
      reason: data.reason,
    }, userId ?? "");
    res.status(201).json(rec);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid report", errors: err.errors });
    }
    console.error("Error creating report:", err);
    res.status(500).json({ message: "Failed to create report" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    const items = await storage.getAllReports();
    const filtered = status ? items.filter((item: { status?: string }) => item.status === status) : items;
    res.json(filtered);
  } catch (err) {
    console.error("Error listing reports:", err);
    res.status(500).json({ message: "Failed to list reports" });
  }
});

router.post("/:id/resolve", async (req: Request, res: Response) => {
  try {
    const { note } = req.body || {};
    const updated = await storage.updateReport(req.params.id, {
      status: "RESOLVED",
      resolutionNote: note,
    });
    if (!updated) return res.status(404).json({ message: "Report not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error resolving report:", err);
    res.status(500).json({ message: "Failed to resolve report" });
  }
});

export default router;

