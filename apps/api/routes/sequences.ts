/**
 * routes/sequences.ts — Drip campaign sequences + lead enrollment.
 *
 * Mounted at `/api/sequences` in `apps/api/routes.ts`.
 *
 * | Method | Path                          | Auth? | Purpose                              |
 * |--------|-------------------------------|-------|--------------------------------------|
 * | GET    | /                             | Yes   | List agent's sequences                |
 * | POST   | /                             | Yes   | Create a new multi-step sequence      |
 * | PUT    | /:id                          | Yes   | Update sequence name/steps/enabled    |
 * | DELETE | /:id                          | Yes   | Delete sequence + enrollments         |
 * | POST   | /:id/enroll                   | Yes   | Enroll a lead in a sequence           |
 * | GET    | /:id/enrollments              | Yes   | List enrollments + current step       |
 * | POST   | /process                      | Yes   | Advance enrollments where nextRunAt ≤ now |
 *
 * A sequence's `steps` field is a JSON array of
 * `[{delay: "0d", template: "welcome", message: "..."}]`.
 * The `/process` endpoint is meant to be called by a cron job to tick
 * enrollments forward.
 *
 * Consumer: automation section in notifications page.
 *
 * @see [[Features/Marketing & Campaigns]]
 */

import express from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = express.Router();

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSequenceSchema = z.object({
  name: z.string().min(1),
  channel: z.string().default("whatsapp"),
  steps: z.string().min(2), // JSON array string
});

const updateSequenceSchema = z.object({
  name: z.string().min(1).optional(),
  channel: z.string().optional(),
  steps: z.string().optional(),
  enabled: z.boolean().optional(),
});

const enrollSchema = z.object({
  leadId: z.string().min(1),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a delay string like "0d", "3d", "1h" into milliseconds. */
function parseDelay(delay: string): number {
  const match = delay.match(/^(\d+)(m|h|d)$/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  return value * 24 * 60 * 60 * 1000; // days
}

// ── GET /api/sequences — List agent's sequences ─────────────────────────────

/**
 * List  with optional filters.
 *
 * @route   GET /api/sequences/
 * @auth    Required — any authenticated user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const sequences = await prisma.campaign_sequences.findMany({
      where: { agentId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    res.json(sequences);
  } catch (error) {
    console.error("Error fetching sequences:", error);
    res.status(500).json({ message: "Failed to fetch sequences" });
  }
});

// ── POST /api/sequences — Create sequence ───────────────────────────────────

/**
 * Create a new  record.
 *
 * @route   POST /api/sequences/
 * @auth    Required — any authenticated user
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = createSequenceSchema.parse(req.body);

    // Validate that steps is valid JSON array
    try {
      const parsed = JSON.parse(data.steps);
      if (!Array.isArray(parsed)) {
        return res.status(400).json({ message: "steps must be a JSON array" });
      }
    } catch {
      return res.status(400).json({ message: "steps must be valid JSON" });
    }

    const sequence = await prisma.campaign_sequences.create({
      data: {
        agentId: user.id,
        name: data.name,
        channel: data.channel,
        steps: data.steps,
      },
    });

    res.status(201).json(sequence);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating sequence:", error);
    res.status(500).json({ message: "Failed to create sequence" });
  }
});

// ── PATCH /api/sequences/:id — Update sequence ─────────────────────────────

/**
 * Partially update a :id record.
 *
 * @route   PATCH /api/sequences/:id
 * @auth    Required — any authenticated user
 */
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const data = updateSequenceSchema.parse(req.body);

    const existing = await prisma.campaign_sequences.findFirst({
      where: { id, agentId: user.id },
    });
    if (!existing) return res.status(404).json({ message: "Sequence not found" });

    // Validate steps JSON if provided
    if (data.steps !== undefined) {
      try {
        const parsed = JSON.parse(data.steps);
        if (!Array.isArray(parsed)) {
          return res.status(400).json({ message: "steps must be a JSON array" });
        }
      } catch {
        return res.status(400).json({ message: "steps must be valid JSON" });
      }
    }

    const updated = await prisma.campaign_sequences.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.steps !== undefined && { steps: data.steps }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error updating sequence:", error);
    res.status(500).json({ message: "Failed to update sequence" });
  }
});

// ── DELETE /api/sequences/:id — Delete sequence ─────────────────────────────

