import express from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

/**
 * GET /api/property-categories
 * Get all active property categories
 */
router.get("/", async (req, res) => {
  try {
    const categories = await storage.getAllPropertyCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching property categories:", error);
    res.status(500).json({ 
      message: "تعذر جلب فئات العقارات",
      error: error instanceof Error ? error.message : "خطأ غير معروف"
    });
  }
});

/**
 * GET /api/property-categories/:id
 * Get a single property category by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "معرّف الفئة غير صحيح" });
    }
    
    const category = await storage.getPropertyCategoryById(id);
    if (!category) {
      return res.status(404).json({ message: "الفئة غير موجودة" });
    }
    
    res.json(category);
  } catch (error) {
    console.error("Error fetching property category:", error);
    res.status(500).json({ 
      message: "تعذر جلب فئة العقار",
      error: error instanceof Error ? error.message : "خطأ غير معروف"
    });
  }
});

export default router;

