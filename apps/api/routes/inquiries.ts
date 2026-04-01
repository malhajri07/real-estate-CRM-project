/**
 * routes/inquiries.ts - Inquiries API Routes
 *
 * Location: apps/api/ -> Routes/ -> inquiries.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 *
 * API routes for property inquiries. Handles:
 * - Creating property inquiries
 * - Retrieving user inquiries
 * - Updating inquiry status
 * - Deleting inquiries
 *
 * API Endpoints:
 * - GET /api/inquiries - Get user inquiries
 * - GET /api/inquiries/:id - Get single inquiry
 * - POST /api/inquiries - Create inquiry
 * - PUT /api/inquiries/:id - Update inquiry
 * - DELETE /api/inquiries/:id - Delete inquiry
 *
 * Related Files:
 * - apps/web/src/pages/property-detail.tsx - Property detail page with inquiry form
 */

import express from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { decodeAuth } from "../src/middleware/auth-helpers";

const router = express.Router();

const InquirySchema = z.object({
  propertyId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  inquiryType: z.string().optional(),
  message: z.string().optional(),
  preferredContactMethod: z.string().optional(),
  preferredContactTime: z.string().optional(),
  requestedViewingDate: z.preprocess((v) => (v ? new Date(String(v)) : null), z.date().nullable().optional()),
});

const InquiryUpdateSchema = z.object({
  status: z.string().optional(),
  message: z.string().optional(),
  agentId: z.string().optional(),
}).passthrough();

// GET /api/inquiries - List inquiries for the authenticated user
router.get("/", async (req, res) => {
  try {
    const auth = decodeAuth(req);
    if (!auth.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const orgId = auth.organizationId;

    // Build filter based on user scope
    const where: any = {};
    if (orgId) {
      where.organizationId = orgId;
    } else {
      where.agentId = auth.id;
    }

    const inquiries = await prisma.inquiries.findMany({
      where,
      include: {
        customer: true,
        property: { select: { id: true, title: true, address: true } },
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(inquiries);
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    res.status(500).json({ message: "Failed to fetch inquiries" });
  }
});

// GET /api/inquiries/:id - Get a single inquiry
router.get("/:id", async (req, res) => {
  try {
    const auth = decodeAuth(req);
    if (!auth.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const inquiry = await prisma.inquiries.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        property: { select: { id: true, title: true, address: true } },
        agent: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    // Org isolation check
    if (auth.organizationId && inquiry.organizationId !== auth.organizationId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(inquiry);
  } catch (err) {
    console.error("Error fetching inquiry:", err);
    res.status(500).json({ message: "Failed to fetch inquiry" });
  }
});

// POST /api/inquiries - Create a new inquiry
router.post("/", async (req, res) => {
  try {
    const data = InquirySchema.parse(req.body);
    const auth = decodeAuth(req);
    const userId = auth.id || null;
    const orgId = auth.organizationId;

    if (!orgId) {
      return res.status(400).json({ message: "Organization context required" });
    }

    // Need at minimum a customerId or enough info to identify the customer
    const customerId = data.customerId || req.body.customerId;
    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const rec = await prisma.inquiries.create({
      data: {
        organizationId: orgId,
        customerId,
        propertyId: data.propertyId || null,
        agentId: userId || null,
        message: data.message || null,
        preferredTime: data.requestedViewingDate || null,
        status: 'NEW',
        channel: 'WEBSITE',
      },
    });

    res.status(201).json(rec);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid inquiry", errors: err.errors });
    }
    console.error("Error creating inquiry:", err);
    res.status(500).json({ message: "Failed to create inquiry" });
  }
});

// PUT /api/inquiries/:id - Update an inquiry
router.put("/:id", async (req, res) => {
  try {
    const auth = decodeAuth(req);
    if (!auth.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const data = InquiryUpdateSchema.parse(req.body);

    // Verify the inquiry exists and belongs to the user's org
    const existing = await prisma.inquiries.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (auth.organizationId && existing.organizationId !== auth.organizationId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await prisma.inquiries.update({
      where: { id: req.params.id },
      data: {
        ...(data.status && { status: data.status as any }),
        ...(data.message !== undefined && { message: data.message }),
        ...(data.agentId && { agentId: data.agentId }),
        ...(data.status === 'RESPONDED' && { respondedAt: new Date() }),
      },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.errors });
    }
    console.error("Error updating inquiry:", err);
    res.status(500).json({ message: "Failed to update inquiry" });
  }
});

// DELETE /api/inquiries/:id - Delete an inquiry
router.delete("/:id", async (req, res) => {
  try {
    const auth = decodeAuth(req);
    if (!auth.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const existing = await prisma.inquiries.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (auth.organizationId && existing.organizationId !== auth.organizationId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.inquiries.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting inquiry:", err);
    res.status(500).json({ message: "Failed to delete inquiry" });
  }
});

export default router;