/**
 * Delete a :id record.
 *
 * @route   DELETE /api/sequences/:id
 * @auth    Required — any authenticated user
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const existing = await prisma.campaign_sequences.findFirst({
      where: { id, agentId: user.id },
    });
    if (!existing) return res.status(404).json({ message: "Sequence not found" });

    await prisma.campaign_sequences.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting sequence:", error);
    res.status(500).json({ message: "Failed to delete sequence" });
  }
});

// ── POST /api/sequences/:id/enroll — Enroll a lead ─────────────────────────

/**
 * Create a new :id record.
 *
 * @route   POST /api/sequences/:id/enroll
 * @auth    Required — any authenticated user
 */
router.post("/:id/enroll", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const data = enrollSchema.parse(req.body);

    // Verify sequence belongs to agent
    const sequence = await prisma.campaign_sequences.findFirst({
      where: { id, agentId: user.id },
    });
    if (!sequence) return res.status(404).json({ message: "Sequence not found" });
    if (!sequence.enabled) return res.status(400).json({ message: "Sequence is disabled" });

    // Parse steps to get the first step delay
    const steps = JSON.parse(sequence.steps) as Array<{ delay: string; template?: string; message?: string }>;
    if (steps.length === 0) {
      return res.status(400).json({ message: "Sequence has no steps" });
    }

    const firstDelay = parseDelay(steps[0].delay);
    const nextRunAt = new Date(Date.now() + firstDelay);

    const enrollment = await prisma.sequence_enrollments.create({
      data: {
        sequenceId: id,
        leadId: data.leadId,
        currentStep: 0,
        nextRunAt,
        status: "ACTIVE",
      },
    });

    res.status(201).json(enrollment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    // Unique constraint violation — lead already enrolled
    if ((error as any)?.code === "P2002") {
      return res.status(409).json({ message: "Lead is already enrolled in this sequence" });
    }
    console.error("Error enrolling lead:", error);
    res.status(500).json({ message: "Failed to enroll lead" });
  }
});

// ── POST /api/sequences/process — Process due enrollments (cron-like) ───────

/**
 * Create a new process record.
 *
 * @route   POST /api/sequences/process
 * @auth    Required — any authenticated user
 */
router.post("/process", authenticateToken, async (req, res) => {
  try {
    const now = new Date();

    // Find all enrollments that are due
    const dueEnrollments = await prisma.sequence_enrollments.findMany({
      where: {
        status: "ACTIVE",
        nextRunAt: { lte: now },
      },
      include: {
        sequence: true,
      },
      take: 200,
    });

    const results: Array<{ enrollmentId: string; action: string }> = [];

    for (const enrollment of dueEnrollments) {
      const steps = JSON.parse(enrollment.sequence.steps) as Array<{
        delay: string;
        template?: string;
        message?: string;
      }>;

      const currentStep = steps[enrollment.currentStep];
      if (!currentStep) {
        // No more steps — mark completed
        await prisma.sequence_enrollments.update({
          where: { id: enrollment.id },
          data: { status: "COMPLETED", nextRunAt: null },
        });
        results.push({ enrollmentId: enrollment.id, action: "COMPLETED" });
        continue;
      }

      // Execute the current step (log it; real delivery would integrate with WhatsApp/SMS API)
      console.log(
        `[Sequence] Executing step ${enrollment.currentStep} for enrollment ${enrollment.id}: ` +
          `template=${currentStep.template || "none"}, message=${currentStep.message || "none"}`
      );

      const nextStepIndex = enrollment.currentStep + 1;

      if (nextStepIndex >= steps.length) {
        // This was the last step
        await prisma.sequence_enrollments.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStepIndex,
            status: "COMPLETED",
            nextRunAt: null,
          },
        });
        results.push({ enrollmentId: enrollment.id, action: "EXECUTED_LAST_STEP" });
      } else {
        // Advance to next step
        const nextDelay = parseDelay(steps[nextStepIndex].delay);
        await prisma.sequence_enrollments.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStepIndex,
            nextRunAt: new Date(Date.now() + nextDelay),
          },
        });
        results.push({ enrollmentId: enrollment.id, action: "ADVANCED" });
      }
    }

    res.json({ processed: results.length, results });
  } catch (error) {
    console.error("Error processing sequences:", error);
    res.status(500).json({ message: "Failed to process sequences" });
  }
});

export default router;
