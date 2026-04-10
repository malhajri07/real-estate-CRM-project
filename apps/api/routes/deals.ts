/**
 * routes/deals.ts — Pipeline deal CRUD + revenue forecast.
 *
 * Mounted at `/api/deals` in `apps/api/routes.ts`.
 *
 * | Method | Path             | Auth? | Purpose                                          |
 * |--------|------------------|-------|--------------------------------------------------|
 * | GET    | /                | Yes*  | List all deals (org-scoped via middleware)         |
 * | GET    | /stage/:stage    | Yes*  | Filter deals by pipeline stage                    |
 * | POST   | /                | Yes   | Create deal from a qualified lead                 |
 * | PUT    | /:id             | Yes   | Update stage/price/notes + track stage transition  |
 * | GET    | /forecast        | Yes   | Revenue forecast: onTrack vs atRisk per stage prob |
 * | DELETE | /:id             | Yes   | Soft-delete (moves to LOST stage)                 |
 *
 * * org-isolation enforced via `guardOrgAccess` / `guardWriteAccess`.
 *
 * Stage transitions update `deals.stageEnteredAt` and insert a row into
 * `deal_stage_history` (raw SQL) for the timeline view.
 *
 * Consumer: Kanban board `apps/web/src/pages/platform/pipeline/index.tsx`
 *   (query key `['/api/deals']`) and forecast bar.
 *
 * @see [[Features/Pipeline & Deals]]
 * @see [[Sessions/E3 - Pipeline]]
 */

import express from 'express';
import { z } from "zod";
import { storage } from '../storage-prisma';
import { decodeAuth } from '../src/middleware/auth-helpers';
import { hasPermission } from '../rbac-policy';
import { getErrorResponse } from '../i18n';
import { guardOrgAccess, guardWriteAccess } from '../src/middleware/org-isolation.middleware';

const router = express.Router();

const VALID_STAGES = ['NEW', 'NEGOTIATION', 'UNDER_OFFER', 'WON', 'LOST'] as const;

const insertDealSchema = z.object({
    customerId: z.string().min(1),
    organizationId: z.string().optional(),
    listingId: z.string().optional(),
    propertyId: z.string().optional(),
    agentId: z.string().optional(),
    stage: z.enum(VALID_STAGES).optional(),
    source: z.string().optional(),
    expectedCloseDate: z.string().optional(),
    agreedPrice: z.union([z.number(), z.string()]).optional(),
    notes: z.string().optional(),
});

const updateDealSchema = z.object({
    stage: z.enum(VALID_STAGES).optional(),
    notes: z.string().optional(),
    expectedCloseDate: z.string().optional(),
    agreedPrice: z.union([z.number(), z.string()]).optional(),
    source: z.string().optional(),
    agentId: z.string().optional(),
});

router.get("/", async (req, res) => {
    try {
        const orgFilter = (req as any).orgFilter || {};
        const deals = await storage.getAllDeals(orgFilter);
        res.json(deals);
    } catch (error) {
        res.status(500).json(getErrorResponse('FETCH_FAILED', (req as any).locale));
    }
});

router.get("/stage/:stage", async (req, res) => {
    try {
        const orgFilter = (req as any).orgFilter || {};
        const deals = await storage.getDealsByStage(req.params.stage, orgFilter);
        res.json(deals);
    } catch (error) {
        res.status(500).json(getErrorResponse('FETCH_FAILED', (req as any).locale));
    }
});

router.post("/", async (req, res) => {
    try {
        const validatedData = insertDealSchema.parse(req.body);
        const auth = decodeAuth(req);
        const orgId = auth.organizationId;
        if (!orgId) {
            return res.status(400).json(getErrorResponse('VALIDATION_ERROR', (req as any).locale, 'Organization context required'));
        }
        const deal = await storage.createDeal({
            ...validatedData,
            organizationId: orgId,
            agentId: validatedData.agentId || auth.id,
        });
        res.status(201).json(deal);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json(getErrorResponse('VALIDATION_ERROR', (req as any).locale, error.errors));
        }
        res.status(500).json(getErrorResponse('CREATE_FAILED', (req as any).locale));
    }
});

