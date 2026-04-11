/**
 * routes/lead-routing.ts — Lead auto-assignment engine.
 *
 * Mounted at `/api/org/lead-routing` in `apps/api/routes.ts`.
 *
 * CORP_OWNER configures how new leads are distributed to agents.
 * Strategies:
 * - `round_robin` — rotates among active org agents in creation order
 * - `territory` — matches lead city to agent territories (falls back to round-robin)
 * - `manual` — no auto-assignment, agent picks from their list
 * - `first_to_claim` — leads go to a pool, first agent to claim wins
 *
 * Also exports {@link applyLeadRouting} for use by `POST /api/leads` after
 * creating a new lead (see `routes/leads.ts`).
 *
 * Consumer: settings page "Lead Distribution" tab in
 *   `apps/web/src/pages/platform/settings/index.tsx`.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

// GET /api/org/lead-routing — Get routing config for the org
/**
 * List  with optional filters.
 *
 * @route   GET /api/lead-routing/
 * @auth    Required — any authenticated user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user.organizationId) return res.json({ strategy: "manual", enabled: false });

    const rule = await prisma.lead_routing_rules.findUnique({
      where: { organizationId: user.organizationId },
    });

    res.json(rule || { strategy: "manual", enabled: false, config: null });
  } catch (error) {
    console.error("Error fetching lead routing:", error);
    res.status(500).json({ message: "فشل تحميل إعدادات التوزيع" });
  }
});

// PUT /api/org/lead-routing — Update routing config (CORP_OWNER only)
/**
 * Update an existing  record.
 *
 * @route   PUT /api/lead-routing/
 * @auth    Required — any authenticated user
 */
router.put("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const roles: string[] = typeof user.roles === "string" ? JSON.parse(user.roles) : (user.roles || []);

    if (!roles.includes("CORP_OWNER") && !roles.includes("WEBSITE_ADMIN")) {
      return res.status(403).json({ message: "فقط مدير المنشأة يمكنه تعديل إعدادات التوزيع" });
    }

    if (!user.organizationId) {
      return res.status(400).json({ message: "لا توجد منشأة مرتبطة بحسابك" });
    }

    const schema = z.object({
      strategy: z.enum(["round_robin", "territory", "manual", "first_to_claim"]),
      enabled: z.boolean().default(true),
      config: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const rule = await prisma.lead_routing_rules.upsert({
      where: { organizationId: user.organizationId },
      create: {
        organizationId: user.organizationId,
        strategy: data.strategy,
        enabled: data.enabled,
        config: data.config,
      },
      update: {
        strategy: data.strategy,
        enabled: data.enabled,
        config: data.config,
      },
    });

    res.json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    }
    console.error("Error updating lead routing:", error);
    res.status(500).json({ message: "فشل تحديث إعدادات التوزيع" });
  }
});

/**
 * Auto-assign a newly created lead to an agent based on the org's routing rules.
 *
 * Called from `POST /api/leads` in `routes/leads.ts` after the lead row is created.
 * If the org has no routing rule, routing is disabled, or strategy is `manual`,
 * no assignment happens and the lead stays with the creating agent.
 *
 * @param lead - Minimal lead fields. Source: the just-created `leads` row.
 * @returns The assigned agent's ID, or `null` if no assignment was made.
 *   Consumer: `routes/leads.ts` ignores the return (fire-and-forget best-effort).
 *
 * @sideEffect Updates `leads.agentId` + `leads.assignedAt` on the new row.
 *   Advances `lead_routing_rules.lastAssignedIdx` for round-robin.
 */
export async function applyLeadRouting(
  lead: { id: string; organizationId?: string | null; city?: string | null },
): Promise<string | null> {
  if (!lead.organizationId) return null;

  const rule = await prisma.lead_routing_rules.findUnique({
    where: { organizationId: lead.organizationId },
  });

  if (!rule || !rule.enabled || rule.strategy === "manual") return null;

  // Get active agents in the org
  const agents = await prisma.users.findMany({
    where: {
      organizationId: lead.organizationId,
      isActive: true,
      roles: { not: { equals: '["CORP_OWNER"]' } }, // Exclude owners from rotation
    },
    include: {
      agent_profiles: { select: { territories: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (agents.length === 0) return null;

  let assignedAgentId: string | null = null;

  switch (rule.strategy) {
    case "round_robin": {
      const idx = rule.lastAssignedIdx % agents.length;
      assignedAgentId = agents[idx].id;
      // Advance the index
      await prisma.lead_routing_rules.update({
        where: { id: rule.id },
        data: { lastAssignedIdx: (rule.lastAssignedIdx + 1) % agents.length },
      });
      break;
    }

    case "territory": {
      if (lead.city) {
        const cityLower = lead.city.toLowerCase();
        const matched = agents.find((a) => {
          const territories = a.agent_profiles?.territories || "";
          return territories.toLowerCase().split(",").some((t) => t.trim() === cityLower || cityLower.includes(t.trim()));
        });
        if (matched) {
          assignedAgentId = matched.id;
        } else {
          // Fallback to round-robin if no territory match
          const idx = rule.lastAssignedIdx % agents.length;
          assignedAgentId = agents[idx].id;
          await prisma.lead_routing_rules.update({
            where: { id: rule.id },
            data: { lastAssignedIdx: (rule.lastAssignedIdx + 1) % agents.length },
          });
        }
      }
      break;
    }

    case "first_to_claim":
      // Don't assign — leave for agents to claim from pool
      return null;
  }

  if (assignedAgentId) {
    await prisma.leads.update({
      where: { id: lead.id },
      data: { agentId: assignedAgentId, assignedAt: new Date() },
    });
  }

  return assignedAgentId;
}

export default router;
