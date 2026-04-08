/**
 * routes/chatbot.ts — AI Chatbot for Lead Capture
 *
 * Public endpoint: website visitors interact with chatbot → auto-create lead.
 * Pre-defined flow: greet → interest → budget → city → bedrooms → create lead.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";

const router = Router();

// Conversation state stored in memory (use Redis in production)
const conversations = new Map<string, { step: number; data: Record<string, string>; lastActivity: number }>();

// Cleanup old conversations every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, conv] of conversations) {
    if (now - conv.lastActivity > 30 * 60 * 1000) conversations.delete(id);
  }
}, 10 * 60 * 1000);

const STEPS = [
  { key: "greeting", question: "مرحباً! أنا المساعد العقاري. كيف يمكنني مساعدتك اليوم؟", options: ["أبحث عن عقار للشراء", "أبحث عن عقار للإيجار", "أريد بيع عقاري"] },
  { key: "interest", question: "ممتاز! ما نوع العقار الذي تبحث عنه؟", options: ["شقة", "فيلا", "أرض", "تجاري", "أخرى"] },
  { key: "city", question: "في أي مدينة تبحث؟", options: ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "أخرى"] },
  { key: "budget", question: "ما ميزانيتك التقريبية؟", options: ["أقل من 500 ألف", "500 ألف - مليون", "مليون - 2 مليون", "أكثر من 2 مليون"] },
  { key: "bedrooms", question: "كم عدد غرف النوم المطلوبة؟", options: ["1-2", "3", "4", "5+"] },
  { key: "phone", question: "ممتاز! أدخل رقم جوالك وسيتواصل معك أحد وسطائنا المعتمدين خلال ساعة.", options: [] },
];

const BUDGET_MAP: Record<string, number> = {
  "أقل من 500 ألف": 500000,
  "500 ألف - مليون": 1000000,
  "مليون - 2 مليون": 2000000,
  "أكثر من 2 مليون": 5000000,
};

// POST /api/chatbot/message — Process chatbot message
router.post("/message", async (req, res) => {
  try {
    const { sessionId, message } = z.object({
      sessionId: z.string(),
      message: z.string(),
    }).parse(req.body);

    let conv = conversations.get(sessionId);
    if (!conv) {
      conv = { step: 0, data: {}, lastActivity: Date.now() };
      conversations.set(sessionId, conv);
    }
    conv.lastActivity = Date.now();

    const currentStep = STEPS[conv.step];

    // Store the user's answer
    if (conv.step > 0 && conv.step <= STEPS.length) {
      const prevStep = STEPS[conv.step - 1];
      conv.data[prevStep.key] = message;
    }

    // If user provided phone number (last step)
    if (conv.step >= STEPS.length - 1 && message.replace(/\D/g, "").length >= 9) {
      conv.data.phone = message;

      // Create lead from collected data
      try {
        // Find a default org to assign the lead
        const defaultOrg = await prisma.organizations.findFirst({ where: { status: "ACTIVE" }, select: { id: true } });
        const defaultAgent = await prisma.users.findFirst({
          where: { isActive: true, roles: { not: { equals: '["BUYER"]' } } },
          select: { id: true },
        });

        if (defaultAgent && defaultOrg) {
          const customer = await prisma.customers.create({
            data: {
              firstName: "عميل",
              lastName: "محتمل (شات بوت)",
              phone: conv.data.phone,
              city: conv.data.city || undefined,
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
              notes: `الاهتمام: ${conv.data.greeting || ""}\nالنوع: ${conv.data.interest || ""}\nالمدينة: ${conv.data.city || ""}\nالميزانية: ${conv.data.budget || ""}\nالغرف: ${conv.data.bedrooms || ""}`,
            },
          });
        }
      } catch (err) {
        console.error("Chatbot lead creation error:", err);
      }

      conversations.delete(sessionId);

      return res.json({
        message: "شكراً لك! تم تسجيل طلبك وسيتواصل معك أحد وسطائنا المعتمدين قريباً.",
        options: [],
        completed: true,
      });
    }

    // Advance to next step
    conv.step++;
    const nextStep = STEPS[Math.min(conv.step, STEPS.length - 1)];

    res.json({
      message: nextStep.question,
      options: nextStep.options,
      completed: false,
      step: conv.step,
      totalSteps: STEPS.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة" });
    console.error("Chatbot error:", error);
    res.status(500).json({ message: "حدث خطأ" });
  }
});

// GET /api/chatbot/init — Start new conversation
router.get("/init", (_req, res) => {
  const sessionId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  conversations.set(sessionId, { step: 0, data: {}, lastActivity: Date.now() });

  res.json({
    sessionId,
    message: STEPS[0].question,
    options: STEPS[0].options,
    step: 0,
    totalSteps: STEPS.length,
  });
});

export default router;
