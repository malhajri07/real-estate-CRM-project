import express from "express";
import { z } from "zod";
import { SEOService } from "../services/seoService";

const router = express.Router();

function getAuth(req: any) {
  const user = req.session?.user || req.user;
  const roles: string[] = Array.isArray(user?.roles)
    ? user.roles
    : typeof user?.roles === "string"
    ? [user.roles]
    : [];
  return {
    id: user?.id ?? "anonymous",
    roles,
  };
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    const auth = getAuth(req);
    const roleSet = new Set(auth.roles.map((r) => r.toUpperCase()));
    const allowed = roles.some((r) => roleSet.has(r.toUpperCase()));
    if (!allowed) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

// Public: Get SEO settings for a page
router.get("/seo/:pagePath(*)", async (req, res) => {
  try {
    const pagePath = `/${req.params.pagePath || ""}`;
    const settings = await SEOService.getSettings(pagePath);
    res.json(settings);
  } catch (error) {
    console.error("Failed to get SEO settings:", error);
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to load SEO settings",
    });
  }
});

// Admin: Get all SEO settings
router.get(
  "/seo",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const settings = await SEOService.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to list SEO settings:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to load SEO settings",
      });
    }
  }
);

// Admin: Update SEO settings
router.put(
  "/seo/:pagePath(*)",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const pagePath = `/${req.params.pagePath || ""}`;
      const settings = await SEOService.updateSettings({
        pagePath,
        payload: { ...req.body, pagePath },
      });
      res.json(settings);
    } catch (error) {
      console.error("Failed to update SEO settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to update SEO settings",
      });
    }
  }
);

// Admin: Delete SEO settings
router.delete(
  "/seo/:pagePath(*)",
  requireRole(["WEBSITE_ADMIN"]),
  async (req, res) => {
    try {
      const pagePath = `/${req.params.pagePath || ""}`;
      await SEOService.deleteSettings(pagePath);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete SEO settings:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete SEO settings",
      });
    }
  }
);

// Admin: Generate sitemap
router.get(
  "/seo/sitemap.xml",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const sitemap = await SEOService.generateSitemap();
      res.setHeader("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      console.error("Failed to generate sitemap:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to generate sitemap",
      });
    }
  }
);

// Public: Get sitemap (no auth required)
router.get("/sitemap.xml", async (req, res) => {
  try {
    const sitemap = await SEOService.generateSitemap();
    res.setHeader("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to generate sitemap",
    });
  }
});

// Public: Get robots.txt (no auth required)
router.get("/robots.txt", async (req, res) => {
  try {
    const robotsTxt = await SEOService.getRobotsTxt();
    res.setHeader("Content-Type", "text/plain");
    res.send(robotsTxt);
  } catch (error) {
    console.error("Failed to get robots.txt:", error);
    res.status(500).send("User-agent: *\nDisallow: /");
  }
});

// Admin: Update robots.txt
router.put(
  "/robots.txt",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const { content } = req.body;
      if (typeof content !== "string") {
        return res.status(400).json({ message: "Content must be a string" });
      }
      const result = await SEOService.updateRobotsTxt(content);
      res.json(result);
    } catch (error) {
      console.error("Failed to update robots.txt:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to update robots.txt",
      });
    }
  }
);

// Admin: Get robots.txt content
router.get(
  "/robots.txt/content",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const robotsTxt = await SEOService.getRobotsTxt();
      res.json({ content: robotsTxt });
    } catch (error) {
      console.error("Failed to get robots.txt:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to get robots.txt",
      });
    }
  }
);

export default router;

