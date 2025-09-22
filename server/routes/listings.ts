/**
 * routes/listings.ts - Property Listings API Routes
 * 
 * This file defines all property listing-related API endpoints for the real estate CRM platform.
 * It handles:
 * - Property listing retrieval and search
 * - Property filtering and sorting
 * - Featured property management
 * - Property detail operations
 * 
 * The routes use Prisma-based storage for database operations and provide
 * comprehensive property management functionality.
 * 
 * Dependencies:
 * - Express.js router for route handling
 * - Zod for request validation
 * - Prisma-based storage for database operations
 * 
 * API Endpoints:
 * - GET /api/listings - Get all listings with filtering
 * - GET /api/listings/featured - Get featured listings
 * - GET /api/listings/:id - Get specific listing
 * - POST /api/listings - Create new listing
 * - PUT /api/listings/:id - Update listing
 * - DELETE /api/listings/:id - Delete listing
 * 
 * Routes affected: Property listings, search, management
 * Pages affected: Property listings page, search results, property detail, property management
 */

import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";

const router = express.Router();

// Simple query parsing and filtering for listings
router.get("/", async (req, res) => {
  try {
    const {
      q,
      ids,
      city,
      propertyType,
      propertyCategory,
      listingType,
      minPrice,
      maxPrice,
      minBedrooms,
      minBathrooms,
      status,
      sort,
      page = "1",
      pageSize = "20",
    } = req.query as Record<string, string | undefined>;

    // Base list, with optional text search
    let base = [] as Awaited<ReturnType<typeof storage.getAllProperties>>;
    if (ids && ids.trim().length > 0) {
      base = await storage.getAllProperties();
    } else if (q && q.trim().length > 0) {
      // Use storage search when possible
      try {
        base = await storage.searchProperties(q);
      } catch {
        base = await storage.getAllProperties();
      }
    } else {
      base = await storage.getAllProperties();
      console.log(`Debug: Retrieved ${base.length} properties from storage`);
    }

    let results = base.filter((p) => {
      if (ids) {
        const set = new Set(ids.split(',').map(s => s.trim()));
        if (!set.has(p.id)) return false;
      }
      // Only include publicly visible listings by default
      if (status && p.status !== status) return false;
      // Include all properties by default (no status filtering)
      // if (!status && p.status && p.status !== "active") return false;

      if (q) {
        const t = q.toLowerCase();
        const hay = `${p.title} ${p.description ?? ""} ${p.address} ${p.city}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      if (city && p.city !== city) return false;
      if (propertyType && p.propertyType !== propertyType) return false;
      if (propertyCategory && p.propertyCategory !== propertyCategory) return false;
      if (listingType && p.listingType !== listingType) return false;

      if (minPrice) {
        const mp = Number(minPrice);
        const price = Number(p.price || 0);
        if (!Number.isNaN(mp) && price < mp) return false;
      }
      if (maxPrice) {
        const mp = Number(maxPrice);
        const price = Number(p.price || 0);
        if (!Number.isNaN(mp) && price > mp) return false;
      }
      if (minBedrooms) {
        const mb = Number(minBedrooms);
        if (!Number.isNaN(mb) && (p.bedrooms || 0) < mb) return false;
      }
      if (minBathrooms) {
        const mb = Number(minBathrooms);
        const baths = typeof p.bathrooms === "number" ? p.bathrooms : Number(p.bathrooms || 0);
        if (!Number.isNaN(mb) && baths < mb) return false;
      }
      return true;
    });

    // Sorting
    if (sort) {
      switch (sort) {
        case "price_asc":
          results = results.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
          break;
        case "price_desc":
          results = results.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
          break;
        case "area_asc":
          results = results.sort((a, b) => (a.squareFeet || 0) - (b.squareFeet || 0));
          break;
        case "area_desc":
          results = results.sort((a, b) => (b.squareFeet || 0) - (a.squareFeet || 0));
          break;
        case "popular":
          results = results.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
          break;
        case "newest":
        default:
          results = results.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page || "1", 10) || 1);
    const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize || "20", 10) || 20));
    const total = results.length;
    const start = (pageNum - 1) * sizeNum;
    const items = results.slice(start, start + sizeNum);

    res.json({ items, page: pageNum, pageSize: sizeNum, total, totalPages: Math.ceil(total / sizeNum) });
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
});

// Map endpoint: return lightweight listing markers
router.get("/map", async (req, res) => {
  try {
    const { city, propertyType, propertyCategory, listingType } = req.query as Record<string, string | undefined>;
    const properties = await storage.getAllProperties();
    
    // Debug: log first property to see structure
    if (properties.length > 0) {
      console.log("First property structure:", JSON.stringify(properties[0], null, 2));
    }
    
    const mapProperties = properties
      .filter((p) => p.latitude && p.longitude)
      .filter((p) => (city ? p.city === city : true))
      .filter((p) => (propertyType ? p.type === propertyType : true))
      // Property category is optional in seed data; don't exclude when absent
      // .filter((p) => (propertyCategory ? p.propertyCategory === propertyCategory : true))
      .filter((p) => (listingType ? p.listingType === listingType : true))
      .map((p) => ({
        id: p.id,
        title: p.title,
        address: p.address,
        city: p.city,
        price: p.price,
        propertyCategory: p.category,
        propertyType: p.type,
        latitude: p.latitude,
        longitude: p.longitude,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqm: (p as any).areaSqm ?? null,
        status: p.status,
      }));
    
    console.log(`Map endpoint: ${properties.length} total, ${mapProperties.length} with coords`);
    res.json(mapProperties);
  } catch (err) {
    console.error("Error fetching listings for map:", err);
    res.status(500).json({ message: "Failed to fetch listings for map" });
  }
});

// Listing detail
router.get("/:id", async (req, res) => {
  try {
    const item = await storage.getProperty(req.params.id);
    if (!item) return res.status(404).json({ message: "Listing not found" });
    res.json(item);
  } catch (err) {
    console.error("Error fetching listing detail:", err);
    res.status(500).json({ message: "Failed to fetch listing" });
  }
});

// Similar listings
router.get("/:id/similar", async (req, res) => {
  try {
    const current = await storage.getProperty(req.params.id);
    if (!current) return res.status(404).json({ message: "Listing not found" });
    const all = await storage.getAllProperties();
    const similar = all
      .filter(p => p.id !== current.id && p.city === current.city && p.propertyType === current.propertyType)
      .slice(0, 8);
    res.json(similar);
  } catch (err) {
    console.error("Error fetching similar listings:", err);
    res.status(500).json({ message: "Failed to fetch similar listings" });
  }
});

// Featured/new listings
router.get("/featured", async (req, res) => {
  try {
    const all = await storage.getAllProperties();
    let featured = all.filter((p: any) => p.isFeatured === true && p.status === 'active');
    if (featured.length === 0) {
      // fallback to newest
      featured = all.sort((a: any, b: any) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
    }
    res.json(featured.slice(0, 12));
  } catch (err) {
    console.error("Error fetching featured listings:", err);
    res.status(500).json({ message: "Failed to fetch featured listings" });
  }
});

// Create a new listing
router.post("/", async (req, res) => {
  try {
    // Minimal required fields validation
    const schema = z.object({
      title: z.string(),
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      price: z.union([z.number(), z.string()]),
      propertyCategory: z.string(),
      propertyType: z.string(),
      ownerId: z.string().optional(),
      createdBy: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const listing = await storage.createProperty(
      {
        ...req.body,
        ownerId: data.ownerId || "sample-user-1",
        createdBy: data.createdBy || "sample-user-1",
        moderationStatus: (req.body?.moderationStatus as any) || 'pending',
        status: (req.body?.status as any) || 'draft',
      } as any,
      "default-user",
      "default-tenant",
    );
    res.status(201).json(listing);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid listing data", errors: err.errors });
    }
    console.error("Error creating listing:", err);
    res.status(500).json({ message: "Failed to create listing" });
  }
});

// Update a listing
router.put("/:id", async (req, res) => {
  try {
    const updated = await storage.updateProperty(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Listing not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating listing:", err);
    res.status(500).json({ message: "Failed to update listing" });
  }
});

// Update status/moderation
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, moderationStatus } = req.body || {};
    const updated = await storage.updateProperty(req.params.id, { status, moderationStatus } as any);
    if (!updated) return res.status(404).json({ message: "Listing not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating listing status:", err);
    res.status(500).json({ message: "Failed to update listing status" });
  }
});

// Delete listing
router.delete("/:id", async (req, res) => {
  try {
    const ok = await storage.deleteProperty(req.params.id);
    if (!ok) return res.status(404).json({ message: "Listing not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting listing:", err);
    res.status(500).json({ message: "Failed to delete listing" });
  }
});

export default router;
