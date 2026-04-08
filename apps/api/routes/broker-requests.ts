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
import { requireFalLicense } from "../src/middleware/fal-license.middleware";
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

router.post("/", authenticateToken, requireFalLicense, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = createSchema.parse(req.body);

    // Validate commission against Saudi regulatory cap (2.5%) — Article 14
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

// ── POST /api/broker-requests/:id/acceptances/:acceptId/generate-agreement ──

router.post("/:id/acceptances/:acceptId/generate-agreement", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id, acceptId } = req.params;

    const brokerRequest = await prisma.broker_requests.findUnique({
      where: { id },
      include: {
        listingAgent: { select: { id: true, firstName: true, lastName: true, organizationId: true, agent_profiles: { select: { falLicenseNumber: true, falLicenseType: true, licenseNo: true } } } },
        organization: { select: { tradeName: true } },
        property: { select: { title: true, city: true, district: true, type: true, deedNumber: true, price: true } },
      },
    });
    if (!brokerRequest) return res.status(404).json({ message: "الطلب غير موجود" });
    if (brokerRequest.listingAgentId !== user.id) return res.status(403).json({ message: "فقط صاحب الطلب يمكنه إنشاء العقد" });

    const acceptance = await prisma.broker_acceptances.findUnique({
      where: { id: acceptId },
      include: {
        marketingAgent: { select: { id: true, firstName: true, lastName: true, organizationId: true, agent_profiles: { select: { falLicenseNumber: true, falLicenseType: true, licenseNo: true } } } },
      },
    });
    if (!acceptance) return res.status(404).json({ message: "طلب التعاون غير موجود" });
    if (acceptance.status !== "APPROVED") return res.status(400).json({ message: "يجب الموافقة على الطلب أولاً" });

    // Generate agreement number
    const count = await prisma.broker_acceptances.count({ where: { agreementNumber: { not: null } } });
    const year = new Date().getFullYear();
    const agreementNumber = `CBA-${year}-${String(count + 1).padStart(5, "0")}`;

    const listingAgentProfile = brokerRequest.listingAgent.agent_profiles;
    const marketingAgentProfile = acceptance.marketingAgent.agent_profiles;

    const agreementTerms = JSON.stringify({
      property: {
        title: brokerRequest.property?.title || brokerRequest.title,
        type: brokerRequest.propertyType || brokerRequest.property?.type,
        city: brokerRequest.city || brokerRequest.property?.city,
        district: brokerRequest.district || brokerRequest.property?.district,
        deedNumber: brokerRequest.property?.deedNumber || null,
        price: brokerRequest.price ? Number(brokerRequest.price) : null,
      },
      listingAgent: {
        name: `${brokerRequest.listingAgent.firstName} ${brokerRequest.listingAgent.lastName}`,
        falNumber: listingAgentProfile?.falLicenseNumber || listingAgentProfile?.licenseNo || null,
        falType: listingAgentProfile?.falLicenseType || null,
        organization: brokerRequest.organization?.tradeName || null,
      },
      marketingAgent: {
        name: `${acceptance.marketingAgent.firstName} ${acceptance.marketingAgent.lastName}`,
        falNumber: marketingAgentProfile?.falLicenseNumber || marketingAgentProfile?.licenseNo || null,
        falType: marketingAgentProfile?.falLicenseType || null,
        organization: null,
      },
      commission: {
        totalRate: Number(brokerRequest.commissionRate),
        type: brokerRequest.commissionType,
        fixedAmount: brokerRequest.fixedCommission ? Number(brokerRequest.fixedCommission) : null,
        agreedRate: acceptance.agreedRate ? Number(acceptance.agreedRate) : Number(brokerRequest.commissionRate),
        listingAgentShare: Number(brokerRequest.commissionRate) / 2,
        marketingAgentShare: (acceptance.agreedRate ? Number(acceptance.agreedRate) : Number(brokerRequest.commissionRate)) / 2,
      },
      duration: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        daysValid: 90,
      },
    });

    const updated = await prisma.broker_acceptances.update({
      where: { id: acceptId },
      data: {
        agreementStatus: "PENDING_SIGNATURES",
        agreementNumber,
        agreementTerms,
        agreementGeneratedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error generating agreement:", error);
    res.status(500).json({ message: "فشل إنشاء العقد" });
  }
});

// ── PATCH /api/broker-requests/:id/acceptances/:acceptId/sign ───────────────

router.patch("/:id/acceptances/:acceptId/sign", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id, acceptId } = req.params;

    const acceptance = await prisma.broker_acceptances.findUnique({ where: { id: acceptId } });
    if (!acceptance) return res.status(404).json({ message: "غير موجود" });
    if (acceptance.agreementStatus !== "PENDING_SIGNATURES") return res.status(400).json({ message: "العقد ليس بانتظار التوقيع" });

    const brokerRequest = await prisma.broker_requests.findUnique({ where: { id } });
    if (!brokerRequest) return res.status(404).json({ message: "الطلب غير موجود" });

    const isListingAgent = brokerRequest.listingAgentId === user.id;
    const isMarketingAgent = acceptance.marketingAgentId === user.id;
    if (!isListingAgent && !isMarketingAgent) return res.status(403).json({ message: "ليس لديك صلاحية التوقيع" });

    const updateData: any = {};
    if (isListingAgent && !acceptance.listingAgentSignedAt) {
      updateData.listingAgentSignedAt = new Date();
    }
    if (isMarketingAgent && !acceptance.marketingAgentSignedAt) {
      updateData.marketingAgentSignedAt = new Date();
    }

    // Check if both signed after this update
    const willListingSigned = updateData.listingAgentSignedAt || acceptance.listingAgentSignedAt;
    const willMarketingSigned = updateData.marketingAgentSignedAt || acceptance.marketingAgentSignedAt;
    if (willListingSigned && willMarketingSigned) {
      updateData.agreementStatus = "SIGNED";
    }

    const updated = await prisma.broker_acceptances.update({
      where: { id: acceptId },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    console.error("Error signing agreement:", error);
    res.status(500).json({ message: "فشل التوقيع" });
  }
});

// ── GET /api/broker-requests/:id/acceptances/:acceptId/agreement ────────────

router.get("/:id/acceptances/:acceptId/agreement", authenticateToken, async (req, res) => {
  try {
    const { acceptId } = req.params;

    const acceptance = await prisma.broker_acceptances.findUnique({
      where: { id: acceptId },
      include: {
        marketingAgent: {
          select: { id: true, firstName: true, lastName: true, phone: true, agent_profiles: { select: { falLicenseNumber: true, falLicenseType: true, licenseNo: true } } },
        },
        brokerRequest: {
          include: {
            listingAgent: {
              select: { id: true, firstName: true, lastName: true, phone: true, agent_profiles: { select: { falLicenseNumber: true, falLicenseType: true, licenseNo: true } } },
            },
            organization: { select: { tradeName: true } },
            property: { select: { title: true, city: true, district: true, type: true, deedNumber: true, price: true } },
          },
        },
      },
    });

    if (!acceptance) return res.status(404).json({ message: "غير موجود" });

    res.json(acceptance);
  } catch (error) {
    console.error("Error fetching agreement:", error);
    res.status(500).json({ message: "فشل تحميل العقد" });
  }
});

export default router;
