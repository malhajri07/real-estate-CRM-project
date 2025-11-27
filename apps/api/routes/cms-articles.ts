/**
 * routes/cms-articles.ts - CMS Articles API Routes
 * 
 * Location: apps/api/ → Routes/ → cms-articles.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for CMS article management. Handles:
 * - Article CRUD operations
 * - Article publishing and status management
 * - Article categorization and tagging
 * - SEO metadata management
 * 
 * API Endpoints:
 * - GET /api/cms/articles - Get articles
 * - GET /api/cms/articles/:id - Get article by ID
 * - POST /api/cms/articles - Create article
 * - PUT /api/cms/articles/:id - Update article
 * - DELETE /api/cms/articles/:id - Delete article
 * 
 * Related Files:
 * - apps/api/services/articleService.ts - Article service
 * - apps/web/src/pages/admin/articles-management.tsx - Article management UI
 */

import express from "express";
import { z } from "zod";
import { ArticleService } from "../services/articleService";

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

// Public: Get published articles (or all for admin)
router.get("/articles", async (req, res) => {
  try {
    const {
      status,
      categoryId,
      tagId,
      authorId,
      page = "1",
      pageSize = "20",
      search,
    } = req.query as Record<string, string | undefined>;

    // Check if this is an admin request (has auth)
    const auth = getAuth(req);
    const isAdmin = auth.roles.some((r) =>
      ["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"].includes(r.toUpperCase())
    );

    // For public endpoint, only allow published status
    // For admin, allow all statuses including undefined (all)
    let finalStatus: "draft" | "published" | "archived" | undefined = undefined;
    if (!isAdmin) {
      finalStatus = "published";
    } else if (status && status !== "all") {
      finalStatus = status as "draft" | "published" | "archived";
    }

    const result = await ArticleService.listArticles({
      status: finalStatus,
      categoryId,
      tagId,
      authorId,
      page: parseInt(page || "1", 10),
      pageSize: parseInt(pageSize || "20", 10),
      search,
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to list articles:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to load articles";
    console.error("Error details:", error);
    res.status(500).json({
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
});

// Public: Get article by slug (only published articles)
router.get("/articles/slug/:slug", async (req, res) => {
  try {
    // For public access, only allow published articles
    const article = await ArticleService.getArticleBySlug(req.params.slug, true);
    res.json(article);
  } catch (error) {
    console.error("Failed to get article:", error);
    res.status(404).json({
      message:
        error instanceof Error ? error.message : "Article not found",
    });
  }
});

// Admin: Get article by ID
router.get(
  "/articles/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const article = await ArticleService.getArticle(req.params.id);
      res.json(article);
    } catch (error) {
      console.error("Failed to get article:", error);
      res.status(404).json({
        message:
          error instanceof Error ? error.message : "Article not found",
      });
    }
  }
);

// Admin: Create article
router.post(
  "/articles",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const article = await ArticleService.createArticle({
        payload: req.body,
        authorId: auth.id,
        actor: auth.id,
      });
      res.status(201).json(article);
    } catch (error) {
      console.error("Failed to create article:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create article",
      });
    }
  }
);

// Admin: Update article
router.put(
  "/articles/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const article = await ArticleService.updateArticle({
        id: req.params.id,
        payload: req.body,
        actor: auth.id,
      });
      res.json(article);
    } catch (error) {
      console.error("Failed to update article:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to update article",
      });
    }
  }
);

// Admin: Publish article
router.post(
  "/articles/:id/publish",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const article = await ArticleService.publishArticle({
        id: req.params.id,
        actor: auth.id,
      });
      res.json(article);
    } catch (error) {
      console.error("Failed to publish article:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to publish article",
      });
    }
  }
);

// Admin: Archive article
router.post(
  "/articles/:id/archive",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const article = await ArticleService.archiveArticle({
        id: req.params.id,
        actor: auth.id,
      });
      res.json(article);
    } catch (error) {
      console.error("Failed to archive article:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to archive article",
      });
    }
  }
);

// Admin: Delete article
router.delete(
  "/articles/:id",
  requireRole(["WEBSITE_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      await ArticleService.deleteArticle({
        id: req.params.id,
        actor: auth.id,
      });
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete article:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to delete article",
      });
    }
  }
);

// Categories
router.get("/articles/categories", async (req, res) => {
  try {
    const categories = await ArticleService.listCategories();
    res.json(categories);
  } catch (error) {
    console.error("Failed to list categories:", error);
    res.status(500).json({ message: "Failed to load categories" });
  }
});

router.post(
  "/articles/categories",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const category = await ArticleService.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Failed to create category:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create category",
      });
    }
  }
);

// Tags
router.get("/articles/tags", async (req, res) => {
  try {
    const tags = await ArticleService.listTags();
    res.json(tags);
  } catch (error) {
    console.error("Failed to list tags:", error);
    res.status(500).json({ message: "Failed to load tags" });
  }
});

router.post(
  "/articles/tags",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const tag = await ArticleService.createTag(req.body);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Failed to create tag:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to create tag",
      });
    }
  }
);

// Admin: Get article versions
router.get(
  "/articles/:id/versions",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const versions = await ArticleService.getArticleVersions(id);
      res.json(versions);
    } catch (error) {
      console.error("Failed to get article versions:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to get article versions",
      });
    }
  }
);

// Admin: Restore article version
router.post(
  "/articles/:id/versions/:version/restore",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const { id, version } = req.params;
      const auth = getAuth(req);
      const article = await ArticleService.restoreArticleVersion({
        articleId: id,
        version: parseInt(version, 10),
        actor: auth.id,
      });
      res.json(article);
    } catch (error) {
      console.error("Failed to restore article version:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to restore article version",
      });
    }
  }
);

// Admin: Bulk actions (publish, archive, delete)
router.post(
  "/articles/bulk",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const { action, articleIds } = req.body;
      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        return res.status(400).json({ message: "articleIds must be a non-empty array" });
      }

      const results = [];
      for (const id of articleIds) {
        try {
          if (action === "publish") {
            await ArticleService.publishArticle(id);
            results.push({ id, success: true });
          } else if (action === "archive") {
            await ArticleService.archiveArticle(id);
            results.push({ id, success: true });
          } else if (action === "delete") {
            await ArticleService.deleteArticle(id);
            results.push({ id, success: true });
          } else {
            results.push({ id, success: false, error: "Invalid action" });
          }
        } catch (error) {
          results.push({
            id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to perform bulk action",
      });
    }
  }
);

export default router;

