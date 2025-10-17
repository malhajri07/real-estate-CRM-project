import express from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { storage } from "../storage-prisma";

const router = express.Router();

const CreateMarketingRequestSchema = z.object({
  title: z.string().trim().min(3),
  summary: z.string().trim().min(10),
  requirements: z.string().trim().min(10).optional(),
  propertyType: z.string().trim().min(1),
  listingType: z.string().trim().min(1).optional(),
  city: z.string().trim().min(2),
  district: z.string().trim().optional(),
  region: z.string().trim().optional(),
  budgetMin: z.coerce.number().nonnegative().optional(),
  budgetMax: z.coerce.number().nonnegative().optional(),
  preferredStartDate: z.coerce.date().optional(),
  preferredEndDate: z.coerce.date().optional(),
  commissionExpectation: z.coerce.number().nonnegative().optional(),
  seriousnessTier: z.enum(["STANDARD", "SERIOUS", "ENTERPRISE"]).default("STANDARD"),
  contactName: z.string().trim().min(3),
  contactPhone: z.string().trim().min(6).optional(),
  contactEmail: z.string().trim().email().optional(),
  propertyId: z.string().trim().optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "OPEN", "AWARDED", "CLOSED", "REJECTED"]),
  moderationNotes: z.string().trim().optional(),
});

const CreateProposalSchema = z.object({
  message: z.string().trim().min(10).optional(),
  commissionRate: z.coerce.number().nonnegative().optional(),
  marketingBudget: z.coerce.number().nonnegative().optional(),
  estimatedTimeline: z.string().trim().min(3).optional(),
  attachments: z.string().optional(),
});

const UpdateProposalSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "WITHDRAWN", "EXPIRED"]),
});

function getUserId(req: express.Request): string | undefined {
  return (req as any).user?.id || (req as any).session?.user?.id || undefined;
}

