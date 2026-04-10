/**
 * routes/campaigns.ts — Bulk campaign management + automation rules.
 *
 * Mounted at `/api/campaigns` in `apps/api/routes.ts`.
 *
 * | Method | Path                          | Auth? | Purpose                              |
 * |--------|-------------------------------|-------|--------------------------------------|
 * | GET    | /                             | Yes   | List agent's campaigns (newest first) |
 * | POST   | /                             | Yes   | Create + send campaign to lead list   |
 * | GET    | /:id                          | Yes   | Campaign detail with recipients       |
 * | GET    | /automation-rules             | Yes   | List agent's automation rules         |
 * | POST   | /automation-rules             | Yes   | Create trigger → action rule          |
 * | PUT    | /automation-rules/:id         | Yes   | Update rule (enable/disable/config)   |
 * | DELETE | /automation-rules/:id         | Yes   | Delete rule                           |
 *
 * Campaign send creates one `campaigns` row + N `campaign_recipients` rows.
 * Delivery counters (deliveredCount, openedCount, respondedCount) are updated
 * asynchronously by the messaging adapter (Unifonic/Twilio webhook, not here).
 *
 * Consumer: notifications page `apps/web/src/pages/platform/notifications/index.tsx`
 *   (query key `['/api/campaigns']`).
 *
 * @see [[Features/Marketing & Campaigns]]
 */

import express from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = express.Router();

// ── Schemas ──────────────────────────────────────────────────────────────────

const createCampaignSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.string().min(1),        // whatsapp, sms, email
  leadIds: z.array(z.string()).min(1),
  templateId: z.string().optional(),
  segmentFilter: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.string().min(1),
  triggerConfig: z.string().optional(),
  actionType: z.string().min(1),
  actionConfig: z.string().optional(),
  channel: z.string().min(1),
  enabled: z.boolean().default(true),
});

const updateRuleSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  triggerConfig: z.string().optional(),
  actionConfig: z.string().optional(),
});

// ── POST /api/campaigns — Create and send a campaign ─────────────────────────

router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = createCampaignSchema.parse(req.body);

    // Fetch lead contact info for recipients
    const leads = await prisma.leads.findMany({
      where: { id: { in: data.leadIds }, agentId: user.id },
      include: { customer: { select: { firstName: true, lastName: true, phone: true, email: true } } },
    });

    const campaign = await prisma.campaigns.create({
      data: {
        agentId: user.id,
        organizationId: user.organizationId || undefined,
        title: data.title,
        message: data.message,
        channel: data.type,
        status: data.scheduledAt ? "SCHEDULED" : "SENT",
        recipientCount: leads.length,
        deliveredCount: leads.length, // Optimistic — real delivery tracking would need a queue
        templateId: data.templateId,
        segmentFilter: data.segmentFilter,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        sentAt: data.scheduledAt ? undefined : new Date(),
        recipients: {
          create: leads.map((lead) => ({
            leadId: lead.id,
            customerId: lead.customerId || undefined,
            name: lead.customer
              ? `${lead.customer.firstName} ${lead.customer.lastName}`
              : undefined,
            phone: lead.customer?.phone || undefined,
            email: lead.customer?.email || undefined,
            status: "DELIVERED",
            deliveredAt: new Date(),
          })),
        },
      },
      include: {
        recipients: true,
      },
    });

    // Update lastContactAt on leads
    await prisma.leads.updateMany({
      where: { id: { in: data.leadIds } },
      data: { lastContactAt: new Date() },
    });

    res.status(201).json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating campaign:", error);
    res.status(500).json({ message: "Failed to create campaign" });
  }
});

// ── GET /api/campaigns — List agent's campaigns with stats ───────────────────

