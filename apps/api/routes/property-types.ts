/**
 * routes/property-types.ts - Property Types API Routes
 * 
 * Location: apps/api/ → Routes/ → property-types.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for property type management. Handles:
 * - Retrieving property types
 * - Filtering by category
 * 
 * API Endpoints:
 * - GET /api/property-types - Get all property types
 * 
 * Related Files:
 * - apps/api/routes/property-categories.ts - Property categories routes
 */

import express from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

/**
 * GET /api/property-types
 * Get all active property types, optionally filtered by category
 * Query params: categoryId (number) or categoryCode (string)
 */
router.get("/", async (req, res) => {
  try {
    const { categoryId, categoryCode } = req.query;
    
    let types;
    if (categoryCode) {
      types = await storage.getPropertyTypesByCategoryCode(categoryCode as string);
    } else if (categoryId) {
      types = await storage.getAllPropertyTypes(Number(categoryId));
    } else {
      types = await storage.getAllPropertyTypes();
    }
    
    res.json(types);
  } catch (error) {
    console.error("Error fetching property types:", error);
    res.status(500).json({ 
      message: "تعذر جلب أنواع العقارات",
      error: error instanceof Error ? error.message : "خطأ غير معروف"
    });
  }
});

/**
 * GET /api/property-types/:id
 * Get a single property type by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "معرّف النوع غير صحيح" });
    }
    
    const types = await storage.getAllPropertyTypes();
    const type = types.find(t => t.id === id);
    
    if (!type) {
      return res.status(404).json({ message: "نوع العقار غير موجود" });
    }
    
    res.json(type);
  } catch (error) {
    console.error("Error fetching property type:", error);
    res.status(500).json({ 
      message: "تعذر جلب نوع العقار",
      error: error instanceof Error ? error.message : "خطأ غير معروف"
    });
  }
});

export default router;

