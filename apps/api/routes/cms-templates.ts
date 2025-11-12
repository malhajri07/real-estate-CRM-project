import express from "express";
import { z } from "zod";
import { TemplateService } from "../services/templateService";

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

// List templates
router.get(
  "/templates",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const {
        type,
        category,
        page = "1",
        pageSize = "20",
        search,
      } = req.query as Record<string, string | undefined>;

      const result = await TemplateService.listTemplates({
        type,
        category,
        page: parseInt(page || "1", 10),
        pageSize: parseInt(pageSize || "20", 10),
        search,
      });

      res.json(result);
    } catch (error) {
      console.error("Failed to list templates:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to load templates",
      });
    }
  }
);

// Get template by ID
router.get(
  "/templates/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const template = await TemplateService.getTemplate(req.params.id);
      res.json(template);
    } catch (error) {
      console.error("Failed to get template:", error);
      res.status(404).json({
        message:
          error instanceof Error ? error.message : "Template not found",
      });
    }
  }
);

// Get template by slug
router.get(
  "/templates/slug/:slug",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const template = await TemplateService.getTemplateBySlug(req.params.slug);
      res.json(template);
    } catch (error) {
      console.error("Failed to get template:", error);
      res.status(404).json({
        message:
          error instanceof Error ? error.message : "Template not found",
      });
    }
  }
);

// Create template
router.post(
  "/templates",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const template = await TemplateService.createTemplate({
        payload: req.body,
        createdBy: auth.id,
        actor: auth.id,
      });
      res.status(201).json(template);
    } catch (error) {
      console.error("Failed to create template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create template",
      });
    }
  }
);

// Update template
router.put(
  "/templates/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const template = await TemplateService.updateTemplate({
        id: req.params.id,
        payload: req.body,
        actor: auth.id,
      });
      res.json(template);
    } catch (error) {
      console.error("Failed to update template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to update template",
      });
    }
  }
);

// Clone template
router.post(
  "/templates/:id/clone",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const template = await TemplateService.cloneTemplate({
        id: req.params.id,
        newName: req.body.newName,
        actor: auth.id,
      });
      res.status(201).json(template);
    } catch (error) {
      console.error("Failed to clone template:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to clone template",
      });
    }
  }
);

// Delete template
router.delete(
  "/templates/:id",
  requireRole(["WEBSITE_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      await TemplateService.deleteTemplate({
        id: req.params.id,
        actor: auth.id,
      });
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete template:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to delete template",
      });
    }
  }
);

export default router;