router.put("/:id", async (req, res) => {
    try {
        const validatedData = updateDealSchema.parse(req.body);

        // Verify deal exists and user has access
        const existing = await storage.getDealById(req.params.id);
        if (!existing) {
            return res.status(404).json(getErrorResponse('DEAL_NOT_FOUND', (req as any).locale));
        }
        if (!guardOrgAccess(req, existing.organizationId)) {
            return res.status(403).json(getErrorResponse('FORBIDDEN', (req as any).locale));
        }
        // CORP_AGENT can only edit their own deals
        if (!guardWriteAccess(req, existing)) {
            return res.status(403).json({ error: 'FORBIDDEN', message: 'يمكنك تعديل صفقاتك فقط' });
        }

        // Build update payload — only include defined fields
        const updatePayload: Record<string, unknown> = {};
        if (validatedData.stage !== undefined) updatePayload.stage = validatedData.stage;
        if (validatedData.notes !== undefined) updatePayload.notes = validatedData.notes;
        if (validatedData.expectedCloseDate !== undefined) updatePayload.expectedCloseDate = validatedData.expectedCloseDate;
        if (validatedData.agreedPrice !== undefined) updatePayload.agreedPrice = validatedData.agreedPrice;
        if (validatedData.source !== undefined) updatePayload.source = validatedData.source;
        if (validatedData.agentId !== undefined) updatePayload.agentId = validatedData.agentId;

        // Track won/lost timestamps + stageEnteredAt
        if (validatedData.stage === 'WON') updatePayload.wonAt = new Date();
        if (validatedData.stage === 'LOST') updatePayload.lostAt = new Date();
        if (validatedData.stage !== undefined && validatedData.stage !== existing.stage) {
            updatePayload.stageEnteredAt = new Date();
            // Record stage transition history
            try {
                const { prisma: db } = await import('../prismaClient');
                await db.$executeRaw`INSERT INTO deal_stage_history ("id", "dealId", "fromStage", "toStage", "changedAt", "changedBy") VALUES (gen_random_uuid()::text, ${req.params.id}, ${existing.stage}, ${validatedData.stage}, NOW(), ${req.user?.id || null})`;
            } catch { /* best effort */ }
        }

        const deal = await storage.updateDeal(req.params.id, updatePayload);
        res.json(deal);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json(getErrorResponse('VALIDATION_ERROR', (req as any).locale, error.errors));
        }
        res.status(500).json(getErrorResponse('UPDATE_FAILED', (req as any).locale));
    }
});

/**
 * @route GET /api/deals/forecast
 * @auth  Required (via decodeAuth — uses JWT, not middleware guard)
 * @returns `{ onTrack, atRisk, total, dealCount }` — weighted revenue forecast.
 *   On-track = Σ(agreedPrice × stageProbability) for deals with stageAge ≤ 30 days.
 *   At-risk = same formula for deals stuck > 30 days.
 *   Consumer: forecast bar in `pipeline/index.tsx`.
 *
 * @see [[Features/Pipeline & Deals]] for stage probabilities
 */
router.get("/forecast", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        const orgId = auth.organizationId;
        const where: any = orgId ? { organizationId: orgId, stage: { notIn: ["WON", "LOST"] } } : { agentId: auth.id, stage: { notIn: ["WON", "LOST"] } };

        const { prisma: db } = await import('../prismaClient');
        const deals = await db.deals.findMany({ where, select: { stage: true, agreedPrice: true, stageEnteredAt: true, updatedAt: true } });

        const stageProbability: Record<string, number> = { NEW: 0.10, NEGOTIATION: 0.40, UNDER_OFFER: 0.70 };
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        let onTrack = 0, atRisk = 0;
        deals.forEach((d: any) => {
            const value = Number(d.agreedPrice || 0);
            const prob = stageProbability[d.stage] || 0.2;
            const stageAge = now - new Date(d.stageEnteredAt || d.updatedAt || d.createdAt).getTime();
            if (stageAge > thirtyDays) {
                atRisk += value * prob;
            } else {
                onTrack += value * prob;
            }
        });

        res.json({
            onTrack: Math.round(onTrack),
            atRisk: Math.round(atRisk),
            total: Math.round(onTrack + atRisk),
            dealCount: deals.length,
        });
    } catch (error) {
        res.status(500).json({ message: "فشل حساب التوقعات" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        if (!auth.id) {
            return res.status(401).json(getErrorResponse('UNAUTHORIZED', (req as any).locale));
        }

        // Check permissions - need manage rights
        const canManage = hasPermission(auth.roles, 'requests:manage:all')
            || hasPermission(auth.roles, 'requests:manage:corporate');

        if (!canManage) {
            return res.status(403).json(getErrorResponse('FORBIDDEN', (req as any).locale));
        }

        // Verify deal exists before deleting
        const deal = await storage.getDealById(req.params.id);
        if (!deal) {
            return res.status(404).json(getErrorResponse('DEAL_NOT_FOUND', (req as any).locale));
        }

        // Org isolation
        if (!guardOrgAccess(req, deal.organizationId)) {
            return res.status(403).json(getErrorResponse('FORBIDDEN', (req as any).locale));
        }

        // Soft-delete by moving to LOST stage
        await storage.updateDeal(req.params.id, { stage: 'LOST', lostAt: new Date() });
        res.status(204).send();
    } catch (error) {
        res.status(500).json(getErrorResponse('DELETE_FAILED', (req as any).locale));
    }
});

export default router;
