/**
 * routes/messages.ts — Low-level message CRUD (WhatsApp / SMS / email).
 *
 * Mounted at `/api/messages` in `apps/api/routes.ts`.
 *
 * | Method | Path            | Auth?  | Purpose                           |
 * |--------|-----------------|--------|-----------------------------------|
 * | GET    | /               | No*    | List all messages                 |
 * | GET    | /lead/:leadId   | No*    | Messages for a specific lead      |
 * | POST   | /               | Yes    | Send a message on a lead thread   |
 *
 * * Auth via `decodeAuth` on POST; GET endpoints are currently open (legacy).
 *
 * For the **two-way inbox** experience, see `routes/inbox.ts` which groups
 * messages into conversations. This file is the raw message store.
 *
 * Consumer: inbox page `apps/web/src/pages/platform/inbox/index.tsx` (indirect,
 *   via inbox.ts); also used by campaign send + chatbot handoff flows.
 *
 * @see [[Features/Marketing & Campaigns]]
 */

import express from 'express';
import { z } from "zod";
import { storage } from '../storage-prisma';
import { decodeAuth } from '../src/middleware/auth-helpers';
import { insertMessageSchema } from "@shared/types";

const router = express.Router();

/**
 * List  with optional filters.
 *
 * @route   GET /api/messages/
 * @auth    Public — no auth required
 */
router.get("/", async (req, res) => {
    try {
        const messages = await storage.getAllMessages();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

/**
 * Fetch a single lead by ID.
 *
 * @route   GET /api/messages/lead/:leadId
 * @auth    Public — no auth required
 */
router.get("/lead/:leadId", async (req, res) => {
    try {
        const { leadId } = req.params;
        const messages = await storage.getMessagesByLead(leadId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages for lead" });
    }
});

/**
 * Create a new  record.
 *
 * @route   POST /api/messages/
 * @auth    Public — no auth required
 */
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
