/**
 * server/routes/cms.ts - Custom CMS API Routes
 * 
 * This file provides API endpoints for managing landing page content
 * and pricing plans. It replaces the Strapi CMS with a custom
 * database-driven content management system.
 * 
 * Key Features:
 * - Landing page content management
 * - Pricing plans management
 * - Features, stats, solutions management
 * - Navigation and footer content management
 * - Contact information management
 * 
 * Dependencies:
 * - Prisma Client for database operations
 * - Express Router for API endpoints
 * - Authentication middleware for admin access
 * 
 * Routes affected: All CMS-related API endpoints
 * Pages affected: Landing page, CMS admin panel
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../authMiddleware";
import { UserLevel } from "../authMiddleware";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/cms/landing-page - Get landing page content
 * 
 * Retrieves all landing page content including features, stats,
 * solutions, navigation, and other content sections.
 */
router.get("/landing-page", async (req, res) => {
  try {
    // Get or create landing page content
    let content = await prisma.landingPageContent.findFirst({
      include: {
        features: { orderBy: { order: "asc" } },
        stats: { orderBy: { order: "asc" } },
        solutions: {
          orderBy: { order: "asc" },
          include: {
            features: { orderBy: { order: "asc" } }
          }
        },
        heroDashboardMetrics: { orderBy: { order: "asc" } },
        contactInfo: { orderBy: { order: "asc" } },
        footerLinks: { orderBy: { order: "asc" } },
        navigation: { orderBy: { order: "asc" } }
      }
    });

    // If no content exists, create default content
    if (!content) {
      content = await createDefaultLandingPageContent();
    }

    res.json({ data: content });
  } catch (error) {
    console.error("Error fetching landing page content:", error);
    res.status(500).json({ error: "Failed to fetch landing page content" });
  }
});

/**
 * PUT /api/cms/landing-page - Update landing page content
 * 
 * Updates the main landing page content fields.
 * Requires admin authentication.
 */
router.put("/landing-page", requireAuth, requireRole([UserLevel.WEBSITE_ADMIN]), async (req, res) => {
  try {
    const updateData = req.body;
    
    // Get existing content or create new
    let content = await prisma.landingPageContent.findFirst();
    
    if (content) {
      content = await prisma.landingPageContent.update({
        where: { id: content.id },
        data: updateData,
        include: {
          features: { orderBy: { order: "asc" } },
          stats: { orderBy: { order: "asc" } },
          solutions: {
            orderBy: { order: "asc" },
            include: {
              features: { orderBy: { order: "asc" } }
            }
          },
          heroDashboardMetrics: { orderBy: { order: "asc" } },
          contactInfo: { orderBy: { order: "asc" } },
          footerLinks: { orderBy: { order: "asc" } },
          navigation: { orderBy: { order: "asc" } }
        }
      });
    } else {
      content = await createDefaultLandingPageContent();
    }

    res.json({ data: content });
  } catch (error) {
    console.error("Error updating landing page content:", error);
    res.status(500).json({ error: "Failed to update landing page content" });
  }
});

/**
 * GET /api/cms/pricing-plans - Get pricing plans
 * 
 * Retrieves all pricing plans with their features.
 */
router.get("/pricing-plans", async (req, res) => {
  try {
    const plans = await prisma.pricingPlan.findMany({
      include: {
        features: { orderBy: { order: "asc" } }
      },
      orderBy: { order: "asc" }
    });

    res.json({ data: plans });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    res.status(500).json({ error: "Failed to fetch pricing plans" });
  }
});

/**
 * POST /api/cms/pricing-plans - Create new pricing plan
 * 
 * Creates a new pricing plan with features.
 * Requires admin authentication.
 */
router.post("/pricing-plans", requireAuth, requireRole([UserLevel.WEBSITE_ADMIN]), async (req, res) => {
  try {
    const { features, ...planData } = req.body;
    
    const plan = await prisma.pricingPlan.create({
      data: {
        ...planData,
        features: {
          create: features || []
        }
      },
      include: {
        features: { orderBy: { order: "asc" } }
      }
    });

    res.json({ data: plan });
  } catch (error) {
    console.error("Error creating pricing plan:", error);
    res.status(500).json({ error: "Failed to create pricing plan" });
  }
});

/**
 * PUT /api/cms/pricing-plans/:id - Update pricing plan
 * 
 * Updates an existing pricing plan.
 * Requires admin authentication.
 */
router.put("/pricing-plans/:id", requireAuth, requireRole([UserLevel.WEBSITE_ADMIN]), async (req, res) => {
  try {
    const { id } = req.params;
    const { features, ...planData } = req.body;
    
    // Update plan data
    const plan = await prisma.pricingPlan.update({
      where: { id },
      data: planData,
      include: {
        features: { orderBy: { order: "asc" } }
      }
    });

    // Update features if provided
    if (features) {
      // Delete existing features
      await prisma.pricingPlanFeature.deleteMany({
        where: { pricingPlanId: id }
      });

      // Create new features
      await prisma.pricingPlanFeature.createMany({
        data: features.map((feature: any) => ({
          ...feature,
          pricingPlanId: id
        }))
      });

      // Fetch updated plan with features
      const updatedPlan = await prisma.pricingPlan.findUnique({
        where: { id },
        include: {
          features: { orderBy: { order: "asc" } }
        }
      });

      return res.json({ data: updatedPlan });
    }

    res.json({ data: plan });
  } catch (error) {
    console.error("Error updating pricing plan:", error);
    res.status(500).json({ error: "Failed to update pricing plan" });
  }
});

