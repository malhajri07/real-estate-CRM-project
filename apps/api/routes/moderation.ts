/**
 * routes/moderation.ts - Content Moderation API Routes
 * 
 * Location: apps/api/ → Routes/ → moderation.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for content moderation. Handles:
 * - Moderation queue retrieval
 * - Property approval/rejection
 * - Moderation status management
 * 
 * API Endpoints:
 * - GET /api/moderation/queue - Get moderation queue
 * - POST /api/moderation/approve - Approve content
 * - POST /api/moderation/reject - Reject content
 * 
 * Related Files:
 * - apps/web/src/pages/moderation.tsx - Moderation queue page
 */

import express from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

// Determine if property still needs moderation approval
const needsModerationReview = (property: any): boolean => {
  const moderationStatus = property?.moderationStatus;
  if (typeof moderationStatus === 'string' && moderationStatus.toLowerCase() === 'pending') {
    return true;
  }

  const status = typeof property?.status === 'string' ? property.status.toLowerCase() : '';
  if (status === 'pending' || status === 'pending_approval' || status === 'pending-approval') {
    return true;
  }

  if (typeof property?.features === 'string') {
    try {
      const parsed = JSON.parse(property.features);
      const reviewStatus = parsed?.metadata?.reviewStatus;
      if (typeof reviewStatus === 'string' && reviewStatus.toLowerCase() === 'pending') {
        return true;
      }
    } catch {
      // Ignore malformed feature payloads
    }
  }

  return false;
};

// Simple moderation queue: listings awaiting moderation
router.get("/queue", async (_req, res) => {
  try {
    const all = await storage.getAllProperties();
    const pending = all.filter(needsModerationReview);
    res.json(pending);
  } catch (err) {
    console.error("Error fetching moderation queue:", err);
    res.status(500).json({ message: "Failed to fetch moderation queue" });
  }
});

router.get("/marketing-requests", async (_req, res) => {
  try {
    const queue = await storage.listMarketingRequests({
      status: "PENDING_REVIEW",
      includeOwner: true,
      includeProposals: false,
    });
    res.json(queue);
  } catch (err) {
    console.error("Error fetching marketing request moderation queue:", err);
    res.status(500).json({ message: "Failed to fetch marketing request queue" });
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
