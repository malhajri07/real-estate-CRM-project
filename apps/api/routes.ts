/**
 * routes.ts — Central Route Registration
 *
 * Sections (in order):
 *   1. Middleware setup  (health, rate limiters, locale)
 *   2. Authentication    (/api/auth)
 *   3. Public routes     (no auth required)
 *   4. Authenticated     (auth inside handlers)
 *   5. Org-scoped        (auth + requireOrg enforced at mount)
 *   6. Admin             (rate-limited, admin check inside handlers)
 *   7. SEO / utility     (sitemap, robots)
 */

import express, { type Express } from "express";
import { createServer, type Server } from "http";

// ── Public domain routes ─────────────────────────────────────────────────────
import authRoutes             from "./routes/auth";
import listingsRoutes         from "./routes/listings";
import locationsRoutes        from "./routes/locations";
import searchRoutes           from "./routes/search";
import agenciesRoutes         from "./routes/agencies";
import propertyCategoriesRoutes from "./routes/property-categories";
import propertyTypesRoutes    from "./routes/property-types";
import unverifiedListingsRoutes from "./routes/unverified-listings";
import marketingRequestRoutes from "./routes/marketing-requests";
import requestsRoutes         from "./routes/requests";
import landingRoutes          from "./routes/landing";
import communityRoutes        from "./routes/community";
import knowledgeBaseRoutes    from "./routes/knowledge-base";

// ── Authenticated domain routes ───────────────────────────────────────────────
import buyerPoolRoutes        from "./routes/buyer-pool";
import favoritesRoutes        from "./routes/favorites";
import messagesRoutes         from "./routes/messages";
import notificationsRoutes    from "./routes/notifications";
import campaignsRoutes        from "./routes/campaigns";
import billingRoutes          from "./routes/billing";
import supportRoutes          from "./routes/support";
import appointmentsRoutes     from "./routes/appointments";
import inquiriesRoutes        from "./routes/inquiries";
import auditLogsRoutes        from "./routes/audit-logs";

// ── Org-scoped domain routes (auth + org enforced at mount) ───────────────────
import leadsRoutes            from "./routes/leads";
import dealsRoutes            from "./routes/deals";
import activitiesRoutes       from "./routes/activities";
import csvRoutes              from "./routes/csv";

// ── Admin-only domain routes ──────────────────────────────────────────────────
import rbacAdminRoutes        from "./routes/rbac-admin";
import cmsLandingRoutes       from "./routes/cms-landing";
import cmsArticlesRoutes      from "./routes/cms-articles";
import cmsMediaRoutes         from "./routes/cms-media";
import cmsSEORoutes           from "./routes/cms-seo";
import cmsTemplatesRoutes     from "./routes/cms-templates";
import cmsNavigationRoutes    from "./routes/cms-navigation";
import moderationRoutes       from "./routes/moderation";
import reportsRoutes          from "./routes/reports";

// ── SEO ───────────────────────────────────────────────────────────────────────
import sitemapRoutes          from "./routes/sitemap";

