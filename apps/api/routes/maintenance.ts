/**
 * routes/maintenance.ts — Maintenance Request System (Session 5.6)
 *
 * CRUD + stats for property maintenance requests.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

const VALID_CATEGORIES = ["plumbing", "electrical", "hvac", "general", "structural"] as const;
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const VALID_STATUSES = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

// GET /api/maintenance/stats — Count by status
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // Get properties the agent manages
    const agentProperties = await prisma.properties.findMany({
      where: user.organizationId
        ? { organizationId: user.organizationId }
        : { agentId: user.id },
      select: { id: true },
    });
    const propertyIds = agentProperties.map((p: { id: string }) => p.id);

    const counts = await prisma.maintenance_requests.groupBy({
      by: ["status"],
      where: { propertyId: { in: propertyIds } },
      _count: { status: true },
    });

    const stats: Record<string, number> = {};
    for (const s of VALID_STATUSES) {
      stats[s] = 0;
    }
    for (const row of counts) {
      stats[row.status] = row._count.status;
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching maintenance stats:", error);
    res.status(500).json({ message: "Failed to load maintenance stats" });
  }
});

// GET /api/maintenance — List requests (filtered by agent's properties)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { status, priority, category } = req.query;

    // Get properties the agent manages
    const agentProperties = await prisma.properties.findMany({
      where: user.organizationId
        ? { organizationId: user.organizationId }
        : { agentId: user.id },
      select: { id: true },
    });
    const propertyIds = agentProperties.map((p: { id: string }) => p.id);

    const where: any = { propertyId: { in: propertyIds } };
    if (status && typeof status === "string") where.status = status;
    if (priority && typeof priority === "string") where.priority = priority;
    if (category && typeof category === "string") where.category = category;

    const requests = await prisma.maintenance_requests.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json(
      requests.map((r: any) => ({
        ...r,
        cost: r.cost ? Number(r.cost) : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    res.status(500).json({ message: "Failed to load maintenance requests" });
  }
});

// POST /api/maintenance — Create request
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const schema = z.object({
      tenancyId: z.string().optional(),
      propertyId: z.string(),
      category: z.enum(VALID_CATEGORIES),
      description: z.string().min(1),
      photos: z.array(z.string().url()).optional(),
      priority: z.enum(VALID_PRIORITIES).default("MEDIUM"),
    });

    const data = schema.parse(req.body);

    const request = await prisma.maintenance_requests.create({
      data: {
        tenancyId: data.tenancyId,
        propertyId: data.propertyId,
        reportedBy: user.id,
        category: data.category,
        description: data.description,
        photos: data.photos ? JSON.stringify(data.photos) : null,
        priority: data.priority,
      },
    });

    res.status(201).json({ ...request, cost: request.cost ? Number(request.cost) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating maintenance request:", error);
    res.status(500).json({ message: "Failed to create maintenance request" });
  }
});

// PATCH /api/maintenance/:id — Update status, assign vendor, add notes
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum(VALID_STATUSES).optional(),
      assignedVendor: z.string().optional(),
      vendorNotes: z.string().optional(),
      priority: z.enum(VALID_PRIORITIES).optional(),
      cost: z.number().min(0).optional(),
    });

    const data = schema.parse(req.body);

    const updateData: any = { ...data };
    if (data.cost !== undefined) {
      updateData.cost = data.cost;
    }
    if (data.status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.maintenance_requests.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ ...updated, cost: updated.cost ? Number(updated.cost) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error updating maintenance request:", error);
    res.status(500).json({ message: "Failed to update maintenance request" });
  }
});

export default router;