function getUserRoles(req: express.Request): string[] {
  const rawRoles = (req as any).user?.roles || (req as any).session?.user?.roles;
  if (!rawRoles) return [];
  if (Array.isArray(rawRoles)) return rawRoles;
  try {
    const parsed = JSON.parse(rawRoles);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isAdminOrModerator(req: express.Request): boolean {
  const roles = getUserRoles(req).map((r) => String(r).toUpperCase());
  return roles.includes("ADMIN") || roles.includes("SUPER_ADMIN") || roles.includes("MODERATOR") || roles.includes("CMS_ADMIN");
}

router.post("/", async (req, res) => {
  try {
    const ownerId = getUserId(req);
    if (!ownerId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const data = CreateMarketingRequestSchema.parse(req.body);
    if (data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax) {
      return res.status(400).json({ message: "Minimum budget cannot exceed maximum budget" });
    }

    const request = await storage.createMarketingRequest({
      ...data,
      ownerId,
      status: "PENDING_REVIEW",
    });

    res.status(201).json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", errors: error.errors });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return res.status(400).json({ message: "Invalid related identifiers" });
    }
    console.error("Error creating marketing request:", error);
    res.status(500).json({ message: "Failed to create marketing request" });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      status,
      city,
      seriousnessTier,
      includeOwner,
      includeProposals,
      mine,
      scope,
      search,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = {
      status,
      city,
      seriousnessTier,
      includeOwner: includeOwner === "1" || includeOwner === "true",
      includeProposals: includeProposals === "1" || includeProposals === "true",
      search,
    };

    if (mine === "owner" && userId) {
      filters.ownerId = userId;
    }
    if ((scope === "agent" || mine === "agent") && userId) {
      filters.forAgentId = userId;
      filters.includeProposals = true;
    }

    const requests = await storage.listMarketingRequests(filters);
    res.json(requests);
  } catch (error) {
    console.error("Error listing marketing requests:", error);
    res.status(500).json({ message: "Failed to list marketing requests" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const includeOwner = req.query.includeOwner === "1" || req.query.includeOwner === "true";
    const includeProposals = req.query.includeProposals === "1" || req.query.includeProposals === "true";
    const request = await storage.getMarketingRequest(req.params.id, {
      includeOwner,
      includeProposals,
    });
    if (!request) {
      return res.status(404).json({ message: "Marketing request not found" });
    }
    res.json(request);
  } catch (error) {
    console.error("Error retrieving marketing request:", error);
    res.status(500).json({ message: "Failed to fetch marketing request" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const actorId = getUserId(req);
    if (!actorId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const payload = UpdateStatusSchema.parse(req.body ?? {});
    const existing = await storage.getMarketingRequest(req.params.id, { includeOwner: true });
    if (!existing) {
      return res.status(404).json({ message: "Marketing request not found" });
    }
    const isOwner = existing.ownerId === actorId;
    if (!isOwner && !isAdminOrModerator(req)) {
      return res.status(403).json({ message: "Not authorized to update status" });
    }

    const update: any = {
      status: payload.status,
      moderationNotes: payload.moderationNotes ?? existing.moderationNotes,
      approvedAt: payload.status === "OPEN" && !existing.approvedAt ? new Date() : existing.approvedAt,
      closedAt: payload.status === "CLOSED" ? new Date() : existing.closedAt,
    };

    const updated = await storage.updateMarketingRequest(req.params.id, update);
    if (!updated) {
      return res.status(500).json({ message: "Failed to update marketing request" });
    }
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid status payload", errors: error.errors });
    }
    console.error("Error updating marketing request status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

router.post("/:id/proposals", async (req, res) => {
  try {
    const agentId = getUserId(req);
    if (!agentId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const request = await storage.getMarketingRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Marketing request not found" });
    }
    if (request.status !== "OPEN" && request.status !== "PENDING_REVIEW") {
      return res.status(400).json({ message: "Cannot submit proposal for this request status" });
    }

    const data = CreateProposalSchema.parse(req.body ?? {});

    const existingProposal = await storage.findMarketingProposalForAgent(req.params.id, agentId);
    if (existingProposal && existingProposal.status === "PENDING") {
      return res.status(409).json({ message: "You already have a pending proposal for this request" });
    }

    const proposal = await storage.createMarketingProposal({
      ...data,
      requestId: req.params.id,
      agentId,
      status: "PENDING",
    });

    res.status(201).json(proposal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid proposal payload", errors: error.errors });
    }
    console.error("Error creating marketing proposal:", error);
    res.status(500).json({ message: "Failed to create proposal" });
  }
});

router.get("/:id/proposals", async (req, res) => {
  try {
    const request = await storage.getMarketingRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Marketing request not found" });
    }
    const proposals = await storage.listMarketingProposalsByRequest(req.params.id);
    res.json(proposals);
  } catch (error) {
    console.error("Error listing marketing proposals:", error);
    res.status(500).json({ message: "Failed to list proposals" });
  }
});

router.patch("/:id/proposals/:proposalId", async (req, res) => {
  try {
    const actorId = getUserId(req);
    if (!actorId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const payload = UpdateProposalSchema.parse(req.body ?? {});
    const request = await storage.getMarketingRequest(req.params.id, { includeProposals: true });
    if (!request) {
      return res.status(404).json({ message: "Marketing request not found" });
    }

    const proposal = request.proposals?.find((p: any) => p.id === req.params.proposalId);
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const isOwner = request.ownerId === actorId;
    const isAgent = proposal.agentId === actorId;
    if (!isOwner && !isAgent && !isAdminOrModerator(req)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedProposal = await storage.updateMarketingProposal(req.params.proposalId, {
      status: payload.status,
      decidedAt: new Date(),
    });

    if (!updatedProposal) {
      return res.status(500).json({ message: "Failed to update proposal" });
    }

    if (payload.status === "ACCEPTED") {
      await storage.updateMarketingRequest(req.params.id, {
        status: "AWARDED",
        awardedProposalId: updatedProposal.id,
        closedAt: null,
      });
    }

    if (payload.status === "WITHDRAWN" || payload.status === "DECLINED") {
      const current = await storage.getMarketingRequest(req.params.id);
      if (current?.awardedProposalId === updatedProposal.id) {
        await storage.updateMarketingRequest(req.params.id, {
          awardedProposalId: null,
          status: "OPEN",
        });
      }
    }

    res.json(updatedProposal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid proposal update", errors: error.errors });
    }
    console.error("Error updating marketing proposal:", error);
    res.status(500).json({ message: "Failed to update proposal" });
  }
});

export default router;
