import express from 'express';
import { z } from "zod";
import { storage } from '../storage-prisma';
import { decodeAuth } from '../src/middleware/auth-helpers';
import { insertMessageSchema } from "@shared/types";

const router = express.Router();

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
