import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";
import { authenticateToken } from "../src/middleware/auth.middleware";
import { hasPermission, getVisibilityScope } from '../rbac-policy';
import { getErrorResponse } from '../i18n';
import { leadSchemas } from "../src/validators/leads.schema";

const router = express.Router();

// Flatten a lead record by merging customer fields into the top-level response.
// The frontend Lead type expects firstName, lastName, email, phone, city, etc. at the top level,
// but in the DB these live on the related `customers` record.
function flattenLeadWithCustomer(lead: any): any {
  if (!lead) return lead;
  const { customer, ...rest } = lead;
  return {
    ...rest,
    firstName: customer?.firstName ?? '',
    lastName: customer?.lastName ?? '',
    email: customer?.email ?? null,
    phone: customer?.phone ?? null,
    city: customer?.city ?? null,
    leadSource: lead.source ?? null,
  };
}

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
    const orgFilter = (req as any).orgFilter || {};
    const scope = getVisibilityScope(user.roles);

    // Use org filter from middleware for proper DB-level isolation
    let where: any = {};
    if (scope === 'global') {
      where = {}; // Admin sees all
    } else if (scope === 'corporate' && user.organizationId) {
      where = { organizationId: user.organizationId };
    } else if (scope === 'self') {
      where = { agentId: user.id };
    } else if (orgFilter.organizationId) {
      where = orgFilter;
    } else if (orgFilter.userId) {
      where = { agentId: orgFilter.userId };
    }

    const { prisma } = await import('../prismaClient');
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 100, 200);

    const [leads, total] = await Promise.all([
      prisma.leads.findMany({
        where,
        include: {
          users: { select: { id: true, firstName: true, lastName: true } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, city: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.leads.count({ where }),
    ]);

    res.json(leads.map(flattenLeadWithCustomer));
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const validated = leadSchemas.create.parse(req.body);

    // Separate customer fields from lead fields
    const {
      firstName, lastName, email, phone,
      city, interestType, budgetRange, leadSource,
      status, notes, source, priority,
      customerId: existingCustomerId,
      buyerRequestId, sellerSubmissionId,
      ...rest
    } = validated as any;

    let organizationId = user.organizationId;

    // Individual agents without an org: auto-create a personal organization
    if (!organizationId) {
      const { prisma } = await import('../prismaClient');
      const personalOrgId = `personal-${user.id}`;
      let personalOrg = await prisma.organizations.findUnique({ where: { id: personalOrgId } });
      if (!personalOrg) {
        const agentName = `${user.firstName || 'Agent'} ${user.lastName || ''}`.trim();
        personalOrg = await prisma.organizations.create({
          data: {
            id: personalOrgId,
            legalName: agentName,
            tradeName: agentName,
            licenseNo: `INDIV-${user.id.substring(0, 8)}`,
            status: 'ACTIVE',
          },
        });
      }
      organizationId = personalOrg.id;
      await prisma.users.update({ where: { id: user.id }, data: { organizationId } });
    }

    // Step 1: Create or find a customer record
    let customerId = existingCustomerId;
    if (!customerId && (firstName || lastName || email || phone)) {
      const existing = await storage.findCustomerByEmailOrPhone(email, phone, organizationId);
      if (existing) {
        customerId = existing.id;
        const customerUpdate: Record<string, unknown> = {};
        if (firstName) customerUpdate.firstName = firstName;
        if (lastName) customerUpdate.lastName = lastName;
        if (email) customerUpdate.email = email;
        if (phone) customerUpdate.phone = phone;
        if (city) customerUpdate.city = city;
        if (Object.keys(customerUpdate).length > 0) {
          await storage.updateCustomer(customerId, customerUpdate);
        }
      } else {
        const customer = await storage.createCustomer({
          firstName: firstName || '',
          lastName: lastName || '',
          email: email || undefined,
          phone: phone || '',
          city: city || undefined,
          source: source || leadSource || undefined,
          notes: notes || undefined,
          organizationId,
        });
        customerId = customer.id;
      }
    }

    // Step 2: Create the lead record linking to the customer
    const leadData: Record<string, unknown> = {
      agentId: user.id,
      ...(organizationId && { organizationId }),
      ...(customerId && { customerId }),
      ...(status && { status: status.toUpperCase() }),
      ...(notes && { notes }),
      ...(source || leadSource ? { source: source || leadSource } : {}),
      ...(priority != null && { priority: Number(priority) }),
      ...(buyerRequestId && { buyerRequestId }),
      ...(sellerSubmissionId && { sellerSubmissionId }),
    };
    const lead = await storage.createLead(leadData);

    // Step 3: Apply lead routing (auto-assign to agent if org has routing rules)
    try {
      const { applyLeadRouting } = await import("./lead-routing");
      await applyLeadRouting({ id: lead.id, organizationId: organizationId || null, city: city || null });
    } catch {
      // Routing is best-effort — don't fail lead creation
    }

    // Step 4: Return lead with customer info flattened
    const fullLead = await storage.getLead(lead.id);
    res.status(201).json(flattenLeadWithCustomer(fullLead));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', (req as any).locale, error.errors));
    }
    console.error("Error creating lead:", error);
    res.status(500).json(getErrorResponse('CREATE_FAILED', (req as any).locale));
  }
});

router.get("/search", authenticateToken, async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json(getErrorResponse('MISSING_FIELDS', (req as any).locale));
    }
    const leads = await storage.searchLeads(query);
    res.json(leads.map(flattenLeadWithCustomer));
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
    res.json(flattenLeadWithCustomer(lead));
  } catch (error) {
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

router.put("/:id", authenticateToken, requireAnyPerm(['requests:manage:all', 'requests:manage:corporate', 'requests:pool:pickup']), async (req, res) => {
  try {
    const validatedData = leadSchemas.update.parse(req.body);

    // Separate customer fields from lead fields
    const {
      firstName, lastName, email, phone,
      city, interestType, budgetRange, leadSource,
      status, notes, source, priority,
      ...rest
    } = validatedData as any;

    // Fetch existing lead to get customerId
    const existingLead = await storage.getLead(req.params.id);
    if (!existingLead) {
      return res.status(404).json(getErrorResponse('LEAD_NOT_FOUND', (req as any).locale));
    }

    // Update customer record if the lead has one
    if (existingLead.customerId) {
      const customerUpdate: Record<string, unknown> = {};
      if (firstName !== undefined) customerUpdate.firstName = firstName;
      if (lastName !== undefined) customerUpdate.lastName = lastName;
      if (email !== undefined) customerUpdate.email = email;
      if (phone !== undefined) customerUpdate.phone = phone;
      if (city !== undefined) customerUpdate.city = city;
      if (Object.keys(customerUpdate).length > 0) {
        await storage.updateCustomer(existingLead.customerId, customerUpdate);
      }
    }

    // Update lead-only fields
    const leadUpdate: Record<string, unknown> = {};
    if (status !== undefined) leadUpdate.status = status.toUpperCase();
    if (notes !== undefined) leadUpdate.notes = notes;
    if (source !== undefined || leadSource !== undefined) leadUpdate.source = source || leadSource;
    if (priority !== undefined) leadUpdate.priority = Number(priority);

    let updatedLead;
    if (Object.keys(leadUpdate).length > 0) {
      updatedLead = await storage.updateLead(req.params.id, leadUpdate);
    } else {
      updatedLead = await storage.getLead(req.params.id);
    }

    res.json(flattenLeadWithCustomer(updatedLead));
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
