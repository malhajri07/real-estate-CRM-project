/**
 * routes/shortlists.ts — Property Shortlist Sharing (Session 5.9)
 *
 * Agent creates a curated shortlist → generates a public share link →
 * Client browses and rates properties.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";
import { randomUUID } from "crypto";

const router = Router();

// In-memory shortlist store (use DB table in production)
const shortlists = new Map<string, {
  id: string;
  agentId: string;
  clientName: string;
  propertyIds: string[];
  ratings: Record<string, { score: number; notes?: string }>;
  createdAt: Date;
}>();

// POST /api/shortlists — Create shortlist
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { clientName, propertyIds } = z.object({
      clientName: z.string().min(1),
      propertyIds: z.array(z.string()).min(1).max(20),
    }).parse(req.body);

    const id = randomUUID().slice(0, 8);
    shortlists.set(id, {
      id,
      agentId: user.id,
      clientName,
      propertyIds,
      ratings: {},
      createdAt: new Date(),
    });

    res.status(201).json({
      id,
      shareUrl: `/shortlist/${id}`,
      shareLink: `${req.protocol}://${req.get("host")}/shortlist/${id}`,
      propertyCount: propertyIds.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة" });
    res.status(500).json({ message: "فشل إنشاء القائمة" });
  }
});

// GET /api/shortlists/:id — Get shortlist with properties (public — no auth)
router.get("/:id", async (req, res) => {
  try {
    const shortlist = shortlists.get(req.params.id);
    if (!shortlist) return res.status(404).json({ message: "القائمة غير موجودة" });

    const properties = await prisma.properties.findMany({
      where: { id: { in: shortlist.propertyIds } },
      select: {
        id: true, title: true, city: true, district: true, type: true,
        price: true, bedrooms: true, bathrooms: true, areaSqm: true, photos: true,
      },
    });

    const agent = await prisma.users.findUnique({
      where: { id: shortlist.agentId },
      select: { firstName: true, lastName: true, phone: true },
    });

    res.json({
      id: shortlist.id,
      clientName: shortlist.clientName,
      agent: agent ? { name: `${agent.firstName} ${agent.lastName}`, phone: agent.phone } : null,
      properties: properties.map((p) => ({
        ...p,
        price: p.price ? Number(p.price) : null,
        areaSqm: p.areaSqm ? Number(p.areaSqm) : null,
        rating: shortlist.ratings[p.id] || null,
      })),
      createdAt: shortlist.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "فشل تحميل القائمة" });
  }
});

// POST /api/shortlists/:id/rate — Client rates a property (public)
router.post("/:id/rate", async (req, res) => {
  try {
    const shortlist = shortlists.get(req.params.id);
    if (!shortlist) return res.status(404).json({ message: "القائمة غير موجودة" });

    const { propertyId, score, notes } = z.object({
      propertyId: z.string(),
      score: z.number().min(1).max(5),
      notes: z.string().optional(),
    }).parse(req.body);

    shortlist.ratings[propertyId] = { score, notes };
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة" });
    res.status(500).json({ message: "فشل التقييم" });
  }
});

// GET /api/shortlists — Agent's shortlists (authenticated)
router.get("/", authenticateToken, async (req, res) => {
  const user = (req as any).user;
  const agentLists = Array.from(shortlists.values())
    .filter((s) => s.agentId === user.id)
    .map((s) => ({
      id: s.id,
      clientName: s.clientName,
      propertyCount: s.propertyIds.length,
      ratingsCount: Object.keys(s.ratings).length,
      createdAt: s.createdAt,
    }));
  res.json(agentLists);
});

export default router;
