import { Router } from "express";
import { populateDatabase } from "../populateDatabase";

const router = Router();

// Endpoint to populate database with more data
router.post("/populate", async (req, res) => {
  try {
    const { count = 100 } = req.body;
    
    // Temporarily increase the count
    const originalFile = await import("../populateDatabase");
    
    console.log(`🚀 Creating ${count} additional properties...`);
    
    const result = await populateDatabase();
    
    res.json({
      success: true,
      message: `تم إنشاء البيانات بنجاح`,
      data: result
    });
  } catch (error) {
    console.error("Error populating database:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في إنشاء البيانات",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;