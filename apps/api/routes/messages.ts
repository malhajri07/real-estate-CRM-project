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
        const auth = decodeAuth(req);
        if (!auth.id) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const { leadId, content, channel } = req.body;
        if (!leadId || !content) {
            return res.status(400).json({ error: "leadId and content are required" });
        }
        const message = await storage.createMessage({
            leadId,
            agentId: auth.id,
            content,
            channel: channel || 'WHATSAPP',
        });
        res.status(201).json(message);
    } catch (error) {
        console.error("Error creating message:", error);
        const msg = error instanceof Error ? error.message : "Failed to create message";
        res.status(500).json({ error: msg });
    }
});

export default router;