// ── Middleware ────────────────────────────────────────────────────────────────
import { localeMiddleware }   from "./src/middleware/locale";
import { requireOrg, injectOrgFilter } from "./src/middleware/org-isolation.middleware";
import { authenticateToken }  from "./src/middleware/auth.middleware";
import { optionalAuth }      from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const rateLimit = (await import("express-rate-limit")).default;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. MIDDLEWARE
  // ─────────────────────────────────────────────────────────────────────────────

  // Health check — before rate limiter so it's always reachable by load balancers
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  });

  // General API rate limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 1000 : 100,
    message: { error: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health",
  });
  app.use("/api/", apiLimiter);

  // Strict limiter for auth endpoints (brute-force protection)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { error: "TOO_MANY_REQUESTS", message: "Too many login attempts, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const ip = req.ip ?? "";
      return process.env.NODE_ENV === "development" &&
        (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || !ip);
    },
  });

  // Stricter limiter for admin + CMS endpoints
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 500 : 50,
    message: { error: "TOO_MANY_REQUESTS", message: "Too many admin requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Locale detection middleware (runs on every request)
  app.use(localeMiddleware);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. AUTHENTICATION  /api/auth/*
  // ─────────────────────────────────────────────────────────────────────────────
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth", authRoutes);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PUBLIC ROUTES  (no authentication required)
  // ─────────────────────────────────────────────────────────────────────────────
  app.use("/api/listings",           listingsRoutes);
  app.use("/api/locations",          locationsRoutes);
  app.use("/api/search",             searchRoutes);
  app.use("/api/property-categories", propertyCategoriesRoutes);
  app.use("/api/property-types",     propertyTypesRoutes);
  app.use("/api/agencies",           agenciesRoutes);
  app.use("/api/unverified-listings", unverifiedListingsRoutes);
  app.use("/api/marketing-requests", optionalAuth, marketingRequestRoutes);
  app.use("/api/requests",           requestsRoutes);
  app.use("/api/landing",            landingRoutes);
  app.use("/preview/landing",        landingRoutes);   // CMS preview (same handler)
  app.use("/api/community",          communityRoutes);
  app.use("/api/knowledge-base",     knowledgeBaseRoutes);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. AUTHENTICATED ROUTES  (auth enforced inside each handler)
  // ─────────────────────────────────────────────────────────────────────────────
  app.use("/api/pool",           buyerPoolRoutes);
  app.use("/api/favorites",      favoritesRoutes);
  app.use("/api/messages",       messagesRoutes);
  app.use("/api/notifications",  notificationsRoutes);
  app.use("/api/campaigns",      campaignsRoutes);
  app.use("/api/billing",        billingRoutes);
  app.use("/api/support",        supportRoutes);
  app.use("/api/appointments",   appointmentsRoutes);
  app.use("/api/inquiries",      inquiriesRoutes);
  app.use("/api/audit-logs",     authenticateToken, auditLogsRoutes);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. ORG-SCOPED ROUTES  (authenticateToken + requireOrg enforced at mount)
  // ─────────────────────────────────────────────────────────────────────────────
  app.use("/api/leads",      authenticateToken, requireOrg, injectOrgFilter, leadsRoutes);
  app.use("/api/deals",      authenticateToken, requireOrg, injectOrgFilter, dealsRoutes);
  app.use("/api/activities", authenticateToken, requireOrg, injectOrgFilter, activitiesRoutes);
  app.use("/api/csv",        authenticateToken, requireOrg, csvRoutes);

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. ADMIN ROUTES  (rate-limited; admin check enforced inside handlers)
  // ─────────────────────────────────────────────────────────────────────────────
  app.use("/api/rbac-admin", adminLimiter, rbacAdminRoutes);

  // All CMS sub-modules grouped under a single /api/cms mount point
  const cmsRouter = express.Router();
  cmsRouter.use(cmsLandingRoutes);
  cmsRouter.use(cmsArticlesRoutes);
  cmsRouter.use(cmsMediaRoutes);
  cmsRouter.use(cmsSEORoutes);
  cmsRouter.use(cmsTemplatesRoutes);
  cmsRouter.use(cmsNavigationRoutes);
  app.use("/api/cms", adminLimiter, cmsRouter);

  app.use("/api/moderation", moderationRoutes);
  app.use("/api/reports",    reportsRoutes);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. SEO + DEEP HEALTH CHECK
  // ─────────────────────────────────────────────────────────────────────────────

  // Deep health check — probes database and Redis
  app.get("/health", async (_req, res) => {
    const checks: Record<string, unknown> = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    try {
      const { prisma } = await import("./prismaClient");
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok" };
    } catch (error) {
      checks.database = { status: "error", error: (error as Error).message };
    }

    if (process.env.REDIS_URL) {
      try {
        const Redis = (await import("ioredis")).default;
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
        redis.disconnect();
        checks.redis = { status: "ok" };
      } catch (error) {
        checks.redis = { status: "error", error: (error as Error).message };
      }
    } else {
      checks.redis = { status: "not_configured" };
    }

    const healthy = (checks.database as { status: string }).status === "ok";
    res.status(healthy ? 200 : 503).json(checks);
  });

  app.use("/", sitemapRoutes);

  return createServer(app);
}
