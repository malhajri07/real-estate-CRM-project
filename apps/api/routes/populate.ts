/**
 * routes/populate.ts - Database Population Routes
 * 
 * Location: apps/api/ → Routes/ → populate.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for populating the database with sample data. Handles:
 * - Database population with test data
 * - Admin user creation and population
 * 
 * API Endpoints:
 * - POST /api/populate/populate - Populate database
 * 
 * Note: These routes are typically used for development and testing purposes.
 * 
 * Related Files:
 * - apps/api/populateDatabase.ts - Database population logic
 * - apps/api/populateAdmin1Data.ts - Admin data population
 * - apps/api/createAdmin1AndPopulate.ts - Admin creation and population
 */

import { Router } from "express";
// import { populateDatabase } from "../populateDatabase";
// import { populateAdmin1Data } from "../populateAdmin1Data";
// import { createAdmin1AndPopulate } from "../createAdmin1AndPopulate";
import { storage } from "../storage-prisma";

const router = Router();

// Endpoint to populate database with more data
router.post("/populate", async (req, res) => {
  res.status(501).json({ message: "Population features disabled during cleanup" });
});

// Endpoint to create Admin1 and populate with data
router.post("/create-admin1", async (req, res) => {
  res.status(501).json({ message: "Population features disabled during cleanup" });
});

// Endpoint to populate Admin1 with additional data
router.post("/populate-admin1", async (req, res) => {
  res.status(501).json({ message: "Population features disabled during cleanup" });
});

export default router;

// Dev-friendly faker to populate listings without a real DB
router.post("/fake", async (req, res) => {
  try {
    const { count = 20 } = req.body || {};
    const cities = [
      { name: "الرياض", lat: 24.7136, lng: 46.6753 },
      { name: "جدة", lat: 21.4894, lng: 39.2460 },
      { name: "الدمام", lat: 26.4207, lng: 50.0888 },
      { name: "مكة", lat: 21.3891, lng: 39.8579 }
    ];
    const types = ["شقة", "فيلا", "استوديو", "تاون هاوس"];
    const photos = [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
    ];
    const created: any[] = [];
    for (let i = 0; i < Math.max(1, Math.min(200, Number(count) || 20)); i++) {
      const c = cities[i % cities.length];
      const t = types[i % types.length];
      const lat = c.lat + (Math.random() - 0.5) * 0.1;
      const lng = c.lng + (Math.random() - 0.5) * 0.1;
      const price = 200000 + Math.round(Math.random() * 1800000);
      const listing = await storage.createProperty({
        title: `${t} في ${c.name}`,
        address: `حي رقم ${100 + i}`,
        city: c.name,
        state: c.name,
        zipCode: "12345",
        price: String(price),
        propertyCategory: "سكني" as any,
        propertyType: t as any,
        description: "وصف قصير للإعلان",
        bedrooms: t === 'شقة' ? 3 : 4,
        bathrooms: 3 as any,
        squareFeet: 200 + Math.round(Math.random() * 300),
        latitude: lat as any,
        longitude: lng as any,
        photoUrls: photos as any,
        features: ["موقف سيارات", "مصعد"] as any,
        status: "active" as any,
        isPubliclyVisible: true as any,
        isFeatured: Math.random() > 0.8 as any,
        listingType: "sale" as any,
      } as any, "agent-seeder", "tenant-seeder");
      created.push(listing);
    }
    res.json({ created: created.length });
  } catch (e: any) {
    console.error("faker populate error:", e?.message || e);
    res.status(500).json({ message: "failed to fake-populate" });
  }
});

// Alias: /populate/fake
router.post("/populate/fake", async (req, res) => {
  (router as any).handle({ ...req, url: '/fake', method: 'POST' }, res);
});
