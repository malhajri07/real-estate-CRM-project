/**
 * routes/agencies.ts — Agency directory and detail API.
 *
 * Mounted at `/api/agencies`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | / | No | List all agencies (paginated) |
 * | GET | /:id | No | Agency detail with agent/listing counts |
 * | GET | /:id/agents | No | List agents belonging to an agency |
 *
 * Consumer: platform agencies page (`/agencies`), agency detail page (`/agencies/:id`).
 */

import express from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const enriched = await storage.listAgenciesWithCounts();
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

