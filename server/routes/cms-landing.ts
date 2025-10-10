import express from "express";
import { z } from "zod";
import { LandingService } from "../services/landingService";

const router = express.Router();

const SectionCreateSchema = z.object({
  slug: z.string().min(3).max(64),
  title: z.string().max(120).optional(),
  subtitle: z.string().max(180).optional(),
  layoutVariant: z
    .enum(["hero", "grid", "pricing", "logos", "cta", "custom"])
    .optional(),
  theme: z.record(z.any()).optional(),
  draftJson: z.any().optional(),
});

const SectionUpdateSchema = z.object({
  title: z.string().max(120).optional(),
  subtitle: z.string().max(180).optional(),
  layoutVariant: z
    .enum(["hero", "grid", "pricing", "logos", "cta", "custom"])
    .optional(),
  theme: z.record(z.any()).optional(),
  draftJson: z.any().optional(),
  visible: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const SectionReorderSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int(),
    })
  ),
});

const CardCreateSchema = z.object({
  sectionId: z.string().uuid(),
  draftJson: z.any().optional(),
});

const CardUpdateSchema = z.object({
  draftJson: z.any().optional(),
  title: z.string().max(120).optional(),
  body: z.string().max(10_000).optional(),
  visible: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const CardReorderSchema = z.object({
  sectionId: z.string().uuid(),
  orders: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int(),
    })
  ),
});

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

router.get("/landing/sections", async (req, res) => {
  try {
    const status =
      req.query.status === "published" ? "published" : ("draft" as const);
    const sections = await LandingService.listSections({
      status,
      includeArchived: req.query.includeArchived === "true",
    });
    res.json({ data: sections });
  } catch (error) {
    console.error("Failed to list sections:", error);
    res.status(500).json({ message: "Failed to load sections" });
  }
});

router.post(
  "/landing/sections",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const payload = SectionCreateSchema.parse(req.body);
      const auth = getAuth(req);
      const section = await LandingService.createSection({
        slug: payload.slug,
        title: payload.title,
        subtitle: payload.subtitle,
        layoutVariant: payload.layoutVariant,
        theme: payload.theme as any,
        draftJson: payload.draftJson,
        actor: auth.id,
      });
      res.status(201).json(section);
    } catch (error) {
      console.error("Failed to create section:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create section" });
    }
  }
);

router.put(
  "/landing/sections/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const payload = SectionUpdateSchema.parse(req.body);
      const auth = getAuth(req);
      const section = await LandingService.updateSection({
        id: req.params.id,
        payload,
        actor: auth.id,
      });
      res.json(section);
    } catch (error) {
      console.error("Failed to update section:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update section" });
    }
  }
);

router.put(
  "/landing/sections/reorder",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const payload = SectionReorderSchema.parse(req.body);
      const auth = getAuth(req);
      await LandingService.reorderSections({
        orders: payload.orders,
        actor: auth.id,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to reorder sections:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to reorder sections" });
    }
  }
);

router.post(
  "/landing/sections/:id/publish",
  requireRole(["WEBSITE_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const publishCards = req.body?.publishCards === true;
      const section = await LandingService.publishSection({
        id: req.params.id,
        actor: auth.id,
        publishCards,
      });
      res.json(section);
    } catch (error) {
      console.error("Failed to publish section:", error);
      res.status(500).json({ message: "Failed to publish section" });
    }
  }
);

router.post(
  "/landing/sections/:id/archive",
  requireRole(["WEBSITE_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const section = await LandingService.archiveSection({
        id: req.params.id,
        actor: auth.id,
      });
      res.json(section);
    } catch (error) {
      console.error("Failed to archive section:", error);
      res.status(500).json({ message: "Failed to archive section" });
    }
  }
);

router.delete(
  "/landing/sections/:id",
  requireRole(["WEBSITE_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      await LandingService.deleteSection({ id: req.params.id, actor: auth.id });
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete section:", error);
      res.status(500).json({ message: "Failed to delete section" });
    }
  }
);

router.post(
  "/landing/cards",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const payload = CardCreateSchema.parse(req.body);
      const auth = getAuth(req);
      const card = await LandingService.createCard({
        sectionId: payload.sectionId,
        draftJson: payload.draftJson,
        actor: auth.id,
      });
      res.status(201).json(card);
    } catch (error) {
      console.error("Failed to create card:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create card" });
    }
  }
);

router.put(
  "/landing/cards/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const payload = CardUpdateSchema.parse(req.body);
      const auth = getAuth(req);
      const card = await LandingService.updateCard({
        id: req.params.id,
        payload,
        actor: auth.id,
      });
      res.json(card);
    } catch (error) {
      console.error("Failed to update card:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update card" });
    }
  }
);

router.put(
  "/landing/cards/reorder",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const payload = CardReorderSchema.parse(req.body);
      const auth = getAuth(req);
      await LandingService.reorderCards({
        sectionId: payload.sectionId,
        orders: payload.orders,
        actor: auth.id,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to reorder cards:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to reorder cards" });
    }
  }
);

router.post(
  "/landing/cards/:id/publish",
  requireRole(["WEBSITE_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const card = await LandingService.publishCard({
        id: req.params.id,
        actor: auth.id,
      });
      res.json(card);
    } catch (error) {
      console.error("Failed to publish card:", error);
      res.status(500).json({ message: "Failed to publish card" });
    }
  }
);

router.post(
  "/landing/cards/:id/archive",
  requireRole(["WEBSITE_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      const card = await LandingService.archiveCard({
        id: req.params.id,
        actor: auth.id,
      });
      res.json(card);
    } catch (error) {
      console.error("Failed to archive card:", error);
      res.status(500).json({ message: "Failed to archive card" });
    }
  }
);

router.delete(
  "/landing/cards/:id",
  requireRole(["WEBSITE_ADMIN"]),
  async (req, res) => {
    try {
      const auth = getAuth(req);
      await LandingService.deleteCard({ id: req.params.id, actor: auth.id });
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete card:", error);
      res.status(500).json({ message: "Failed to delete card" });
    }
  }
);

export default router;
