/**
 * routes/tenancies.ts — Post-rental lifecycle management.
 *
 * Mounted at `/api/tenancies`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | / | Yes | List agent tenancies |
 * | POST | / | Yes | Create tenancy from a closed deal |
 * | GET | /:id | Yes | Tenancy detail + payment schedule |
 * | POST | /:id/payments | Yes | Create rent payment schedule |
 * | PATCH | /payments/:paymentId | Yes | Mark payment paid or overdue |
 * | POST  | /:id/send-reminder   | Yes | WhatsApp renewal reminder (E6)       |
 * | GET   | /stats/summary       | Yes | Aggregate stats                       |
 *
 * E6: `renewalReminderSentAt`, `paymentSummary` in list, renewal reminder endpoint.
 * Consumer: tenants page — query key `['/api/tenancies']`.
 * @see [[Sessions/E6 - Tenants]]
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

// GET /api/tenancies — List agent's tenancies
/**
 * List  with optional filters.
 *
 * @route   GET /api/tenancies/
 * @auth    Required — any authenticated user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const where: any = user.organizationId
      ? { organizationId: user.organizationId }
      : { agentId: user.id };

    const tenancies = await prisma.tenancies.findMany({
      where,
      include: {
        property: { select: { id: true, title: true, city: true, district: true, type: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
        rentPayments: { orderBy: { dueDate: "desc" }, take: 3 },
      },
      orderBy: { leaseEnd: "asc" },
      take: 100,
    });

    // Mark expiring (within 90 days)
    const now = new Date();
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const result = tenancies.map((t) => {
      /** Payment summary computed per tenancy (E6). Consumer: frontend stat badges. */
      const allPayments = t.rentPayments;
      const paid = allPayments.filter((p) => p.status === "PAID").length;
      const overdue = allPayments.filter((p) => p.status === "PENDING" && new Date(p.dueDate) < now).length;
      const upcoming = allPayments.filter((p) => p.status === "PENDING" && new Date(p.dueDate) >= now).length;

      return {
        ...t,
        monthlyRent: Number(t.monthlyRent),
        securityDeposit: t.securityDeposit ? Number(t.securityDeposit) : null,
        isExpiring: t.leaseEnd <= in90 && t.leaseEnd > now && t.status === "ACTIVE",
        daysUntilExpiry: Math.ceil((t.leaseEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        renewalReminderSentAt: t.renewalReminderSentAt,
        paymentSummary: { total: allPayments.length, paid, overdue, upcoming },
        rentPayments: allPayments.map((p) => ({
          ...p,
          amount: Number(p.amount),
          daysOverdue: p.status === "PENDING" && new Date(p.dueDate) < now
            ? Math.ceil((now.getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        })),
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching tenancies:", error);
    res.status(500).json({ message: "فشل تحميل عقود الإيجار" });
  }
});

// POST /api/tenancies — Create tenancy (usually from deal WON)
/**
 * Create a new  record.
 *
 * @route   POST /api/tenancies/
 * @auth    Required — any authenticated user
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const schema = z.object({
      dealId: z.string().optional(),
      propertyId: z.string(),
      tenantId: z.string(),
      leaseStart: z.string().datetime(),
      leaseEnd: z.string().datetime(),
      monthlyRent: z.number().positive(),
      securityDeposit: z.number().optional(),
      ejarContractNo: z.string().optional(),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const tenancy = await prisma.tenancies.create({
      data: {
        dealId: data.dealId,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        agentId: user.id,
        organizationId: user.organizationId || undefined,
        leaseStart: new Date(data.leaseStart),
        leaseEnd: new Date(data.leaseEnd),
        monthlyRent: data.monthlyRent,
        securityDeposit: data.securityDeposit,
        ejarContractNo: data.ejarContractNo,
        notes: data.notes,
      },
    });

    // Auto-generate rent payment records for the lease duration
    const start = new Date(data.leaseStart);
    const end = new Date(data.leaseEnd);
    const payments = [];
    let current = new Date(start);
    while (current < end) {
      payments.push({
        tenancyId: tenancy.id,
        amount: data.monthlyRent,
        dueDate: new Date(current),
        status: "PENDING" as const,
      });
      current.setMonth(current.getMonth() + 1);
    }

    if (payments.length > 0) {
      await prisma.rent_payments.createMany({ data: payments });
    }

    res.status(201).json({ ...tenancy, paymentsCreated: payments.length });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    console.error("Error creating tenancy:", error);
    res.status(500).json({ message: "فشل إنشاء عقد الإيجار" });
  }
});

// GET /api/tenancies/:id/payments — Get rent payment history
/**
 * Fetch a single :id by ID.
 *
 * @route   GET /api/tenancies/:id/payments
 * @auth    Required — any authenticated user
 */
router.get("/:id/payments", authenticateToken, async (req, res) => {
  try {
    const payments = await prisma.rent_payments.findMany({
      where: { tenancyId: req.params.id },
      orderBy: { dueDate: "asc" },
    });
    res.json(payments.map((p) => ({ ...p, amount: Number(p.amount) })));
  } catch (error) {
    res.status(500).json({ message: "فشل تحميل المدفوعات" });
  }
});

// PATCH /api/tenancies/:tenancyId/payments/:paymentId — Mark rent as paid
/**
 * Partially update a :tenancyId record.
 *
 * @route   PATCH /api/tenancies/:tenancyId/payments/:paymentId
 * @auth    Required — any authenticated user
 */
router.patch("/:tenancyId/payments/:paymentId", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["PAID", "PARTIAL", "WAIVED"].includes(status)) {
      return res.status(400).json({ message: "حالة غير صالحة" });
    }

    const updated = await prisma.rent_payments.update({
      where: { id: req.params.paymentId },
      data: { status, ...(status === "PAID" && { paidDate: new Date() }) },
    });

    res.json({ ...updated, amount: Number(updated.amount) });
  } catch (error) {
    res.status(500).json({ message: "فشل تحديث حالة الدفع" });
  }
});

