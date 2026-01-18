
import express from 'express';
import { z } from "zod";
import { storage } from '../storage-prisma';
import jwt from 'jsonwebtoken';
import { JWT_SECRET as getJwtSecret } from "../config/env";
import { hasPermission } from '../rbac-policy';

const router = express.Router();

const insertDealSchema = z.object({
    title: z.string().min(1),
    stage: z.string().optional(),
    value: z.union([z.number(), z.string()]).optional(),
    leadId: z.string().optional(),
    agentId: z.string().optional(),
    notes: z.string().optional(),
}).passthrough();

// Helper: decode roles/org from Authorization header (simple-auth JWT)
// TODO: Centralize this helper as it's duplicated in routes.ts
function decodeAuth(req: any): { id?: string; roles: string[]; organizationId?: string } {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return { roles: [] };
        const decoded: any = jwt.verify(token, getJwtSecret());
        let roles: string[] = [];
        try { roles = JSON.parse(decoded.roles || '[]'); } catch { if (decoded.roles) roles = [decoded.roles]; }
        return { id: decoded.userId, roles, organizationId: decoded.organizationId };
    } catch { return { roles: [] }; }
}

router.get("/", async (req, res) => {
    try {
        const deals = await storage.getAllDeals();
        res.json(deals);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch deals" });
    }
});

router.get("/stage/:stage", async (req, res) => {
    try {
        const deals = await storage.getDealsByStage(req.params.stage);
        res.json(deals);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch deals by stage" });
    }
});

router.post("/", async (req, res) => {
    try {
        const validatedData = insertDealSchema.parse(req.body);
        const auth = decodeAuth(req);
        const tenantId = auth.organizationId ?? "default-tenant";
        const deal = await storage.createDeal(validatedData);
        res.status(201).json(deal);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid data", errors: error.errors });
        }
        const message = error instanceof Error ? error.message : "Failed to create deal";
        res.status(500).json({ message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const validatedData = insertDealSchema.partial().parse(req.body);
        const deal = await storage.updateDeal(req.params.id, validatedData);
        if (!deal) {
            return res.status(404).json({ message: "Deal not found" });
        }
        res.json(deal);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update deal" });
    }
});

export default router;
