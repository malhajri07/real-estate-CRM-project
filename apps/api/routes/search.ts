import express, { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";

const router = express.Router();

const getUserId = (req: Request): string => req.user?.id ?? "sample-user-1";

router.get("/saved", async (req: Request, res: Response) => {
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

router.post("/saved", async (req: Request, res: Response) => {
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

router.delete("/saved/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const ok = await storage.deleteSavedSearch(req.params.id);
    if (!ok) return res.status(404).json({ message: "Saved search not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting saved search:", err);
    res.status(500).json({ message: "Failed to delete saved search" });
  }
});

export default router;

// Simulate running saved search alerts (dev helper)
router.post("/run-alerts", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const alerts = await storage.getSavedSearches(userId);
    const allProperties = await storage.getAllProperties();
    const results = alerts.map((alert) => {
      let items = allProperties.slice();
      if (alert.cities && alert.cities.length) {
        items = items.filter((property) => alert.cities!.includes(property.city ?? ""));
      }
      if (alert.propertyTypes && alert.propertyTypes.length) {
        items = items.filter((property) => alert.propertyTypes!.includes(property.propertyType ?? ""));
      }
      if (alert.minPrice) {
        items = items.filter((property) => Number(property.price ?? 0) >= Number(alert.minPrice));
      }
      if (alert.maxPrice) {
        items = items.filter((property) => Number(property.price ?? 0) <= Number(alert.maxPrice));
      }
      return { alertId: alert.id, alertName: alert.alertName, matches: items.length };
    });
    res.json({ alerts: results });
  } catch (err) {
    console.error("Error running saved search alerts:", err);
    res.status(500).json({ message: "Failed to run alerts" });
  }
});
