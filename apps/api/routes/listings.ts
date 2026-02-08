/**
 * routes/listings.ts - Property Listings API Routes
 * 
 * Location: apps/api/ → Routes/ → listings.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
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
 * API Endpoints:
 * - GET /api/listings - List all listings
 * - GET /api/listings/featured - Get featured listings
 * - GET /api/listings/:id - Get listing by ID
 * - POST /api/listings - Create new listing
 * - PUT /api/listings/:id - Update listing
 * - DELETE /api/listings/:id - Delete listing
 * 
 * Related Files:
 * - apps/web/src/pages/properties.tsx - Property listing page
 * - apps/web/src/pages/listing.tsx - Property detail page
 * - apps/web/src/pages/post-listing.tsx - Create listing page
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
import { getErrorResponse } from "../i18n";
import { listingSchemas } from "../src/validators/listings.schema";
import { authenticateToken } from "../src/middleware/auth.middleware";

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

    // Parse pagination parameters
    // If pageSize is "all" or very large number, fetch all records
    const pageSizeStr = pageSize || "20";
    const shouldFetchAll = pageSizeStr.toLowerCase() === "all" || parseInt(pageSizeStr, 10) >= 10000;
    const pageNum = Math.max(1, parseInt(page || "1", 10) || 1);
    const sizeNum = shouldFetchAll ? 10000 : Math.min(1000, Math.max(1, parseInt(pageSizeStr, 10) || 20));

    // Parse filter parameters
    const filterOptions: any = {
      page: pageNum,
      pageSize: sizeNum,
      fetchAll: shouldFetchAll,
      sort: sort || 'newest',
    };

    if (q && q.trim().length > 0) {
      filterOptions.q = q.trim();
    }

    if (ids && ids.trim().length > 0) {
      filterOptions.ids = ids.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (city) filterOptions.city = city;
    if (propertyType) filterOptions.propertyType = propertyType;
    if (propertyCategory) filterOptions.propertyCategory = propertyCategory;
    if (listingType) filterOptions.listingType = listingType;
    if (status) filterOptions.status = status;

    if (minPrice) {
      const mp = Number(minPrice);
      if (!Number.isNaN(mp)) filterOptions.minPrice = mp;
    }

    if (maxPrice) {
      const mp = Number(maxPrice);
      if (!Number.isNaN(mp)) filterOptions.maxPrice = mp;
    }

    if (minBedrooms) {
      const mb = Number(minBedrooms);
      if (!Number.isNaN(mb)) filterOptions.minBedrooms = mb;
    }

    if (minBathrooms) {
      const mb = Number(minBathrooms);
      if (!Number.isNaN(mb)) filterOptions.minBathrooms = mb;
    }

    // Use SQL-level pagination
    const result = await storage.getPropertiesPaginated(filterOptions);

    // Process items to ensure photoUrls/imageGallery is included
    const items = result.items.map((item: any) => {
      // Ensure photoUrls/imageGallery is included in response
      let photoUrls: string[] | undefined = undefined;
      if (item.photoUrls && Array.isArray(item.photoUrls)) {
        photoUrls = item.photoUrls;
      } else if (item.photos) {
        try {
          // Try to parse photos if it's a JSON string
          const parsed = typeof item.photos === 'string' ? JSON.parse(item.photos) : item.photos;
          photoUrls = Array.isArray(parsed) ? parsed : undefined;
        } catch {
          // If parsing fails, ignore
        }
      } else if (item.imageGallery && Array.isArray(item.imageGallery)) {
        photoUrls = item.imageGallery;
      }

      return {
        ...item,
        photoUrls,
        imageGallery: photoUrls, // Also include as imageGallery for compatibility
      };
    });

    res.json({
      items,
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

// Map endpoint: return lightweight listing markers
router.get("/map", async (req, res) => {
  try {
    const { city, propertyType, propertyCategory, listingType } = req.query as Record<string, string | undefined>;
    const properties = await storage.getAllProperties();



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


    res.json(mapProperties);
  } catch (err) {
    console.error("Error fetching listings for map:", err);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

// Listing detail
router.get("/:id", async (req, res) => {
  try {
    const item = await storage.getProperty(req.params.id);
    if (!item) return res.status(404).json(getErrorResponse('LISTING_NOT_FOUND', (req as any).locale));
    res.json(item);
  } catch (err) {
    console.error("Error fetching listing detail:", err);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
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
router.post("/", authenticateToken, async (req, res) => {
  try {
    const data = listingSchemas.create.parse(req.body);

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
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', (req as any).locale, err.errors));
    }
    console.error("Error creating listing:", err);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
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
    await storage.deleteProperty(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting listing:", err);
    res.status(500).json({ message: "Failed to delete listing" });
  }
});

export default router;
