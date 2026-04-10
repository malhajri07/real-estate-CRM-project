/**
 * routes/inbox.ts — Two-way WhatsApp / omnichannel inbox.
 *
 * Mounted at `/api/inbox` in `apps/api/routes.ts`.
 *
 * | Method | Path                     | Auth? | Purpose                                 |
 * |--------|--------------------------|-------|-----------------------------------------|
 * | GET    | /                        | Yes   | Conversation list (grouped by lead/phone)|
 * | GET    | /:leadId                 | Yes   | Full message thread for a lead           |
 * | POST   | /send                    | Yes   | Send outbound message                    |
 * | POST   | /webhooks/whatsapp       | No    | Inbound webhook from Unifonic/Twilio     |
 *
 * Messages are grouped into conversations by `leadId` (preferred) or `phone`
 * (fallback for unknown contacts). Unread counts are computed per conversation.
 *
 * The webhook matches inbound messages to a customer by phone, creates a
 * `messages` row with `direction = 'INBOUND'`, and surfaces it in the inbox.
 *
 * Consumer: inbox page `apps/web/src/pages/platform/inbox/index.tsx`
 *   (query key `['/api/inbox']`).
 *
 * @see [[Features/Marketing & Campaigns]]
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma, basePrisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

// ── GET /api/inbox — Conversation list ──────────────────────────────────────
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const agentId = user.id;

    // Fetch all messages for this agent, ordered newest-first
    const allMessages: any[] = await (basePrisma as any).messages.findMany({
      where: { agentId },
      orderBy: { sentAt: "desc" },
      take: 5000, // safety cap
    });

    // Group by leadId (preferred) or phone as conversation key
    const convMap = new Map<
      string,
      {
        conversationKey: string;
        leadId: string | null;
        phone: string | null;
        lastMessage: any;
        unreadCount: number;
      }
    >();

    for (const msg of allMessages) {
      const key = msg.leadId || msg.phone || msg.id;
      if (!convMap.has(key)) {
        convMap.set(key, {
          conversationKey: key,
          leadId: msg.leadId,
          phone: msg.phone,
          lastMessage: msg,
          unreadCount: 0,
        });
      }
      // Count inbound messages that haven't been read
      if (msg.direction === "INBOUND" && msg.status !== "READ") {
        const conv = convMap.get(key)!;
        conv.unreadCount++;
      }
    }

    // Attempt to enrich conversations with lead/customer name
    const conversations = Array.from(convMap.values());
    const leadIds = conversations.map((c) => c.leadId).filter(Boolean) as string[];

    let leadNameMap: Record<string, string> = {};
    if (leadIds.length > 0) {
      const leads = await prisma.leads.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, customerId: true },
      });
      const customerIds = leads.map((l) => l.customerId).filter(Boolean) as string[];
      if (customerIds.length > 0) {
        const customers = await prisma.customers.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, firstName: true, lastName: true, phone: true },
        });
        const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));
        for (const lead of leads) {
          if (lead.customerId && customerMap[lead.customerId]) {
            const c = customerMap[lead.customerId];
            leadNameMap[lead.id] = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.phone || "عميل";
          }
        }
      }
    }

    const result = conversations.map((c) => ({
      conversationKey: c.conversationKey,
      leadId: c.leadId,
      phone: c.phone,
      contactName: (c.leadId && leadNameMap[c.leadId]) || c.phone || "غير معروف",
      lastMessageContent: c.lastMessage.content,
      lastMessageAt: c.lastMessage.sentAt,
      lastMessageDirection: c.lastMessage.direction,
      unreadCount: c.unreadCount,
      channel: c.lastMessage.channel,
    }));

    // Sort by most recent message
    result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    res.json(result);
  } catch (error) {
    console.error("GET /api/inbox error:", error);
    res.status(500).json({ error: "فشل في جلب المحادثات" });
  }
});

// ── GET /api/inbox/:leadId — Full message thread ────────────────────────────
router.get("/:leadId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const user = req.user!;

    const messages: any[] = await (basePrisma as any).messages.findMany({
      where: {
        agentId: user.id,
        OR: [{ leadId }, { phone: leadId }],
      },
      orderBy: { sentAt: "asc" },
      take: 500,
    });

    // Mark inbound messages as read
    const unreadIds = messages
      .filter((m) => m.direction === "INBOUND" && m.status !== "READ")
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await (basePrisma as any).messages.updateMany({
        where: { id: { in: unreadIds } },
        data: { status: "READ", readAt: new Date() },
      });
    }

    res.json(messages);
  } catch (error) {
    console.error("GET /api/inbox/:leadId error:", error);
    res.status(500).json({ error: "فشل في جلب الرسائل" });
  }
});

// ── POST /api/inbox/send — Send a message ───────────────────────────────────
const sendSchema = z.object({
  leadId: z.string().optional(),
  channel: z.enum(["whatsapp", "sms", "email"]).default("whatsapp"),
  content: z.string().min(1),
  phone: z.string().optional(),
});

router.post("/send", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const data = sendSchema.parse(req.body);

    if (!data.leadId && !data.phone) {
      return res.status(400).json({ error: "leadId أو phone مطلوب" });
    }

    // If leadId provided but no phone, look up from the lead/customer
    let resolvedPhone = data.phone;
    if (data.leadId && !resolvedPhone) {
      const lead = await prisma.leads.findUnique({
        where: { id: data.leadId },
        select: { customerId: true },
      });
      if (lead?.customerId) {
        const customer = await prisma.customers.findUnique({
          where: { id: lead.customerId },
          select: { phone: true },
        });
        resolvedPhone = customer?.phone ?? undefined;
      }
    }

    const message = await (basePrisma as any).messages.create({
      data: {
        leadId: data.leadId ?? null,
        agentId: user.id,
        direction: "OUTBOUND",
        channel: data.channel,
        content: data.content,
        phone: resolvedPhone ?? null,
        status: "SENT",
      },
    });

    // TODO: Integrate with WhatsApp Business API to actually send the message
    // For now, we just persist it.

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("POST /api/inbox/send error:", error);
    res.status(500).json({ error: "فشل في إرسال الرسالة" });
  }
});

// ── POST /api/webhooks/whatsapp — Incoming webhook (no auth) ────────────────
router.post("/whatsapp", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // WhatsApp Cloud API webhook verification (GET challenge)
    // For POST, parse the incoming message
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const incomingMessage = value?.messages?.[0];

    if (!incomingMessage) {
      // Could be a status update - acknowledge it
      return res.status(200).json({ status: "ok" });
    }

    const fromPhone = incomingMessage.from; // e.g. "966501234567"
    const messageText = incomingMessage.text?.body || "";
    const waMessageId = incomingMessage.id;

    // Try to find a lead/agent associated with this phone number
    const customer = await prisma.customers.findFirst({
      where: { phone: { contains: fromPhone } },
      select: { id: true },
    });

    const lead = customer
      ? await prisma.leads.findFirst({
          where: { customerId: customer.id },
          select: { id: true, agentId: true },
        })
      : null;

    if (lead?.agentId) {
      await (basePrisma as any).messages.create({
        data: {
          leadId: lead.id,
          customerId: customer?.id ?? null,
          agentId: lead.agentId,
          direction: "INBOUND",
          channel: "whatsapp",
          content: messageText,
          phone: fromPhone,
          status: "DELIVERED",
          metadata: JSON.stringify({ waMessageId }),
        },
      });
    } else {
      // No matching lead — store as orphan message for manual routing
      // Use a system/fallback agent ID or skip
      // For now, we still save it if we can find any agent
      const firstAgent = await prisma.users.findFirst({
        where: { roles: { contains: "INDIV_AGENT" } },
        select: { id: true },
      });

      if (firstAgent) {
        await (basePrisma as any).messages.create({
          data: {
            customerId: customer?.id ?? null,
            agentId: firstAgent.id,
            direction: "INBOUND",
            channel: "whatsapp",
            content: messageText,
            phone: fromPhone,
            status: "DELIVERED",
            metadata: JSON.stringify({ waMessageId, unmatched: true }),
          },
        });
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("POST /api/webhooks/whatsapp error:", error);
    // Always return 200 to WhatsApp to prevent retries
    res.status(200).json({ status: "error" });
  }
});

export default router;
