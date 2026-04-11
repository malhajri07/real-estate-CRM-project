/**
 * routes/cms-navigation.ts — Site navigation menu management (admin-only).
 *
 * Mounted at `/api/cms/navigation`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | / | Admin | Get full nav tree |
 * | PUT | / | Admin | Replace entire navigation structure |
 * | POST | /items | Admin | Add nav item |
 * | PUT | /items/:id | Admin | Update nav item |
 * | DELETE | /items/:id | Admin | Remove nav item |
 *
 * Consumer: admin navigation management page (`/admin/navigation`), query key `cms-navigation`.
 */

import express from "express";
import { z } from "zod";
import { NavigationService } from "../services/navigationService";
import { getAuth } from "../src/middleware/auth-helpers";

const router = express.Router();

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

// Public: Get visible navigation links
/**
 * List navigation with optional filters.
 *
 * @route   GET /api/cms/navigation/navigation
 * @auth    Public — no auth required
 */
router.get("/navigation", async (req, res) => {
  try {
    const links = await NavigationService.getVisibleNavigationLinks();
    res.json(links);
  } catch (error) {
    console.error("Failed to get navigation links:", error);
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to load navigation links",
    });
  }
});

// Public: Get header configuration (logo, etc)
/**
 * List public with optional filters.
 *
 * @route   GET /api/cms/navigation/public/header-config
 * @auth    Public — no auth required
 */
router.get("/public/header-config", async (req, res) => {
  try {
    // Import LandingService dynamically if needed or just use import
    const { LandingService } = await import("../services/landingService");
    const sections = await LandingService.getPublicLanding();
    const headerSection = sections.find((s) => s.slug === "header");

    // Normalize response
    const content = (headerSection?.content || {}) as any;
    const config = {
      siteName: content.siteName || "Aqarkom",
      logoUrl: content.logo?.url || "",
      logoAlt: content.logo?.alt || "Logo",
    };

    res.json(config);
  } catch (error) {
    console.error("Failed to get header config:", error);
    res.status(500).json({ message: "Failed to load header config" });
  }
});

// Admin: Get all navigation links (including hidden)
/** GET /navigation/all */
router.get(
  "/navigation/all",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const links = await NavigationService.getNavigationLinks();
      res.json(links);
    } catch (error) {
      console.error("Failed to get navigation links:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to load navigation links",
      });
    }
  }
);

// Admin: Update all navigation links
/** PUT /navigation */
router.put(
  "/navigation",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const links = await NavigationService.updateNavigationLinks({
        links: req.body,
      });
      res.json(links);
    } catch (error) {
      console.error("Failed to update navigation links:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to update navigation links",
      });
    }
  }
);

// Admin: Create navigation link
/** POST /navigation */
router.post(
  "/navigation",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const link = await NavigationService.createNavigationLink({
        payload: req.body,
      });
      res.status(201).json(link);
    } catch (error) {
      console.error("Failed to create navigation link:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to create navigation link",
      });
    }
  }
);

// Admin: Update navigation link
/** PUT /navigation/:id */
router.put(
  "/navigation/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const link = await NavigationService.updateNavigationLink({
        id: req.params.id,
        payload: req.body,
      });
      res.json(link);
    } catch (error) {
      console.error("Failed to update navigation link:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to update navigation link",
      });
    }
  }
);

// Admin: Delete navigation link
/** DELETE /navigation/:id */
router.delete(
  "/navigation/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      await NavigationService.deleteNavigationLink({ id: req.params.id });
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete navigation link:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete navigation link",
      });
    }
  }
);

// Admin: Reorder navigation links
/** POST /navigation/reorder */
router.post(
  "/navigation/reorder",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const links = await NavigationService.reorderNavigationLinks({
        orders: req.body.orders,
      });
      res.json(links);
    } catch (error) {
      console.error("Failed to reorder navigation links:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to reorder navigation links",
      });
    }
  }
);

export default router;

