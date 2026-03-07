import express from 'express';
import { z } from "zod";
import { storage } from '../storage-prisma';
import { decodeAuth } from '../src/middleware/auth-helpers';

const router = express.Router();

const insertActivitySchema = z.object({
    leadId: z.string().min(1),
    type: z.string().min(1),
    notes: z.string().optional(),
    scheduledAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

// GET / - List activities (today's by default, supports activities page)
router.get("/", async (req, res) => {
    try {
        const activities = await storage.getTodaysActivities();
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch activities" });
    }
});

router.get("/lead/:leadId", async (req, res) => {
    try {
        const activities = await storage.getActivitiesByLead(req.params.leadId);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch activities" });
    }
});

router.get("/today", async (req, res) => {
    try {
        const activities = await storage.getTodaysActivities();
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch today's activities" });
    }
});

router.post("/", async (req, res) => {
    try {
        const validatedData = insertActivitySchema.parse(req.body);
        const auth = decodeAuth(req);
        const tenantId = auth.organizationId ?? "default-tenant";
        const activity = await storage.createActivity(validatedData);
        res.status(201).json(activity);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid data", errors: error.errors });
        }
        const message = error instanceof Error ? error.message : "Failed to create activity";
        res.status(500).json({ message });
    }
});

export default router;
