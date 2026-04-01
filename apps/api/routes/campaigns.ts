
import express from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { prisma } from '../prismaClient';
import { decodeAuth } from '../src/middleware/auth-helpers';

const router = express.Router();

const CampaignSchema = z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    type: z.string().min(1),
    leadIds: z.array(z.string()).min(1),
});

// POST /api/campaigns - Create a new campaign
router.post("/", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        if (!auth.id) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const data = CampaignSchema.parse(req.body);

        // Store campaigns using the support_templates table with a campaign category,
        // or use a JSON approach via audit_logs to persist the record.
        // Since there's no dedicated campaigns table in the schema, we persist via audit_logs
        // and return a structured response.
        const campaignId = randomUUID();
        const campaign = {
            id: campaignId,
            title: data.title,
            message: data.message,
            type: data.type,
            leadIds: data.leadIds,
            status: "sent",
            sentAt: new Date().toISOString(),
            recipientCount: data.leadIds.length,
            createdBy: auth.id,
        };

        // Persist the campaign as an audit log entry for traceability
        await prisma.audit_logs.create({
            data: {
                userId: auth.id,
                action: 'CAMPAIGN_CREATED',
                entity: 'campaign',
                entityId: campaignId,
                afterJson: JSON.stringify(campaign),
            }
        });

        res.status(201).json(campaign);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid data", errors: error.errors });
        }
        console.error("Error creating campaign:", error instanceof Error ? error.message : error);
        res.status(500).json({ message: "Failed to create campaign", detail: error instanceof Error ? error.message : String(error) });
    }
});

// GET /api/campaigns - List campaigns for the authenticated user
router.get("/", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        if (!auth.id) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const logs = await prisma.audit_logs.findMany({
            where: {
                action: 'CAMPAIGN_CREATED',
                userId: auth.id,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        const campaigns = logs.map((log) => {
            const payload = log.afterJson ? JSON.parse(log.afterJson) : {};
            return {
                id: payload?.id || log.entityId || log.id,
                title: payload?.title || '',
                message: payload?.message || '',
                type: payload?.type || '',
                leadIds: payload?.leadIds || [],
                status: payload?.status || 'sent',
                sentAt: payload?.sentAt || log.createdAt.toISOString(),
                recipientCount: payload?.recipientCount || 0,
                createdBy: log.userId,
            };
        });

        res.json(campaigns);
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        res.status(500).json({ message: "Failed to fetch campaigns" });
    }
});

export default router;
