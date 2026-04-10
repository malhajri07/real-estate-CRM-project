/**
 * routes/search.ts — Full-text and filtered search across listings, agencies, and agents.
 *
 * Mounted at `/api/search`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | /properties | No | Search listings with filter/sort params |
 * | GET | /agencies | No | Search agencies by name/location |
 * | GET | /agents | No | Search agents by name/specialty |
 * | GET | /saved | Yes | List authenticated user's saved searches |
 * | POST | /saved | Yes | Save a search query |
 * | DELETE | /saved/:id | Yes | Delete a saved search |
 *
 * Consumer: map search page, global search bar, saved searches page.
 */

import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = express.Router();

// Require real authenticated user — no fallback to fake IDs
function getUserId(req: any): string | null {
  return req?.user?.id || req?.session?.user?.id || null;
}

router.get("/saved", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const items = await storage.getSavedSearches(userId);
    res.json(items);
  } catch (err) {
    console.error("Error fetching saved searches:", err);
    res.status(500).json({ message: "Failed to fetch saved searches" });
  }
});

const SavedSearchSchema = z.object({
  alertName: z.string().min(1),
  propertyTypes: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  minPrice: z.union([z.number(), z.string()]).optional(),
  maxPrice: z.union([z.number(), z.string()]).optional(),
  minBedrooms: z.union([z.number(), z.string()]).optional(),
  maxBedrooms: z.union([z.number(), z.string()]).optional(),
  frequency: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.post("/saved", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const data = SavedSearchSchema.parse(req.body);
    const created = await storage.createSavedSearch({
      ...data,
      customerId: userId,
    } as any);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid saved search", errors: err.errors });
    }
    console.error("Error creating saved search:", err);
    res.status(500).json({ message: "Failed to create saved search" });
  }
});

router.delete("/saved/:id", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const ok = await storage.deleteSavedSearch(req.params.id, userId);
    if (!ok) return res.status(404).json({ message: "Saved search not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting saved search:", err);
    res.status(500).json({ message: "Failed to delete saved search" });
  }
});

// Simulate running saved search alerts (dev helper)
router.post("/run-alerts", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const alerts = await storage.getSavedSearches(userId);
    const all = await storage.getAllProperties();
    const results = alerts.map((a: any) => {
      let items = all.slice();
      if (a.cities && a.cities.length) items = items.filter((p) => a.cities.includes(p.city));
      if (a.propertyTypes && a.propertyTypes.length) items = items.filter((p: any) => a.propertyTypes.includes(p.propertyType || p.type));
      if (a.minPrice) items = items.filter((p) => Number(p.price || 0) >= Number(a.minPrice));
      if (a.maxPrice) items = items.filter((p) => Number(p.price || 0) <= Number(a.maxPrice));
      return { alertId: a.id, alertName: a.alertName, matches: items.length };
    });
    res.json({ alerts: results });
  } catch (err) {
    console.error("Error running saved search alerts:", err);
    res.status(500).json({ message: "Failed to run alerts" });
  }
});

export default router;
