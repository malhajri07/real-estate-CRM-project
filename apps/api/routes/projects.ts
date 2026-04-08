/**
 * routes/projects.ts — Off-Plan Projects & Units
 *
 * Endpoints:
 *   GET    /api/projects           — list agent's projects
 *   GET    /api/projects/stats     — aggregate stats
 *   POST   /api/projects           — create project
 *   GET    /api/projects/:id       — project with all units
 *   GET    /api/projects/:id/units — list units
 *   POST   /api/projects/:id/units — create unit
 *   PATCH  /api/projects/:id/units/:unitId — update unit
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function ownerWhere(user: any) {
  return user.organizationId
    ? { organizationId: user.organizationId }
    : { agentId: user.id };
}

// ── GET / — List agent's projects ────────────────────────────────────────────

router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const projects = await prisma.projects.findMany({
      where: ownerWhere(user),
      include: {
        units: {
          select: { id: true, status: true, price: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const result = projects.map((p) => {
      const totalUnits = p.units.length;
      const sold = p.units.filter((u) => u.status === "SOLD").length;
      const available = p.units.filter((u) => u.status === "AVAILABLE").length;
      const reserved = p.units.filter((u) => u.status === "RESERVED").length;
      return {
        ...p,
        unitsSold: sold,
        unitsAvailable: available,
        unitsReserved: reserved,
        unitsTotal: totalUnits,
        units: undefined, // strip raw units from list view
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "فشل تحميل المشاريع" });
  }
});

// ── GET /stats — Aggregate stats ─────────────────────────────────────────────

router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const where = ownerWhere(user);

    const projects = await prisma.projects.findMany({
      where,
      include: { units: { select: { status: true, price: true } } },
    });

    let totalUnits = 0;
    let sold = 0;
    let available = 0;
    let reserved = 0;
    let revenue = 0;

    for (const p of projects) {
      for (const u of p.units) {
        totalUnits++;
        if (u.status === "SOLD") {
          sold++;
          revenue += Number(u.price ?? 0);
        }
        if (u.status === "AVAILABLE") available++;
        if (u.status === "RESERVED") reserved++;
      }
    }

    res.json({
      totalProjects: projects.length,
      totalUnits,
      sold,
      available,
      reserved,
      soldPercent: totalUnits > 0 ? Math.round((sold / totalUnits) * 100) : 0,
      revenue,
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    res.status(500).json({ message: "فشل تحميل الإحصائيات" });
  }
});

// ── POST / — Create project ──────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z.string().min(1),
  developer: z.string().optional(),
  city: z.string().min(1),
  district: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  completionDate: z.string().optional(),
  totalUnits: z.number().int().optional(),
  coverImage: z.string().optional(),
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = createProjectSchema.parse(req.body);

    const project = await prisma.projects.create({
      data: {
        name: data.name,
        developer: data.developer,
        city: data.city,
        district: data.district,
        description: data.description,
        status: data.status || "PLANNING",
        completionDate: data.completionDate ? new Date(data.completionDate) : undefined,
        totalUnits: data.totalUnits ?? 0,
        coverImage: data.coverImage,
        agentId: user.id,
        organizationId: user.organizationId || undefined,
      },
    });

    res.status(201).json(project);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    }
    console.error("Error creating project:", error);
    res.status(500).json({ message: "فشل إنشاء المشروع" });
  }
});

// ── GET /:id — Project with units ────────────────────────────────────────────

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const project = await prisma.projects.findFirst({
      where: { id: req.params.id, ...ownerWhere(user) },
      include: {
        units: { orderBy: [{ floor: "asc" }, { unitNumber: "asc" }] },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "المشروع غير موجود" });
    }

    res.json({
      ...project,
      units: project.units.map((u) => ({
        ...u,
        areaSqm: u.areaSqm ? Number(u.areaSqm) : null,
        price: u.price ? Number(u.price) : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: "فشل تحميل المشروع" });
  }
});

// ── GET /:id/units — List units ──────────────────────────────────────────────

router.get("/:id/units", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    // Verify ownership
    const project = await prisma.projects.findFirst({
      where: { id: req.params.id, ...ownerWhere(user) },
      select: { id: true },
    });
    if (!project) {
      return res.status(404).json({ message: "المشروع غير موجود" });
    }

    const units = await prisma.project_units.findMany({
      where: { projectId: req.params.id },
      orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
      take: 500,
    });

    res.json(
      units.map((u) => ({
        ...u,
        areaSqm: u.areaSqm ? Number(u.areaSqm) : null,
        price: u.price ? Number(u.price) : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).json({ message: "فشل تحميل الوحدات" });
  }
});

// ── POST /:id/units — Create unit ────────────────────────────────────────────

const createUnitSchema = z.object({
  unitNumber: z.string().min(1),
  floor: z.number().int().optional(),
  type: z.string().optional(),
  areaSqm: z.number().optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  price: z.number().optional(),
  status: z.string().optional(),
});

router.post("/:id/units", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const project = await prisma.projects.findFirst({
      where: { id: req.params.id, ...ownerWhere(user) },
      select: { id: true },
    });
    if (!project) {
      return res.status(404).json({ message: "المشروع غير موجود" });
    }

    const data = createUnitSchema.parse(req.body);

    const unit = await prisma.project_units.create({
      data: {
        projectId: req.params.id,
        unitNumber: data.unitNumber,
        floor: data.floor,
        type: data.type,
        areaSqm: data.areaSqm,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        price: data.price,
        status: data.status || "AVAILABLE",
      },
    });

    res.status(201).json({
      ...unit,
      areaSqm: unit.areaSqm ? Number(unit.areaSqm) : null,
      price: unit.price ? Number(unit.price) : null,
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    }
    console.error("Error creating unit:", error);
    res.status(500).json({ message: "فشل إنشاء الوحدة" });
  }
});

// ── PATCH /:id/units/:unitId — Update unit ───────────────────────────────────

const updateUnitSchema = z.object({
  unitNumber: z.string().optional(),
  floor: z.number().int().optional(),
  type: z.string().optional(),
  areaSqm: z.number().optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  price: z.number().optional(),
  status: z.string().optional(),
  buyerName: z.string().optional(),
  buyerPhone: z.string().optional(),
  reservedAt: z.string().optional(),
  paymentSchedule: z.string().optional(),
});

router.patch("/:id/units/:unitId", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const project = await prisma.projects.findFirst({
      where: { id: req.params.id, ...ownerWhere(user) },
      select: { id: true },
    });
    if (!project) {
      return res.status(404).json({ message: "المشروع غير موجود" });
    }

    const data = updateUnitSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.reservedAt) {
      updateData.reservedAt = new Date(data.reservedAt);
    }

    const unit = await prisma.project_units.update({
      where: { id: req.params.unitId },
      data: updateData,
    });

    res.json({
      ...unit,
      areaSqm: unit.areaSqm ? Number(unit.areaSqm) : null,
      price: unit.price ? Number(unit.price) : null,
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    }
    console.error("Error updating unit:", error);
    res.status(500).json({ message: "فشل تحديث الوحدة" });
  }
});

export default router;