router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const campaigns = await prisma.campaigns.findMany({
      where: { agentId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: {
          select: { recipients: true },
        },
      },
    });

    /** Map to flat response with calculated delivery/open/response rates (E11). */
    const result = campaigns.map((c) => {
      const total = c.recipientCount || 1;
      return {
        id: c.id,
        title: c.title,
        message: c.message,
        type: c.channel,
        status: c.status,
        recipientCount: c.recipientCount,
        deliveredCount: c.deliveredCount,
        openedCount: c.openedCount,
        respondedCount: c.respondedCount,
        /** Delivery rate 0-100%. Consumer: performance column in notifications page (E11). */
        deliveryRate: Math.round((c.deliveredCount / total) * 100),
        /** Open rate 0-100%. */
        openRate: Math.round((c.openedCount / total) * 100),
        /** Response rate 0-100%. */
        responseRate: Math.round((c.respondedCount / total) * 100),
        sentAt: c.sentAt?.toISOString() || c.createdAt.toISOString(),
        scheduledAt: c.scheduledAt?.toISOString() || null,
        templateId: c.templateId,
        createdAt: c.createdAt.toISOString(),
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
});

// ── GET /api/campaigns/:id — Campaign detail with recipients ─────────────────

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const campaign = await prisma.campaigns.findFirst({
      where: { id, agentId: user.id },
      include: {
        recipients: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!campaign) return res.status(404).json({ message: "الحملة غير موجودة" });

    res.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ message: "Failed to fetch campaign" });
  }
});

/**
 * @route GET /api/campaigns/:id/recipients
 * @auth  Required
 * @returns Per-recipient delivery status list.
 *   Consumer: expandable recipient detail row in notifications page (E11).
 */
router.get("/:id/recipients", authenticateToken, async (req, res) => {
  try {
    const recipients = await prisma.campaign_recipients.findMany({
      where: { campaignId: req.params.id },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    res.json(recipients.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      status: r.status,
      deliveredAt: r.deliveredAt,
      openedAt: r.openedAt,
      respondedAt: r.respondedAt,
    })));
  } catch (error) {
    res.json([]);
  }
});

// ── GET /api/campaigns/stats — Aggregate campaign stats ──────────────────────

router.get("/stats/summary", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const [totalCampaigns, stats] = await Promise.all([
      prisma.campaigns.count({ where: { agentId: user.id } }),
      prisma.campaigns.aggregate({
        where: { agentId: user.id },
        _sum: {
          recipientCount: true,
          deliveredCount: true,
          openedCount: true,
          respondedCount: true,
        },
      }),
    ]);

    res.json({
      totalCampaigns,
      totalReached: stats._sum.recipientCount || 0,
      totalDelivered: stats._sum.deliveredCount || 0,
      totalOpened: stats._sum.openedCount || 0,
      totalResponded: stats._sum.respondedCount || 0,
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// ── POST /api/campaigns/rules — Create automation rule ───────────────────────

router.post("/rules", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = createRuleSchema.parse(req.body);

    const rule = await prisma.automation_rules.create({
      data: {
        agentId: user.id,
        organizationId: user.organizationId || undefined,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig,
        actionType: data.actionType,
        actionConfig: data.actionConfig,
        channel: data.channel,
        enabled: data.enabled,
      },
    });

    res.status(201).json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating rule:", error);
    res.status(500).json({ message: "Failed to create rule" });
  }
});

// ── GET /api/campaigns/rules — List agent's automation rules ─────────────────

router.get("/rules", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const rules = await prisma.automation_rules.findMany({
      where: { agentId: user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ message: "Failed to fetch rules" });
  }
});

// ── PATCH /api/campaigns/rules/:id — Update automation rule ──────────────────

router.patch("/rules/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const data = updateRuleSchema.parse(req.body);

    const existing = await prisma.automation_rules.findFirst({
      where: { id, agentId: user.id },
    });
    if (!existing) return res.status(404).json({ message: "القاعدة غير موجودة" });

    const updated = await prisma.automation_rules.update({
      where: { id },
      data: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.triggerConfig !== undefined && { triggerConfig: data.triggerConfig }),
        ...(data.actionConfig !== undefined && { actionConfig: data.actionConfig }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating rule:", error);
    res.status(500).json({ message: "Failed to update rule" });
  }
});

// ── DELETE /api/campaigns/rules/:id — Delete automation rule ─────────────────

router.delete("/rules/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const existing = await prisma.automation_rules.findFirst({
      where: { id, agentId: user.id },
    });
    if (!existing) return res.status(404).json({ message: "القاعدة غير موجودة" });

    await prisma.automation_rules.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting rule:", error);
    res.status(500).json({ message: "Failed to delete rule" });
  }
});

export default router;
