/**
 * routes/broker-requests.ts — Agent collaboration marketplace
 *
 * Agents post their listings for co-marketing. Other agents accept and
 * market the property in exchange for an agreed commission split.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";
import { validateCommissionCap, COMMISSION_CAP_PERCENTAGE } from "../src/validators/saudi-regulation.validators";

const router = Router();

// ── Schemas ────────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  propertyId: z.string().optional(),
  listingId: z.string().optional(),
  propertyType: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  price: z.number().positive().optional(),
  commissionRate: z.number().min(0.5).max(50),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  fixedCommission: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

const acceptSchema = z.object({
  notes: z.string().max(1000).optional(),
  agreedRate: z.number().min(0.5).max(50).optional(),
});

// ── GET /api/broker-requests — List all open + own requests ────────────────

router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const orgId = user.organizationId;

    const requests = await prisma.broker_requests.findMany({
      where: {
        OR: [
          { status: "OPEN" },
          { listingAgentId: user.id },
          ...(orgId ? [{ organizationId: orgId }] : []),
        ],
      },
      include: {
        listingAgent: { select: { id: true, firstName: true, lastName: true, organizationId: true } },
        organization: { select: { id: true, tradeName: true } },
        property: { select: { id: true, title: true, city: true, district: true, price: true, type: true, photos: true } },
        acceptances: {
          include: {
            marketingAgent: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching broker requests:", error);
    res.status(500).json({ message: "Failed to fetch broker requests" });
  }
});

// ── POST /api/broker-requests — Create a new broker request ────────────────

router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = createSchema.parse(req.body);

    // Validate commission against Saudi regulatory cap (2.5%)
    const capCheck = validateCommissionCap(data.commissionRate);
    const commissionCapValidated = capCheck.valid;

    const request = await prisma.broker_requests.create({
      data: {
        listingAgentId: user.id,
        organizationId: user.organizationId || undefined,
        propertyId: data.propertyId || undefined,
        listingId: data.listingId || undefined,
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        city: data.city,
        district: data.district,
        price: data.price,
        commissionRate: data.commissionRate,
        commissionType: data.commissionType,
        fixedCommission: data.fixedCommission,
        commissionCapValidated,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
      include: {
        listingAgent: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, title: true, city: true } },
        acceptances: true,
      },
    });

    res.status(201).json(request);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
    console.error("Error creating broker request:", error);
    res.status(500).json({ message: "Failed to create broker request" });
  }
});

// ── POST /api/broker-requests/:id/accept — Accept a broker request ─────────

router.post("/:id/accept", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const data = acceptSchema.parse(req.body || {});

    const brokerRequest = await prisma.broker_requests.findUnique({ where: { id } });
    if (!brokerRequest) return res.status(404).json({ message: "Broker request not found" });
    if (brokerRequest.status !== "OPEN") return res.status(400).json({ message: "Request is no longer open" });
    if (brokerRequest.listingAgentId === user.id) return res.status(400).json({ message: "Cannot accept your own request" });

    // Check if already accepted
    const existing = await prisma.broker_acceptances.findUnique({
      where: { brokerRequestId_marketingAgentId: { brokerRequestId: id, marketingAgentId: user.id } },
    });
    if (existing) return res.status(400).json({ message: "Already applied to this request" });

    const acceptance = await prisma.broker_acceptances.create({
      data: {
        brokerRequestId: id,
        marketingAgentId: user.id,
        organizationId: user.organizationId || undefined,
        notes: data.notes,
        agreedRate: data.agreedRate ?? brokerRequest.commissionRate,
        status: "PENDING",
      },
      include: {
        marketingAgent: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.status(201).json(acceptance);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
    console.error("Error accepting broker request:", error);
    res.status(500).json({ message: "Failed to accept" });
  }
});

// ── PATCH /api/broker-requests/:id/acceptances/:acceptId — Approve/reject ──

router.patch("/:id/acceptances/:acceptId", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id, acceptId } = req.params;
    const { status } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Status must be APPROVED or REJECTED" });
    }

    const brokerRequest = await prisma.broker_requests.findUnique({ where: { id } });
    if (!brokerRequest) return res.status(404).json({ message: "Request not found" });
    if (brokerRequest.listingAgentId !== user.id) return res.status(403).json({ message: "Only the listing agent can approve/reject" });

    const acceptance = await prisma.broker_acceptances.update({
      where: { id: acceptId },
      data: { status },
      include: { marketingAgent: { select: { id: true, firstName: true, lastName: true } } },
    });

    // If approved, mark the request as ACCEPTED
    if (status === "APPROVED") {
      await prisma.broker_requests.update({
        where: { id },
        data: { status: "ACCEPTED" },
      });
    }

    res.json(acceptance);
  } catch (error) {
    console.error("Error updating acceptance:", error);
    res.status(500).json({ message: "Failed to update" });
  }
});

// ── PATCH /api/broker-requests/:id — Update status (cancel, complete) ──────

router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { status } = req.body;

    if (!["CANCELLED", "COMPLETED", "OPEN"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const brokerRequest = await prisma.broker_requests.findUnique({ where: { id } });
    if (!brokerRequest) return res.status(404).json({ message: "Not found" });
    if (brokerRequest.listingAgentId !== user.id) return res.status(403).json({ message: "Only the listing agent can update" });

    const updated = await prisma.broker_requests.update({
      where: { id },
      data: { status: status as any },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating broker request:", error);
    res.status(500).json({ message: "Failed to update" });
  }
});

export default router;
