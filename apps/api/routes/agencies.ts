/**
 * routes/agencies.ts - Agency Management API Routes
 * 
 * Location: apps/api/ → Routes/ → agencies.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for managing agencies and their agents. Handles:
 * - Agency listing and retrieval
 * - Agency detail with agent and listing counts
 * - Agent listing by agency
 * 
 * API Endpoints:
 * - GET /api/agencies - List all agencies
 * - GET /api/agencies/:id - Get agency details
 * - GET /api/agencies/:id/agents - Get agency agents
 * 
 * Related Files:
 * - apps/web/src/pages/agencies.tsx - Agency listing page
 * - apps/web/src/pages/agency.tsx - Agency detail page
 */

// @ts-nocheck
import express from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const agencies = await storage.listAgencies();
    // Enrich with counts (agents, listings)
    const enriched = await Promise.all(
      agencies.map(async (a: any) => {
        const agents = await storage.listAgencyAgents(a.id);
        const listings = await storage.getAgencyListings(a.id);
        return {
          id: a.id,
          name: a.tradeName || a.legalName || a.id,
          verified: a.status === 'ACTIVE',
          agentsCount: agents.length,
          listingsCount: listings.length,
        };
      })
    );
    res.json(enriched);
  } catch (err) {
    console.error("Error listing agencies:", err);
    res.status(500).json({ message: "Failed to list agencies" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const agency = await storage.getAgency(req.params.id);
    if (!agency) return res.status(404).json({ message: "Agency not found" });
    const agents = await storage.listAgencyAgents(req.params.id);
    const listings = await storage.getAgencyListings(req.params.id);
    res.json({ agency, agents, listings });
  } catch (err) {
    console.error("Error getting agency:", err);
    res.status(500).json({ message: "Failed to get agency" });
  }
});

router.get("/agent/:id", async (req, res) => {
  try {
    // Reuse general user fetch via storage.getUser
    const agent = await storage.getUser(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    // Find agent listings by ownerId
    const all = await storage.getAllProperties();
    const listings = all.filter((p: any) => p.ownerId === req.params.id);
    res.json({ agent, listings });
  } catch (err) {
    console.error("Error getting agent:", err);
    res.status(500).json({ message: "Failed to get agent" });
  }
});

export default router;

