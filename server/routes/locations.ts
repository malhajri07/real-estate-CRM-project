import express from "express";
import { storage } from "../storage";

const router = express.Router();

router.get("/regions", async (_req, res) => {
  try {
    const regions = await storage.getAllSaudiRegions();
    res.json(regions);
  } catch (err) {
    console.error("Error fetching regions:", err);
    res.status(500).json({ message: "Failed to fetch regions" });
  }
});

router.get("/cities", async (req, res) => {
  try {
    const regionCode = (req.query.regionCode as string | undefined) || undefined;
    if (regionCode) {
      const cities = await storage.getCitiesByRegion(regionCode);
      return res.json(cities);
    }
    const cities = await storage.getAllSaudiCities();
    res.json(cities);
  } catch (err) {
    console.error("Error fetching cities:", err);
    res.status(500).json({ message: "Failed to fetch cities" });
  }
});

export default router;

