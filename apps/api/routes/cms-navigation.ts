import express from "express";
import { z } from "zod";
import { NavigationService } from "../services/navigationService";

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

// Public: Get visible navigation links
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

// Admin: Get all navigation links (including hidden)
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

