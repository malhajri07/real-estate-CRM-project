import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";
import jwt from 'jsonwebtoken';
import { hasPermission, getVisibilityScope } from '../rbac-policy';
import { JWT_SECRET as getJwtSecret } from "../config/env";

const router = express.Router();

const insertLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.union([z.string().email(), z.literal("")]).optional().transform((value) => (value ? value : undefined)),
  phone: z.string().min(1).optional(),
  status: z.string().optional(),
  leadSource: z.string().optional(),
  interestType: z.string().optional(),
  city: z.string().optional(),
  budgetRange: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional(),
}).passthrough();

// Helper: decode roles/org from Authorization header (simple-auth JWT)
function decodeAuth(req: any): { id?: string; roles: string[]; organizationId?: string } {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return { roles: [] };
    const decoded: any = jwt.verify(token, getJwtSecret());
    let roles: string[] = [];
    try { roles = JSON.parse(decoded.roles || '[]'); } catch { if (decoded.roles) roles = [decoded.roles]; }
    return { id: decoded.userId, roles, organizationId: decoded.organizationId };
  } catch { return { roles: [] }; }
}

const requireAnyPerm = (perms: string[]) => (req: any, res: any, next: any) => {
  const auth = decodeAuth(req);
  if (perms.some(p => hasPermission(auth.roles, p as any))) return next();
  return res.status(403).json({ message: 'Forbidden' });
};

router.get("/", async (req, res) => {
  try {
    const auth = decodeAuth(req);
    const leads = await storage.getAllLeads();
    const scope = getVisibilityScope(auth.roles);
    let filtered = leads;
    if (scope === 'corporate') {
      filtered = leads.filter((l: any) => l.agent?.organizationId && l.agent.organizationId === auth.organizationId);
    } else if (scope === 'self') {
      filtered = leads.filter((l: any) => l.agentId === auth.id);
    }
    res.json(filtered);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Failed to fetch leads" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    const leads = await storage.searchLeads(query);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: "Failed to search leads" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const lead = await storage.getLead(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch lead" });
  }
});

router.post("/", requireAnyPerm(['requests:manage:all', 'requests:manage:corporate', 'requests:pool:pickup']), async (req, res) => {
  try {
    const validatedData = insertLeadSchema.parse(req.body);
    const auth = decodeAuth(req);
    if (!auth.id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    // const tenantId = auth.organizationId ?? "default-tenant"; // unused
    const lead = await storage.createLead(validatedData);
    res.status(201).json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    const message = error instanceof Error ? error.message : "Failed to create lead";
    res.status(500).json({ message });
  }
});

router.put("/:id", requireAnyPerm(['requests:manage:all', 'requests:manage:corporate', 'requests:pool:pickup']), async (req, res) => {
  try {
    const validatedData = insertLeadSchema.partial().parse(req.body);
    const lead = await storage.updateLead(req.params.id, validatedData);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update lead" });
  }
});

router.delete("/:id", requireAnyPerm(['requests:manage:all', 'requests:manage:corporate', 'requests:pool:pickup']), async (req, res) => {
  try {
    await storage.deleteLead(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete lead" });
  }
});

export default router;
