/**
 * routes/promotions.ts — Listing boost / paid promotion API.
 *
 * Mounted at `/api/promotions` in `apps/api/routes.ts`.
 *
 * | Method | Path        | Auth? | Purpose                                  |
 * |--------|-------------|-------|------------------------------------------|
 * | GET    | /           | Yes   | List agent's promotions with spend stats  |
 * | POST   | /           | Yes   | Create a new promotion (bid + budget)     |
 * | PUT    | /:id        | Yes   | Update status (ACTIVE/PAUSED/CANCELLED)   |
 * | GET    | /stats      | Yes   | Aggregate impressions/clicks/spend        |
 *
 * Higher bid = higher ranking in listing search results — similar to Google Ads.
 * Budget tracking: `spentAmount` incremented by the ad-serving layer; when
 * `spentAmount >= totalBudget * 0.95` the promotion should be auto-paused
 * (enforcement planned in E20).
 *
 * Consumer: marketing board `apps/web/src/pages/platform/marketing/board.tsx`.
 *
 * @see [[Features/Marketing & Campaigns]]
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  listingId: z.string().min(1),
  dailyBudget: z.number().positive(),
  totalBudget: z.number().positive().optional(),
  bidAmount: z.number().positive(),
  targetCities: z.array(z.string()).optional(),
  targetTypes: z.array(z.string()).optional(),
  targetBudgetMin: z.number().optional(),
  targetBudgetMax: z.number().optional(),
  endDate: z.string().datetime().optional(),
});

const updateSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
  dailyBudget: z.number().positive().optional(),
  bidAmount: z.number().positive().optional(),
  totalBudget: z.number().positive().optional(),
  endDate: z.string().datetime().optional(),
});

// ── GET /api/promotions — List agent's promotions ────────────────────────

router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const promotions = await prisma.listing_promotions.findMany({
      where: { agentId: user.id },
      include: {
        listing: {
          include: {
            properties: {
              select: { id: true, title: true, city: true, district: true, type: true, price: true, photos: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(promotions);
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res.status(500).json({ message: "فشل تحميل الترويجات" });
  }
});

// ── GET /api/promotions/stats — Aggregate stats ──────────────────────────

router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const [active, totals] = await Promise.all([
      prisma.listing_promotions.count({ where: { agentId: user.id, status: "ACTIVE" } }),
      prisma.listing_promotions.aggregate({
        where: { agentId: user.id },
        _sum: { spentAmount: true, impressions: true, clicks: true, inquiries: true },
      }),
    ]);

    res.json({
      activeCount: active,
      totalSpent: totals._sum.spentAmount || 0,
      totalImpressions: totals._sum.impressions || 0,
      totalClicks: totals._sum.clicks || 0,
      totalInquiries: totals._sum.inquiries || 0,
    });
  } catch (error) {
    console.error("Error fetching promotion stats:", error);
    res.status(500).json({ message: "فشل تحميل الإحصائيات" });
  }
});

// ── GET /api/promotions/listings — Agent's listings available to promote ──

router.get("/listings", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const listings = await prisma.listings.findMany({
      where: {
        agentId: user.id,
        status: "ACTIVE",
      },
      include: {
        properties: {
          select: { id: true, title: true, city: true, district: true, type: true, price: true, photos: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Mark which listings already have active promotions
    const activePromoListingIds = await prisma.listing_promotions.findMany({
      where: { agentId: user.id, status: "ACTIVE" },
      select: { listingId: true },
    });
    const promotedIds = new Set(activePromoListingIds.map((p) => p.listingId));

    const result = listings.map((l) => ({
      ...l,
      price: l.price ? Number(l.price) : null,
      isPromoted: promotedIds.has(l.id),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching listings for promotion:", error);
    res.status(500).json({ message: "فشل تحميل الإعلانات" });
  }
});

// ── POST /api/promotions — Create promotion ──────────────────────────────

router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = createSchema.parse(req.body);

    // Verify listing belongs to agent
    const listing = await prisma.listings.findFirst({
      where: { id: data.listingId, agentId: user.id, status: "ACTIVE" },
    });
    if (!listing) return res.status(404).json({ message: "الإعلان غير موجود أو غير نشط" });

    // Check for existing active promotion on this listing
    const existing = await prisma.listing_promotions.findFirst({
      where: { listingId: data.listingId, agentId: user.id, status: "ACTIVE" },
    });
    if (existing) return res.status(400).json({ message: "يوجد ترويج نشط لهذا الإعلان بالفعل" });

    const promotion = await prisma.listing_promotions.create({
      data: {
        listingId: data.listingId,
        agentId: user.id,
        organizationId: user.organizationId || undefined,
        dailyBudget: data.dailyBudget,
        totalBudget: data.totalBudget,
        bidAmount: data.bidAmount,
        targetCities: data.targetCities ? JSON.stringify(data.targetCities) : undefined,
        targetTypes: data.targetTypes ? JSON.stringify(data.targetTypes) : undefined,
        targetBudgetMin: data.targetBudgetMin,
        targetBudgetMax: data.targetBudgetMax,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: "ACTIVE",
      },
      include: {
        listing: {
          include: {
            properties: { select: { title: true, city: true, type: true } },
          },
        },
      },
    });

    res.status(201).json(promotion);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    console.error("Error creating promotion:", error);
    res.status(500).json({ message: "فشل إنشاء الترويج" });
  }
});

// ── PATCH /api/promotions/:id — Update promotion ─────────────────────────

router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const data = updateSchema.parse(req.body);

    const existing = await prisma.listing_promotions.findFirst({
      where: { id, agentId: user.id },
    });
    if (!existing) return res.status(404).json({ message: "الترويج غير موجود" });

    const updated = await prisma.listing_promotions.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.dailyBudget && { dailyBudget: data.dailyBudget }),
        ...(data.bidAmount && { bidAmount: data.bidAmount }),
        ...(data.totalBudget && { totalBudget: data.totalBudget }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating promotion:", error);
    res.status(500).json({ message: "فشل التحديث" });
  }
});

export default router;
