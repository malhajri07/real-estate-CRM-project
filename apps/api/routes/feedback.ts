/**
 * routes/feedback.ts — Post-viewing feedback collection and statistics.
 *
 * Mounted at `/api/feedback`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | /stats | Yes | Aggregate average ratings across all feedback |
 * | GET | / | Yes | List feedback entries (filterable by property/agent) |
 * | POST | / | Yes | Submit post-viewing feedback |
 * | GET | /:id | Yes | Get single feedback entry |
 *
 * Consumer: platform reports page, property detail feedback section.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

const ratingField = z.number().int().min(1).max(5).nullable().optional();

// GET /api/feedback/stats — Average ratings across all feedback
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const agg = await prisma.viewing_feedback.aggregate({
      _avg: {
        locationRating: true,
        conditionRating: true,
        priceRating: true,
        overallRating: true,
      },
      _count: { id: true },
    });

    res.json({
      totalResponses: agg._count.id,
      averages: {
        location: agg._avg.locationRating ? Number(agg._avg.locationRating.toFixed(1)) : null,
        condition: agg._avg.conditionRating ? Number(agg._avg.conditionRating.toFixed(1)) : null,
        price: agg._avg.priceRating ? Number(agg._avg.priceRating.toFixed(1)) : null,
        overall: agg._avg.overallRating ? Number(agg._avg.overallRating.toFixed(1)) : null,
      },
    });
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    res.status(500).json({ message: "Failed to load feedback stats" });
  }
});

// GET /api/feedback/:appointmentId — Get feedback for an appointment
router.get("/:appointmentId", authenticateToken, async (req, res) => {
  try {
    const feedback = await prisma.viewing_feedback.findUnique({
      where: { appointmentId: req.params.appointmentId },
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Failed to load feedback" });
  }
});

// POST /api/feedback — Submit feedback
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const schema = z.object({
      appointmentId: z.string().min(1),
      locationRating: ratingField,
      conditionRating: ratingField,
      priceRating: ratingField,
      overallRating: ratingField,
      comments: z.string().optional(),
    });

    const data = schema.parse(req.body);

    // Check if feedback already exists for this appointment
    const existing = await prisma.viewing_feedback.findUnique({
      where: { appointmentId: data.appointmentId },
    });

    if (existing) {
      return res.status(409).json({ message: "Feedback already submitted for this appointment" });
    }

    const feedback = await prisma.viewing_feedback.create({
      data: {
        appointmentId: data.appointmentId,
        customerId: user.id,
        locationRating: data.locationRating ?? null,
        conditionRating: data.conditionRating ?? null,
        priceRating: data.priceRating ?? null,
        overallRating: data.overallRating ?? null,
        comments: data.comments,
      },
    });

    res.status(201).json(feedback);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});

export default router;
