import express from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

// Simple moderation queue: listings with moderationStatus = pending
router.get("/queue", async (_req, res) => {
  try {
    const all = await storage.getAllProperties();
    const pending = all.filter(p => (p as any).moderationStatus === 'pending');
    res.json(pending);
  } catch (err) {
    console.error("Error fetching moderation queue:", err);
    res.status(500).json({ message: "Failed to fetch moderation queue" });
  }
});

router.post("/:id/approve", async (req, res) => {
  try {
    const updated = await storage.updateProperty(req.params.id, { status: 'active', moderationStatus: 'approved' } as any);
    if (!updated) return res.status(404).json({ message: "Listing not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error approving listing:", err);
    res.status(500).json({ message: "Failed to approve" });
  }
});

router.post("/:id/reject", async (req, res) => {
  try {
    const updated = await storage.updateProperty(req.params.id, { status: 'paused', moderationStatus: 'rejected' } as any);
    if (!updated) return res.status(404).json({ message: "Listing not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error rejecting listing:", err);
    res.status(500).json({ message: "Failed to reject" });
  }
});

export default router;

