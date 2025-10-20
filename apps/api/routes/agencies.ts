import express, { Request, Response } from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

type AgencyRecord = {
  id: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isVerified?: boolean | null;
};

router.get("/", async (_req: Request, res: Response) => {
  try {
    const agencies = (await storage.listAgencies()) as AgencyRecord[];
    // Enrich with counts (agents, listings)
    const enriched = await Promise.all(
      agencies.map(async (agency) => {
        const agents = await storage.listAgencyAgents(agency.id);
        const listings = await storage.getAgencyListings(agency.id);
        return {
          id: agency.id,
          name:
            agency.companyName ||
            `${agency.firstName ?? ""} ${agency.lastName ?? ""}`.trim(),
          verified: Boolean(agency.isVerified),
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

router.get("/:id", async (req: Request, res: Response) => {
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

router.get("/agent/:id", async (req: Request, res: Response) => {
  try {
    // Reuse general user fetch via storage.getUser
    const agent = await storage.getUser(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    // Find agent listings by ownerId
    const all = await storage.getAllProperties();
    const listings = all.filter((property) => {
      const ownerId = (property as { ownerId?: string | null }).ownerId;
      return ownerId === req.params.id;
    });
    res.json({ agent, listings });
  } catch (err) {
    console.error("Error getting agent:", err);
    res.status(500).json({ message: "Failed to get agent" });
  }
});

export default router;

