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

/**
 * GET /api/moderation/stats - Get moderation statistics
 */
router.get("/stats", async (_req, res) => {
  try {
    const { prisma } = await import("../prismaClient");
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all properties
    const allProperties = await prisma.property_listings.findMany({
      select: {
        id: true,
        status: true,
        listed_date: true,
        updated_at: true,
        is_active: true
      }
    });

    // Helper to check if needs moderation
    const needsModeration = (p: any) => {
      const status = (p.status || '').toLowerCase();
      // Status can be "Pending", "pending", etc. - check if it needs review
      return status === 'pending' || (!p.is_active && status !== 'active');
    };

    // Helper to check if approved
    const isApproved = (p: any) => {
      const status = (p.status || '').toLowerCase();
      return status === 'approved' || (p.is_active && status === 'active');
    };

    // Helper to check if rejected
    const isRejected = (p: any) => {
      const status = (p.status || '').toLowerCase();
      return status === 'rejected' || (!p.is_active && status !== 'pending');
    };

    // Helper to check if updated today
    const updatedToday = (p: any) => {
      if (!p.updated_at) return false;
      const updated = new Date(p.updated_at);
      return updated >= todayStart;
    };

    // Count pending
    const pending = allProperties.filter(needsModeration);
    const pendingToday = pending.filter(p => {
      const created = new Date(p.listed_date);
      return created >= todayStart;
    });
    const pending7Days = pending.filter(p => {
      const created = new Date(p.listed_date);
      return created >= sevenDaysAgo;
    });
    const pending30Days = pending.filter(p => {
      const created = new Date(p.listed_date);
      return created >= thirtyDaysAgo;
    });

    // Count approved today
    const approvedToday = allProperties.filter(p => isApproved(p) && updatedToday(p));
    const approved7Days = allProperties.filter(p => {
      if (!isApproved(p)) return false;
      const updated = new Date(p.updated_at);
      return updated >= sevenDaysAgo;
    });
    const approved30Days = allProperties.filter(p => {
      if (!isApproved(p)) return false;
      const updated = new Date(p.updated_at);
      return updated >= thirtyDaysAgo;
    });

    // Count rejected today
    const rejectedToday = allProperties.filter(p => isRejected(p) && updatedToday(p));
    const rejected7Days = allProperties.filter(p => {
      if (!isRejected(p)) return false;
      const updated = new Date(p.updated_at);
      return updated >= sevenDaysAgo;
    });
    const rejected30Days = allProperties.filter(p => {
      if (!isRejected(p)) return false;
      const updated = new Date(p.updated_at);
      return updated >= thirtyDaysAgo;
    });

    res.json({
      pending: {
        today: pendingToday.length,
        last7Days: pending7Days.length,
        last30Days: pending30Days.length
      },
      approved: {
        today: approvedToday.length,
        last7Days: approved7Days.length,
        last30Days: approved30Days.length
      },
      rejected: {
        today: rejectedToday.length,
        last7Days: rejected7Days.length,
        last30Days: rejected30Days.length
      }
    });
  } catch (err) {
    console.error("Error fetching moderation stats:", err);
    res.status(500).json({ message: "Failed to fetch moderation stats" });
  }
});

export default router;
