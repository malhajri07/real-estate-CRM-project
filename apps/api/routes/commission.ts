/**
 * routes/commission.ts — Commission Split Management
 *
 * Track how commission is divided between agent and brokerage per deal.
 * Auto-creates splits when deal → WON. CORP_OWNER can edit splits.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

// GET /api/deals/:dealId/commission — Get commission splits for a deal
router.get("/:dealId/commission", authenticateToken, async (req, res) => {
  try {
    const { dealId } = req.params;

    const splits = await prisma.commission_splits.findMany({
      where: { dealId },
      include: {
        recipient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
      select: { agreedPrice: true, commissionPercentage: true, commissionAmount: true },
    });

    res.json({
      dealId,
      totalCommission: deal?.commissionAmount ? Number(deal.commissionAmount) : null,
      commissionRate: deal?.commissionPercentage ? Number(deal.commissionPercentage) : null,
      dealValue: deal?.agreedPrice ? Number(deal.agreedPrice) : null,
      splits: splits.map((s) => ({
        id: s.id,
        recipientId: s.recipientId,
        recipientName: `${s.recipient.firstName} ${s.recipient.lastName}`,
        recipientType: s.recipientType,
        percentage: Number(s.percentage),
        amount: Number(s.amount),
        status: s.status,
        paidAt: s.paidAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching commission splits:", error);
    res.status(500).json({ message: "فشل تحميل توزيع العمولة" });
  }
});

// POST /api/deals/:dealId/commission — Create or update commission splits
router.post("/:dealId/commission", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const roles: string[] = typeof user.roles === "string" ? JSON.parse(user.roles) : (user.roles || []);
    const { dealId } = req.params;

    // Only CORP_OWNER or ADMIN can set splits
    if (!roles.includes("CORP_OWNER") && !roles.includes("WEBSITE_ADMIN")) {
      return res.status(403).json({ message: "فقط مدير المنشأة يمكنه تعديل توزيع العمولة" });
    }

    const schema = z.object({
      splits: z.array(z.object({
        recipientId: z.string(),
        recipientType: z.enum(["AGENT", "BROKERAGE", "REFERRAL"]),
        percentage: z.number().min(0).max(100),
      })),
    });

    const data = schema.parse(req.body);

    // Validate total doesn't exceed 100%
    const totalPct = data.splits.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPct > 100) {
      return res.status(400).json({ message: "مجموع النسب يتجاوز 100%" });
    }

    // Get deal value for calculating amounts
    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
      select: { agreedPrice: true, commissionPercentage: true, commissionAmount: true, organizationId: true },
    });

    if (!deal) return res.status(404).json({ message: "الصفقة غير موجودة" });

    // Verify same org
    if (!roles.includes("WEBSITE_ADMIN") && deal.organizationId !== user.organizationId) {
      return res.status(403).json({ message: "لا يمكنك تعديل صفقات منشأة أخرى" });
    }

    const totalCommission = deal.commissionAmount
      ? Number(deal.commissionAmount)
      : deal.agreedPrice && deal.commissionPercentage
        ? Number(deal.agreedPrice) * Number(deal.commissionPercentage) / 100
        : 0;

    // Delete existing splits and recreate
    await prisma.commission_splits.deleteMany({ where: { dealId } });

    const created = await prisma.$transaction(
      data.splits.map((s) =>
        prisma.commission_splits.create({
          data: {
            dealId,
            recipientId: s.recipientId,
            recipientType: s.recipientType,
            percentage: s.percentage,
            amount: Math.round(totalCommission * (s.percentage / 100) * 100) / 100,
            status: "PENDING",
          },
        })
      )
    );

    res.json({ dealId, totalCommission, splits: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    }
    console.error("Error setting commission splits:", error);
    res.status(500).json({ message: "فشل تعديل توزيع العمولة" });
  }
});

// PATCH /api/deals/:dealId/commission/:splitId/status — Update split payment status
router.patch("/:dealId/commission/:splitId/status", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const roles: string[] = typeof user.roles === "string" ? JSON.parse(user.roles) : (user.roles || []);

    if (!roles.includes("CORP_OWNER") && !roles.includes("WEBSITE_ADMIN")) {
      return res.status(403).json({ message: "فقط مدير المنشأة" });
    }

    const { status } = req.body;
    if (!["PENDING", "APPROVED", "PAID", "CANCELLED"].includes(status)) {
      return res.status(400).json({ message: "حالة غير صالحة" });
    }

    const updated = await prisma.commission_splits.update({
      where: { id: req.params.splitId },
      data: {
        status,
        ...(status === "PAID" && { paidAt: new Date() }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating commission status:", error);
    res.status(500).json({ message: "فشل تحديث حالة العمولة" });
  }
});

export default router;