/**
 * DELETE /api/cms/pricing-plans/:id - Delete pricing plan
 * 
 * Deletes a pricing plan and its features.
 * Requires admin authentication.
 */
router.delete("/pricing-plans/:id", requireAuth, requireRole([UserLevel.WEBSITE_ADMIN]), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.pricingPlan.delete({
      where: { id }
    });

    res.json({ message: "Pricing plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting pricing plan:", error);
    res.status(500).json({ error: "Failed to delete pricing plan" });
  }
});

/**
 * Helper function to create default landing page content
 */
async function createDefaultLandingPageContent() {
  const content = await prisma.landingPageContent.create({
    data: {
      loadingText: "جار تحميل المحتوى...",
      heroWelcomeText: "مرحباً بك في",
      heroTitle: "منصة عقاراتي للوساطة العقارية",
      heroSubtitle: "منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة",
      heroButton: "ابدأ رحلتك المجانية",
      heroLoginButton: "تسجيل الدخول",
      heroDashboardTitle: "منصة عقاراتي - لوحة التحكم",
      featuresTitle: "لماذا تختار منصة عقاراتي؟",
      featuresDescription: "عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة",
      solutionsTitle: "حلول شاملة لإدارة العقارات",
      solutionsDescription: "أدوات متكاملة تساعدك في إدارة جميع جوانب أعمالك العقارية",
      statsTitle: "أرقامنا تتحدث",
      pricingTitle: "خطط الأسعار",
      pricingSubtitle: "اختر الخطة المناسبة لك",
      contactTitle: "تواصل معنا",
      contactDescription: "نحن هنا لمساعدتك في رحلتك العقارية",
      footerDescription: "منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية",
      footerCopyright: "© 2024 منصة عقاراتي. جميع الحقوق محفوظة.",
      // Create default features
      features: {
        create: [
          {
            title: "إدارة شاملة للعقارات",
            description: "أدوات متقدمة لإدارة جميع جوانب أعمالك العقارية",
            icon: "Building",
            order: 1
          },
          {
            title: "تتبع العملاء المحتملين",
            description: "نظام متكامل لتتبع وإدارة العملاء المحتملين",
            icon: "Users",
            order: 2
          },
          {
            title: "تقارير مفصلة",
            description: "تقارير شاملة تساعدك في اتخاذ القرارات الصحيحة",
            icon: "BarChart",
            order: 3
          }
        ]
      },
      // Create default stats
      stats: {
        create: [
          {
            number: "1.2M",
            label: "إيرادات",
            suffix: "﷼",
            order: 1
          },
          {
            number: "3,847",
            label: "عملاء",
            order: 2
          },
          {
            number: "89",
            label: "عقارات",
            order: 3
          },
          {
            number: "45",
            label: "صفقات",
            order: 4
          }
        ]
      },
      // Create default hero metrics
      heroDashboardMetrics: {
        create: [
          {
            value: "1.2M ﷼",
            label: "إيرادات",
            color: "blue",
            order: 1
          },
          {
            value: "3,847",
            label: "عملاء",
            color: "green",
            order: 2
          },
          {
            value: "89",
            label: "عقارات",
            color: "orange",
            order: 3
          },
          {
            value: "45",
            label: "صفقات",
            color: "purple",
            order: 4
          }
        ]
      },
      // Create default navigation
      navigation: {
        create: [
          { text: "الرئيسية", url: "#home", order: 1 },
          { text: "ابحث عن عقار", url: "/search-properties", order: 2 },
          { text: "المميزات", url: "#features", order: 3 },
          { text: "الحلول", url: "#solutions", order: 4 },
          { text: "الأسعار", url: "#pricing", order: 5 },
          { text: "اتصل بنا", url: "#contact", order: 6 }
        ]
      },
      // Create default contact info
      contactInfo: {
        create: [
          {
            type: "phone",
            label: "الهاتف",
            value: "+966 50 123 4567",
            icon: "Phone",
            order: 1
          },
          {
            type: "email",
            label: "البريد الإلكتروني",
            value: "info@aqaraty.com",
            icon: "Mail",
            order: 2
          },
          {
            type: "address",
            label: "العنوان",
            value: "الرياض، المملكة العربية السعودية",
            icon: "MapPin",
            order: 3
          }
        ]
      }
    },
    include: {
      features: { orderBy: { order: "asc" } },
      stats: { orderBy: { order: "asc" } },
      solutions: {
        orderBy: { order: "asc" },
        include: {
          features: { orderBy: { order: "asc" } }
        }
      },
      heroDashboardMetrics: { orderBy: { order: "asc" } },
      contactInfo: { orderBy: { order: "asc" } },
      footerLinks: { orderBy: { order: "asc" } },
      navigation: { orderBy: { order: "asc" } }
    }
  });

  return content;
}

export default router;