/**
 * @route POST /api/tenancies/:id/send-reminder
 * @auth  Required
 * @returns `{ success, sentTo, message }`.
 *   Consumer: "Send renewal reminder" button in the tenancy detail sheet (E6).
 * @sideEffect Updates `tenancies.renewalReminderSentAt` to now.
 *   In production, would send WhatsApp via Unifonic/Twilio.
 */
router.post("/:id/send-reminder", authenticateToken, async (req, res) => {
  try {
    const tenancy = await prisma.tenancies.findUnique({
      where: { id: req.params.id },
      include: {
        tenant: { select: { firstName: true, lastName: true, phone: true } },
        property: { select: { title: true, city: true } },
      },
    });
    if (!tenancy) return res.status(404).json({ message: "العقد غير موجود" });

    const tenantName = `${tenancy.tenant.firstName} ${tenancy.tenant.lastName}`;
    const propertyTitle = tenancy.property?.title || "العقار";
    const leaseEnd = new Date(tenancy.leaseEnd).toLocaleDateString("ar-SA");

    // Pre-filled renewal message
    const message = `مرحباً ${tenantName}،\n\nنود تذكيرك بأن عقد إيجار "${propertyTitle}" ينتهي بتاريخ ${leaseEnd}.\n\nيرجى التواصل معنا لتجديد العقد.\n\nشكراً لكم.`;

    // Update the reminder timestamp
    await prisma.tenancies.update({
      where: { id: req.params.id },
      data: { renewalReminderSentAt: new Date() },
    });

    // In production: send via WhatsApp API (Unifonic/Twilio)
    // For now: return the message for the frontend to open wa.me link
    res.json({
      success: true,
      sentTo: tenancy.tenant.phone,
      message,
      waLink: `https://wa.me/${(tenancy.tenant.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
    });
  } catch (error) {
    console.error("Error sending renewal reminder:", error);
    res.status(500).json({ message: "فشل إرسال التذكير" });
  }
});

// GET /api/tenancies/stats — Summary stats
/**
 * List stats with optional filters.
 *
 * @route   GET /api/tenancies/stats/summary
 * @auth    Required — any authenticated user
 */
router.get("/stats/summary", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const where: any = user.organizationId
      ? { organizationId: user.organizationId }
      : { agentId: user.id };

    const now = new Date();
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [total, active, expiring, overdue] = await Promise.all([
      prisma.tenancies.count({ where }),
      prisma.tenancies.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.tenancies.count({ where: { ...where, status: "ACTIVE", leaseEnd: { lte: in90, gt: now } } }),
      prisma.rent_payments.count({
        where: {
          tenancy: where,
          status: "PENDING",
          dueDate: { lt: now },
        },
      }),
    ]);

    res.json({ total, active, expiring, overduePayments: overdue });
  } catch (error) {
    res.status(500).json({ message: "فشل تحميل الإحصائيات" });
  }
});

export default router;
