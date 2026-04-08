/**
 * routes/vendors.ts — Vendor / Contractor Database (Session 5.7)
 *
 * CRUD for managing vendors/contractors per agent or organization.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

const VALID_SPECIALIZATIONS = [
  "plumbing", "electrical", "hvac", "cleaning", "painting", "general",
] as const;

// GET /api/vendors — List vendors
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { specialization, isActive } = req.query;

    const where: any = user.organizationId
      ? { organizationId: user.organizationId }
      : { agentId: user.id };

    if (specialization && typeof specialization === "string") {
      where.specialization = specialization;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const vendors = await prisma.vendors.findMany({
      where,
      orderBy: { name: "asc" },
      take: 200,
    });

    res.json(
      vendors.map((v: any) => ({
        ...v,
        rating: v.rating ? Number(v.rating) : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to load vendors" });
  }
});

// POST /api/vendors — Create vendor
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const schema = z.object({
      name: z.string().min(1),
      phone: z.string().min(1),
      email: z.string().email().optional(),
      specialization: z.enum(VALID_SPECIALIZATIONS),
      city: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const vendor = await prisma.vendors.create({
      data: {
        ...data,
        agentId: user.id,
        organizationId: user.organizationId || undefined,
      },
    });

    res.status(201).json({ ...vendor, rating: vendor.rating ? Number(vendor.rating) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error creating vendor:", error);
    res.status(500).json({ message: "Failed to create vendor" });
  }
});

// PATCH /api/vendors/:id — Update vendor
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const schema = z.object({
      name: z.string().min(1).optional(),
      phone: z.string().min(1).optional(),
      email: z.string().email().nullable().optional(),
      specialization: z.enum(VALID_SPECIALIZATIONS).optional(),
      city: z.string().nullable().optional(),
      rating: z.number().min(1).max(5).nullable().optional(),
      isActive: z.boolean().optional(),
      notes: z.string().nullable().optional(),
    });

    const data = schema.parse(req.body);

    // Ensure vendor belongs to user/org
    const existing = await prisma.vendors.findFirst({
      where: {
        id: req.params.id,
        ...(user.organizationId
          ? { organizationId: user.organizationId }
          : { agentId: user.id }),
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const updated = await prisma.vendors.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ ...updated, rating: updated.rating ? Number(updated.rating) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Error updating vendor:", error);
    res.status(500).json({ message: "Failed to update vendor" });
  }
});

// DELETE /api/vendors/:id — Delete vendor
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // Ensure vendor belongs to user/org
    const existing = await prisma.vendors.findFirst({
      where: {
        id: req.params.id,
        ...(user.organizationId
          ? { organizationId: user.organizationId }
          : { agentId: user.id }),
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    await prisma.vendors.delete({ where: { id: req.params.id } });

    res.json({ message: "Vendor deleted" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ message: "Failed to delete vendor" });
  }
});

export default router;
