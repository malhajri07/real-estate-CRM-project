/**
 * routes/subdivisions.ts — Land subdivision planning and lot management.
 *
 * Mounted at `/api/subdivisions`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | / | Yes | List subdivisions for agent/org |
 * | GET | /:id | Yes | Get subdivision with lots |
 * | POST | / | Yes | Create new subdivision |
 * | PUT | /:id | Yes | Update subdivision details |
 * | DELETE | /:id | Yes | Delete subdivision |
 *
 * Consumer: platform tools subdivision page, query key `subdivisions`.
 */
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

/**
 * List  with optional filters.
 *
 * @route   GET /api/subdivisions/
 * @auth    Required — any authenticated user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const where: any = user.organizationId ? { organizationId: user.organizationId } : { agentId: user.id };
    const items = await prisma.land_subdivisions.findMany({
      where, include: { lots: true }, orderBy: { createdAt: "desc" }, take: 50,
    });
    res.json(items.map((s) => ({ ...s, totalArea: Number(s.totalArea), lots: s.lots.map((l) => ({ ...l, areaSqm: Number(l.areaSqm), price: l.price ? Number(l.price) : null })) })));
  } catch (error) { res.status(500).json({ message: "فشل التحميل" }); }
});

/**
 * Create a new  record.
 *
 * @route   POST /api/subdivisions/
 * @auth    Required — any authenticated user
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = z.object({
      parentPropertyId: z.string(), totalArea: z.number().positive(), notes: z.string().optional(),
      lots: z.array(z.object({ lotNumber: z.string(), areaSqm: z.number().positive(), price: z.number().optional(), infrastructure: z.string().optional() })).optional(),
    }).parse(req.body);

    const sub = await prisma.land_subdivisions.create({
      data: {
        parentPropertyId: data.parentPropertyId, agentId: user.id, organizationId: user.organizationId || undefined,
        totalArea: data.totalArea, lotCount: data.lots?.length || 0, notes: data.notes,
        ...(data.lots && data.lots.length > 0 && { lots: { create: data.lots.map((l) => ({ lotNumber: l.lotNumber, areaSqm: l.areaSqm, price: l.price, infrastructure: l.infrastructure })) } }),
      },
      include: { lots: true },
    });
    res.status(201).json(sub);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة" });
    res.status(500).json({ message: "فشل الإنشاء" });
  }
});

/**
 * Partially update a :id record.
 *
 * @route   PATCH /api/subdivisions/:id/lots/:lotId
 * @auth    Required — any authenticated user
 */
router.patch("/:id/lots/:lotId", authenticateToken, async (req, res) => {
  try {
    const { status, buyerName, buyerPhone, price } = req.body;
    const updated = await prisma.subdivision_lots.update({
      where: { id: req.params.lotId },
      data: { ...(status && { status }), ...(buyerName && { buyerName }), ...(buyerPhone && { buyerPhone }), ...(price && { price }) },
    });
    res.json(updated);
  } catch (error) { res.status(500).json({ message: "فشل التحديث" }); }
});

export default router;
