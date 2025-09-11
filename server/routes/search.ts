import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";

const router = express.Router();

function getUserId(req: any) {
  return req?.user?.id || "sample-user-1";
}

router.get("/saved", async (req, res) => {
  try {
    const userId = getUserId(req);
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

router.post("/saved", async (req, res) => {
  try {
    const userId = getUserId(req);
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

router.delete("/saved/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const ok = await storage.deleteSavedSearch(req.params.id, userId);
    if (!ok) return res.status(404).json({ message: "Saved search not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting saved search:", err);
    res.status(500).json({ message: "Failed to delete saved search" });
  }
});

export default router;

// Simulate running saved search alerts (dev helper)
router.post("/run-alerts", async (req, res) => {
  try {
    const userId = getUserId(req);
    const alerts = await storage.getSavedSearches(userId);
    const all = await storage.getAllProperties();
    const results = alerts.map((a: any) => {
      let items = all.slice();
      if (a.cities && a.cities.length) items = items.filter((p) => a.cities.includes(p.city));
      if (a.propertyTypes && a.propertyTypes.length) items = items.filter((p) => a.propertyTypes.includes(p.propertyType));
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
