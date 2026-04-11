/**
 * routes/chatbot.ts — Conversational property search bot + lead capture.
 *
 * Mounted at `/api/chatbot` in `apps/api/routes.ts`.
 *
 * | Method | Path       | Auth? | Purpose                                      |
 * |--------|------------|-------|----------------------------------------------|
 * | POST   | /message   | No    | Send user message → get bot response          |
 * | POST   | /reset     | No    | Reset conversation state                      |
 *
 * The chatbot is a stateful finite-state machine stored in a per-session
 * `conversations` Map (in-memory, auto-cleaned after 30 min). Steps:
 *
 * 1. `greeting` → asks what the user is looking for
 * 2. `city` → collects target city
 * 3. `type` → collects property type
 * 4. `budget` → parses budget range (supports Arabic numerals + SAR)
 * 5. `results` → searches real listings from Postgres, returns top 5
 * 6. `phone` → collects phone → **auto-creates a lead** in the CRM
 *
 * Additional branches: WhatsApp handoff, viewing scheduler, mortgage check,
 * neighborhood intelligence.
 *
 * Consumer: chatbot widget on the landing page; also embeddable via the
 *   chatbot API for WhatsApp bot integrations.
 *
 * @see [[Features/Chatbot]]
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";

const router = Router();

interface ConvState {
  step: string;
  data: Record<string, string>;
  lastActivity: number;
  matchedListings?: any[];
}

const conversations = new Map<string, ConvState>();

// Cleanup every 10 min
setInterval(() => {
  const now = Date.now();
  for (const [id, conv] of conversations) {
    if (now - conv.lastActivity > 30 * 60 * 1000) conversations.delete(id);
  }
}, 10 * 60 * 1000);

// ── Helpers ──────────────────────────────────────────────────────────────

function parseBudget(text: string): { min: number; max: number } | null {
  const t = text.replace(/,/g, "").replace(/٬/g, "");
  // "أقل من 500 ألف" / "500 ألف - مليون" / "مليون" / "2 مليون"
  const millions = t.match(/(\d+(?:\.\d+)?)\s*مليون/);
  const thousands = t.match(/(\d+)\s*ألف/);
  const plain = t.match(/(\d{5,})/);

  if (millions) {
    const val = parseFloat(millions[1]) * 1_000_000;
    return { min: val * 0.8, max: val * 1.2 };
  }
  if (thousands) {
    const val = parseInt(thousands[1]) * 1000;
    return { min: val * 0.8, max: val * 1.2 };
  }
  if (plain) {
    const val = parseInt(plain[1]);
    return { min: val * 0.8, max: val * 1.2 };
  }

  // Preset options
  const presets: Record<string, { min: number; max: number }> = {
    "أقل من 500 ألف": { min: 0, max: 500_000 },
    "500 ألف - مليون": { min: 500_000, max: 1_000_000 },
    "مليون - 2 مليون": { min: 1_000_000, max: 2_000_000 },
    "أكثر من 2 مليون": { min: 2_000_000, max: 50_000_000 },
  };
  return presets[text] || null;
}

function parseBedrooms(text: string): number | null {
  const match = text.match(/(\d+)/);
  if (match) return parseInt(match[1]);
  if (text.includes("5+") || text.includes("5 فأكثر")) return 5;
  return null;
}

async function searchProperties(data: Record<string, string>): Promise<any[]> {
  const typeMap: Record<string, string[]> = {
    "شقة": ["apartment", "شقة", "studio", "استوديو"],
    "فيلا": ["villa", "فيلا", "palace", "قصر", "duplex", "دوبلكس"],
    "أرض": ["land", "أرض", "vacant_land", "residential_land", "commercial_land"],
    "تجاري": ["commercial", "office", "shop", "mall", "warehouse", "مكتب", "محل"],
    "دوبلكس": ["duplex", "دوبلكس", "townhouse"],
  };

  const where: any = { status: "ACTIVE" };
  if (data.city) where.city = data.city;
  if (data.type && typeMap[data.type]) {
    where.type = { in: typeMap[data.type] };
  } else if (data.type) {
    where.type = data.type;
  }

  const budget = data.budget ? parseBudget(data.budget) : null;
  if (budget) where.price = { gte: budget.min, lte: budget.max };

  const bedrooms = data.bedrooms ? parseBedrooms(data.bedrooms) : null;
  if (bedrooms) where.bedrooms = { gte: bedrooms };

  let listings = await prisma.properties.findMany({
    where,
    select: {
      id: true,
      title: true,
      city: true,
      district: true,
      type: true,
      price: true,
      bedrooms: true,
      bathrooms: true,
      areaSqm: true,
      photos: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Fallback: if no results, try without type filter
  if (listings.length === 0 && where.type) {
    delete where.type;
    const fallback = await prisma.properties.findMany({
      where,
      select: {
        id: true, title: true, city: true, district: true, type: true,
        price: true, bedrooms: true, bathrooms: true, areaSqm: true, photos: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    listings = fallback;
  }

  // Second fallback: if still nothing, try just city with ACTIVE status
  if (listings.length === 0 && where.city) {
    const cityOnly = await prisma.properties.findMany({
      where: { city: where.city, status: "ACTIVE" },
      select: {
        id: true, title: true, city: true, district: true, type: true,
        price: true, bedrooms: true, bathrooms: true, areaSqm: true, photos: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    listings = cityOnly;
  }

  return listings.map((l) => {
    let photo = null;
    try {
      const arr = l.photos ? JSON.parse(l.photos as string) : [];
      photo = Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    } catch { /* ignore */ }

    return {
      id: l.id,
      title: l.title || `${l.type} في ${l.city}`,
      city: l.city,
      district: l.district,
      type: l.type,
      price: l.price ? Number(l.price) : null,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      area: l.areaSqm ? Number(l.areaSqm) : null,
      photo,
      url: `/listing/${l.id}`,
    };
  });
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} مليون`;
  if (n >= 1000) return `${Math.round(n / 1000)} ألف`;
  return `${n}`;
}

// ── Main message handler ─────────────────────────────────────────────────

async function processMessage(sessionId: string, message: string): Promise<{
  messages: { content: string; options?: string[]; listings?: any[] }[];
  completed?: boolean;
  whatsappHandoff?: { phone: string; prefilledText: string };
}> {
  let conv = conversations.get(sessionId);
  if (!conv) {
    conv = { step: "greeting", data: {}, lastActivity: Date.now() };
    conversations.set(sessionId, conv);
  }
  conv.lastActivity = Date.now();

  const msg = message.trim();
  const msgLower = msg.toLowerCase();

  // ── Detect intent from free text at any step ──
  if (conv.step === "greeting" || conv.step === "awaiting_choice") {
    if (msgLower.includes("شراء") || msgLower.includes("أشتري") || msgLower.includes("buy")) {
      conv.data.interest = "شراء";
      conv.step = "ask_type";
    } else if (msgLower.includes("إيجار") || msgLower.includes("أستأجر") || msgLower.includes("rent")) {
      conv.data.interest = "إيجار";
      conv.step = "ask_type";
    } else if (msgLower.includes("بيع") || msgLower.includes("أبيع") || msgLower.includes("sell")) {
      conv.data.interest = "بيع";
      conv.step = "seller_flow";
    } else if (msgLower.includes("تمويل") || msgLower.includes("قسط") || msgLower.includes("mortgage")) {
      return {
        messages: [{
          content: "حاسبة التمويل متاحة هنا 👇\nأدخل سعر العقار، الدفعة المقدمة، ونسبة الربح لحساب القسط الشهري.",
          options: ["أبحث عن عقار", "أريد بيع عقاري"],
        }],
      };
    } else {
      // Default: show main options
      conv.step = "awaiting_choice";
      return {
        messages: [{
          content: "مرحباً! أنا المساعد العقاري في عقاركم. كيف يمكنني مساعدتك؟",
          options: ["أبحث عن عقار للشراء", "أبحث عن عقار للإيجار", "أريد بيع عقاري", "حاسبة التمويل"],
        }],
      };
    }
  }

  // ── Step: Ask property type ──
  if (conv.step === "ask_type") {
    const types: Record<string, string> = { "شقة": "apartment", "فيلا": "villa", "أرض": "land", "تجاري": "commercial", "دوبلكس": "duplex", "تاون هاوس": "townhouse" };
    for (const [ar] of Object.entries(types)) {
      if (msg.includes(ar)) { conv.data.type = ar; break; }
    }
    if (!conv.data.type) {
      return {
        messages: [{ content: "ما نوع العقار الذي تبحث عنه؟", options: ["شقة", "فيلا", "أرض", "دوبلكس", "تجاري"] }],
      };
    }
    conv.step = "ask_city";
    return {
      messages: [{ content: "في أي مدينة تبحث؟", options: ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر"] }],
    };
  }

  // ── Step: Ask city ──
  if (conv.step === "ask_city") {
    const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "الطائف", "تبوك", "أبها"];
    for (const c of cities) { if (msg.includes(c)) { conv.data.city = c; break; } }
    if (!conv.data.city && msg.length > 2 && msg.length < 20 && !msg.includes("شقة") && !msg.includes("فيلا")) {
      conv.data.city = msg;
    }
    if (!conv.data.city) {
      return {
        messages: [{ content: "في أي مدينة تبحث؟", options: ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر"] }],
      };
    }
    conv.step = "ask_budget";
    return {
      messages: [{ content: "ما ميزانيتك التقريبية؟", options: ["أقل من 500 ألف", "500 ألف - مليون", "مليون - 2 مليون", "أكثر من 2 مليون"] }],
    };
  }

  // ── Step: Ask budget ──
  if (conv.step === "ask_budget") {
    if (parseBudget(msg)) conv.data.budget = msg;
    if (!conv.data.budget) {
      return {
        messages: [{ content: "ما ميزانيتك التقريبية؟", options: ["أقل من 500 ألف", "500 ألف - مليون", "مليون - 2 مليون", "أكثر من 2 مليون"] }],
      };
    }
    conv.step = "ask_bedrooms";
    return {
      messages: [{ content: "كم عدد غرف النوم المطلوبة؟", options: ["1-2", "3", "4", "5+"] }],
    };
  }

  // ── Step: Ask bedrooms ──
  if (conv.step === "ask_bedrooms") {
    if (parseBedrooms(msg) !== null) conv.data.bedrooms = msg;
    if (!conv.data.bedrooms) {
      return {
        messages: [{ content: "كم عدد غرف النوم المطلوبة؟", options: ["1-2", "3", "4", "5+"] }],
      };
    }
    conv.step = "search";
  }

  // ── Step: Search properties ──
  if (conv.step === "search") {
    const results = await searchProperties(conv.data);
    conv.matchedListings = results;

    if (results.length === 0) {
      conv.step = "no_results";
      return {
        messages: [
          { content: `لم أجد عقارات تطابق معاييرك في ${conv.data.city}. يمكنني البحث بمعايير مختلفة أو توصيلك بوسيط متخصص.` },
          { content: "ماذا تفضل؟", options: ["بحث بمعايير أخرى", "تواصل مع وسيط"] },
        ],
      };
    }

    conv.step = "show_results";
    const summary = results.map((r, i) =>
      `${i + 1}. ${r.title}\n   📍 ${r.city}${r.district ? ` - ${r.district}` : ""}\n   💰 ${r.price ? formatPrice(r.price) + " ر.س" : "اتصل للسعر"}\n   🛏 ${r.bedrooms || "—"} غرف · ${r.area ? r.area + " م²" : ""}`
    ).join("\n\n");

    return {
      messages: [
        { content: `وجدت ${results.length} عقار يطابق معاييرك:` },
        { content: summary, listings: results },
        { content: "هل تود:", options: ["معاينة عقار", "أرسل التفاصيل على واتساب", "بحث بمعايير أخرى"] },
      ],
    };
  }

  // ── Step: Show results follow-up ──
  if (conv.step === "show_results" || conv.step === "no_results") {
    if (msg.includes("معاينة") || msg.includes("موعد") || msg.includes("زيارة")) {
      conv.step = "schedule_viewing";
      return {
        messages: [{
          content: "ممتاز! لحجز موعد معاينة، أحتاج رقم جوالك وسيتواصل معك الوسيط خلال ساعة لتحديد الموعد.",
          options: [],
        }],
      };
    }
    if (msg.includes("واتساب") || msg.includes("whatsapp") || msg.includes("أرسل")) {
      conv.step = "collect_phone_whatsapp";
      return {
        messages: [{ content: "أدخل رقم جوالك وسأرسل لك التفاصيل على واتساب فوراً 📱", options: [] }],
      };
    }
    if (msg.includes("وسيط") || msg.includes("تواصل")) {
      conv.step = "collect_phone_agent";
      return {
        messages: [{ content: "أدخل رقم جوالك وسيتواصل معك أحد وسطائنا المعتمدين خلال ساعة.", options: [] }],
      };
    }
    if (msg.includes("بحث") || msg.includes("أخرى") || msg.includes("مختلف")) {
      conv.data = {};
      conv.step = "ask_type";
      return {
        messages: [{ content: "ما نوع العقار الذي تبحث عنه؟", options: ["شقة", "فيلا", "أرض", "دوبلكس", "تجاري"] }],
      };
    }
  }

  // ── Step: Collect phone for WhatsApp handoff ──
  if (conv.step === "collect_phone_whatsapp") {
    const phone = msg.replace(/[\s\-\+]/g, "").replace(/^966/, "0");
    if (phone.match(/^05\d{8}$/)) {
      await createLead(conv.data, phone);
      const listings = conv.matchedListings || [];
      const text = listings.length > 0
        ? `مرحباً، وجدت ${listings.length} عقار يطابق اهتمامك:\n\n${listings.map((l: any, i: number) => `${i + 1}. ${l.title} — ${l.price ? formatPrice(l.price) + " ر.س" : ""}`).join("\n")}\n\nللتفاصيل: ${listings[0]?.url ? "https://aqarkom.com" + listings[0].url : ""}`
        : "مرحباً، أبحث عن عقار";

      conversations.delete(sessionId);
      return {
        messages: [{ content: "تم! سأرسل لك التفاصيل على واتساب الآن. شكراً لاستخدامك عقاركم! 🏠" }],
        completed: true,
        whatsappHandoff: { phone: phone.replace(/^0/, "966"), prefilledText: text },
      };
    }
    return { messages: [{ content: "يرجى إدخال رقم جوال صحيح (مثال: 0551234567)", options: [] }] };
  }

  // ── Step: Collect phone for viewing/agent ──
  if (conv.step === "schedule_viewing" || conv.step === "collect_phone_agent") {
    const phone = msg.replace(/[\s\-\+]/g, "").replace(/^966/, "0");
    if (phone.match(/^05\d{8}$/)) {
      await createLead(conv.data, phone);
      conversations.delete(sessionId);
      return {
        messages: [{ content: "شكراً لك! تم تسجيل طلبك وسيتواصل معك أحد وسطائنا المعتمدين خلال ساعة. 🏠✅" }],
        completed: true,
      };
    }
    return { messages: [{ content: "يرجى إدخال رقم جوال صحيح (مثال: 0551234567)", options: [] }] };
  }

  // ── Seller flow ──
  if (conv.step === "seller_flow") {
    conv.step = "seller_collect_phone";
    return {
      messages: [{
        content: "ممتاز! يمكنك إدراج عقارك مجاناً عبر صفحة الإدراج، أو أدخل رقم جوالك وسيتواصل معك وسيط لمساعدتك.",
        options: ["إدراج عقاري الآن", "أريد وسيط يتواصل معي"],
      }],
    };
  }

  if (conv.step === "seller_collect_phone") {
    if (msg.includes("إدراج") || msg.includes("أدرج")) {
      conversations.delete(sessionId);
      return {
        messages: [{ content: "توجه إلى صفحة إدراج العقار من هنا: /unverified-listings\nشكراً لاستخدامك عقاركم!" }],
        completed: true,
      };
    }
    const phone = msg.replace(/[\s\-\+]/g, "").replace(/^966/, "0");
    if (phone.match(/^05\d{8}$/)) {
      await createLead({ interest: "بيع" }, phone);
      conversations.delete(sessionId);
      return {
        messages: [{ content: "تم تسجيل طلبك! سيتواصل معك وسيط متخصص خلال ساعة. 🏠" }],
        completed: true,
      };
    }
    return {
      messages: [{ content: "أدخل رقم جوالك للتواصل (مثال: 0551234567)", options: [] }],
    };
  }

  // Fallback
  return {
    messages: [{ content: "عذراً، لم أفهم طلبك. كيف يمكنني مساعدتك؟", options: ["أبحث عن عقار للشراء", "أبحث عن عقار للإيجار", "أريد بيع عقاري"] }],
  };
}

// ── Lead creation ────────────────────────────────────────────────────────

async function createLead(data: Record<string, string>, phone: string) {
  try {
    const defaultOrg = await prisma.organizations.findFirst({ where: { status: "ACTIVE" }, select: { id: true } });
    const defaultAgent = await prisma.users.findFirst({
      where: { isActive: true, roles: { not: { equals: '["BUYER"]' } } },
      select: { id: true },
    });

    if (!defaultAgent || !defaultOrg) return;

    const customer = await prisma.customers.create({
      data: {
        firstName: "عميل",
        lastName: "محتمل",
        phone,
        city: data.city || undefined,
        source: "CHATBOT",
        organizationId: defaultOrg.id,
      },
    });

    await prisma.leads.create({
      data: {
        agentId: defaultAgent.id,
        organizationId: defaultOrg.id,
        customerId: customer.id,
        source: "CHATBOT",
        notes: [
          data.interest && `الاهتمام: ${data.interest}`,
          data.type && `النوع: ${data.type}`,
          data.city && `المدينة: ${data.city}`,
          data.budget && `الميزانية: ${data.budget}`,
          data.bedrooms && `الغرف: ${data.bedrooms}`,
        ].filter(Boolean).join("\n"),
      },
    });
  } catch (err) {
    console.error("Chatbot lead creation error:", err);
  }
}

// ── Routes ───────────────────────────────────────────────────────────────

// GET /api/chatbot/init — Start new conversation
/**
 * List init with optional filters.
 *
 * @route   GET /api/chatbot/init
 * @auth    Public — no auth required
 */
router.get("/init", (_req, res) => {
  const sessionId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  conversations.set(sessionId, { step: "greeting", data: {}, lastActivity: Date.now() });

  res.json({
    sessionId,
    messages: [{
      content: "مرحباً! أنا المساعد العقاري في عقاركم 🏠\nكيف يمكنني مساعدتك اليوم؟",
      options: ["أبحث عن عقار للشراء", "أبحث عن عقار للإيجار", "أريد بيع عقاري", "حاسبة التمويل"],
    }],
  });
});

// POST /api/chatbot/message — Process user message
/**
 * Create a new message record.
 *
 * @route   POST /api/chatbot/message
 * @auth    Public — no auth required
 */
router.post("/message", async (req, res) => {
  try {
    const { sessionId, message } = z.object({
      sessionId: z.string(),
      message: z.string().min(1),
    }).parse(req.body);

    const result = await processMessage(sessionId, message);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة" });
    console.error("Chatbot error:", error);
    res.status(500).json({ message: "حدث خطأ" });
  }
});

export default router;
