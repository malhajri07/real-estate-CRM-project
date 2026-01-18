
import express from 'express';
import { z } from "zod";
import { storage } from '../storage-prisma';
import jwt from 'jsonwebtoken';
import { JWT_SECRET as getJwtSecret } from "../config/env";
import { insertMessageSchema } from "@shared/types";

const router = express.Router();

// Helper: decode roles/org from Authorization header (simple-auth JWT)
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
        const messages = await storage.getAllMessages();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

router.get("/lead/:leadId", async (req, res) => {
    try {
        const { leadId } = req.params;
        const messages = await storage.getMessagesByLead(leadId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages for lead" });
    }
});

router.post("/", async (req, res) => {
    try {
        const messageData = insertMessageSchema.parse(req.body);
        const auth = decodeAuth(req);
        const tenantId = auth.organizationId ?? "default-tenant";
        const message = await storage.createMessage(messageData);
        res.json(message);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        const message = error instanceof Error ? error.message : "Failed to create message";
        res.status(500).json({ error: message });
    }
});

export default router;
