import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";
import { authenticateToken } from "../src/middleware/auth.middleware";
import { hasPermission, getVisibilityScope } from '../rbac-policy';
import { getErrorResponse } from '../i18n';
import { leadSchemas } from "../src/validators/leads.schema";

const router = express.Router();

// Helper: decode roles/org from Authorization header (simple-auth JWT)
// REPLACED by authenticateToken middleware in routes, but kept here if needed for legacy specific logic
// or we migrate routes to use req.user


const requireAnyPerm = (perms: string[]) => (req: any, res: any, next: any) => {
  // Assuming authenticateToken is run before this
  const user = req.user;
  if (!user) return res.status(401).json(getErrorResponse('UNAUTHORIZED', req.locale));

  if (perms.some(p => hasPermission(user.roles, p as any))) return next();
  return res.status(403).json(getErrorResponse('FORBIDDEN', req.locale));
};

router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const leads = await storage.getAllLeads();
    const scope = getVisibilityScope(user.roles);
    let filtered = leads;
    if (scope === 'corporate') {
      filtered = leads.filter((l: any) => l.agent?.organizationId && l.agent.organizationId === user.organizationId);
    } else if (scope === 'self') {
      filtered = leads.filter((l: any) => l.agentId === user.id);
    }
    res.json(filtered);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

router.get("/search", authenticateToken, async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json(getErrorResponse('MISSING_FIELDS', (req as any).locale));
    }
    const leads = await storage.searchLeads(query);
    res.json(leads);
  } catch (error) {
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const lead = await storage.getLead(req.params.id);
    if (!lead) {
      return res.status(404).json(getErrorResponse('LEAD_NOT_FOUND', (req as any).locale));
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

router.put("/:id", authenticateToken, requireAnyPerm(['requests:manage:all', 'requests:manage:corporate', 'requests:pool:pickup']), async (req, res) => {
  try {
    const validatedData = leadSchemas.update.parse(req.body);
    const lead = await storage.updateLead(req.params.id, validatedData);
    if (!lead) {
      return res.status(404).json(getErrorResponse('LEAD_NOT_FOUND', (req as any).locale));
    }
    res.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', (req as any).locale, error.errors));
    }
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

router.delete("/:id", authenticateToken, requireAnyPerm(['requests:manage:all', 'requests:manage:corporate', 'requests:pool:pickup']), async (req, res) => {
  try {
    await storage.deleteLead(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

export default router;
