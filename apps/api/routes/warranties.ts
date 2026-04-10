/**
 * routes/warranties.ts — Property warranty tracking and expiry alerts.
 *
 * Mounted at `/api/warranties`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | /:propertyId | Yes | List warranties for a property (sorted by expiry) |
 * | POST | /:propertyId | Yes | Add warranty to a property |
 * | PUT | /:propertyId/:id | Yes | Update warranty details |
 * | DELETE | /:propertyId/:id | Yes | Delete warranty record |
 *
 * Consumer: platform property detail warranty tab, query key `warranties`.
 */
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

router.get("/:propertyId", authenticateToken, async (req, res) => {
  try {
    const warranties = await prisma.property_warranties.findMany({
      where: { propertyId: req.params.propertyId },
      orderBy: { expiresAt: "asc" },
    });
    const now = new Date();
    res.json(warranties.map((w) => ({
      ...w,
      isExpired: w.expiresAt < now,
      daysUntilExpiry: Math.ceil((w.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      isExpiringSoon: w.expiresAt > now && w.expiresAt < new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    })));
  } catch (error) { res.status(500).json({ message: "فشل التحميل" }); }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const data = z.object({
      propertyId: z.string(), itemName: z.string(), brand: z.string().optional(),
      installedAt: z.string().datetime().optional(), expiresAt: z.string().datetime(),
      vendor: z.string().optional(), notes: z.string().optional(),
    }).parse(req.body);

    const warranty = await prisma.property_warranties.create({
      data: {
        propertyId: data.propertyId, itemName: data.itemName, brand: data.brand,
        installedAt: data.installedAt ? new Date(data.installedAt) : undefined,
        expiresAt: new Date(data.expiresAt), vendor: data.vendor, notes: data.notes,
      },
    });
    res.status(201).json(warranty);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة" });
    res.status(500).json({ message: "فشل الإنشاء" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.property_warranties.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ message: "فشل الحذف" }); }
});

// GET /api/warranties/expiring — All warranties expiring within 90 days
router.get("/expiring/soon", authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const items = await prisma.property_warranties.findMany({
      where: { expiresAt: { gte: now, lte: in90 } },
      orderBy: { expiresAt: "asc" },
      take: 50,
    });
    res.json(items);
  } catch (error) { res.status(500).json({ message: "فشل التحميل" }); }
});

export default router;
