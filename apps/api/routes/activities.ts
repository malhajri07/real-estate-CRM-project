/**
 * routes/activities.ts — Agent task/follow-up CRUD.
 *
 * Mounted at `/api/activities` in `apps/api/routes.ts`.
 *
 * Activities are logged actions on a lead (calls, viewings, follow-ups).
 * Stored in `audit_logs` via the `storage.createActivity` adapter — not a
 * separate table, but reusing audit_logs with `entity = "lead"`.
 *
 * Endpoints:
 * | Method | Path                 | Purpose                          |
 * |--------|----------------------|----------------------------------|
 * | GET    | /                    | List today's activities           |
 * | GET    | /lead/:leadId        | Activities for a specific lead    |
 * | GET    | /today               | Alias for /                       |
 * | GET    | /overdue             | Activities past scheduledDate, not completed (E5) |
 * | POST   | /                    | Create activity on a lead         |
 * | PATCH  | /:id/toggle-complete | Toggle completed flag             |
 * | PATCH  | /:id/outcome         | Set outcome on completed activity (E5) |
 *
 * Consumer: `apps/web/src/pages/platform/activities/index.tsx`
 *   (query key `['/api/activities']`).
 */

import express from 'express';
import { z } from "zod";
import { storage } from '../storage-prisma';
import { decodeAuth } from '../src/middleware/auth-helpers';

const router = express.Router();

/** Zod schema for creating an activity. Source: activities page "Add" form. */
const insertActivitySchema = z.object({
    leadId: z.string().min(1),
    type: z.string().min(1),
    title: z.string().optional(),
    notes: z.string().optional(),
    scheduledAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

// GET / - List activities (today's by default, supports activities page)
/**
 * List  with optional filters.
 *
 * @route   GET /api/activities/
 * @auth    Public — no auth required
 */
router.get("/", async (req, res) => {
    try {
        const activities = await storage.getTodaysActivities();
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch activities" });
    }
});

/**
 * Fetch a single lead by ID.
 *
 * @route   GET /api/activities/lead/:leadId
 * @auth    Public — no auth required
 */
router.get("/lead/:leadId", async (req, res) => {
    try {
        const activities = await storage.getActivitiesByLead(req.params.leadId);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch activities" });
    }
});

/**
 * List today with optional filters.
 *
 * @route   GET /api/activities/today
 * @auth    Public — no auth required
 */
router.get("/today", async (req, res) => {
    try {
        const activities = await storage.getTodaysActivities();
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch today's activities" });
    }
});

/**
 * Create a new  record.
 *
 * @route   POST /api/activities/
 * @auth    Public — no auth required
 */
router.post("/", async (req, res) => {
    try {
        const validatedData = insertActivitySchema.parse(req.body);
        const auth = decodeAuth(req);
        if (!auth.id) return res.status(401).json({ message: "Authentication required" });
        const activity = await storage.createActivity({
            ...validatedData,
            userId: auth.id,
            action: validatedData.type,
            entity: "lead",
            entityId: validatedData.leadId,
            afterJson: JSON.stringify({ title: validatedData.title, notes: validatedData.notes }),
        });
        res.status(201).json(activity);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid data", errors: error.errors });
        }
        const message = error instanceof Error ? error.message : "Failed to create activity";
        res.status(500).json({ message });
    }
});

/**
 * @route GET /api/activities/overdue
 * @auth  Via decodeAuth
 * @returns Activities where `scheduledDate < now` AND `completed !== true`.
 *   Source: all activities from `storage.getTodaysActivities()` (returns all, not just today's despite the name).
 *   Consumer: activities page overdue badge + stat card (E5).
 */
router.get("/overdue", async (req, res) => {
    try {
        const all = await storage.getTodaysActivities();
        const now = new Date();
        const overdue = all.filter((a: any) => {
            if (a.completed) return false;
            const scheduled = a.scheduledDate || a.scheduledAt;
            if (!scheduled) return false;
            return new Date(scheduled) < now;
        });
        res.json(overdue);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch overdue activities" });
    }
});

/**
 * @route PATCH /api/activities/:id/outcome
 * @auth  Via decodeAuth
 * @param req.body.outcome - One of: "مهتم" | "غير مهتم" | "معاودة الاتصال".
 *   Source: outcome dropdown in the activities table row (E5).
 * @returns Updated activity with outcome set in afterJson.
 *   Consumer: activities table re-renders the outcome badge.
 * @sideEffect Updates `afterJson.outcome` on the audit_logs row.
 */
router.patch("/:id/outcome", async (req, res) => {
    try {
        const { id } = req.params;
        const { outcome } = req.body;
        if (!outcome || !["مهتم", "غير مهتم", "معاودة الاتصال"].includes(outcome)) {
            return res.status(400).json({ message: "outcome must be one of: مهتم, غير مهتم, معاودة الاتصال" });
        }
        const existing = await storage.getActivityById(id);
        if (!existing) return res.status(404).json({ message: "Activity not found" });

        const currentJson = existing.afterJson ? JSON.parse(existing.afterJson) : {};
        const updatedJson = JSON.stringify({ ...currentJson, outcome });
        const updated = await storage.updateActivity(id, { afterJson: updatedJson });
        res.json({ ...updated, outcome });
    } catch (error) {
        res.status(500).json({ message: "Failed to set outcome" });
    }
});

// PATCH /:id/toggle-complete — Mark/unmark an activity as completed
/**
 * Toggle :id status.
 *
 * @route   PATCH /api/activities/:id/toggle-complete
 * @auth    Public — no auth required
 */
router.patch("/:id/toggle-complete", async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await storage.getActivityById(id);
        if (!existing) return res.status(404).json({ message: "Activity not found" });

        const currentJson = existing.afterJson ? JSON.parse(existing.afterJson) : {};
        const nowCompleted = !currentJson.completed;
        const updatedJson = JSON.stringify({ ...currentJson, completed: nowCompleted });

        const updated = await storage.updateActivity(id, { afterJson: updatedJson });
        res.json({ ...updated, completed: nowCompleted });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to toggle activity";
        res.status(500).json({ message });
    }
});

export default router;
