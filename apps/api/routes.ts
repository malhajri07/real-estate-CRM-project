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
import sequencesRoutes        from "./routes/sequences";
import billingRoutes          from "./routes/billing";
import supportRoutes          from "./routes/support";
import appointmentsRoutes     from "./routes/appointments";
import inquiriesRoutes        from "./routes/inquiries";
import auditLogsRoutes        from "./routes/audit-logs";

// ── Agent collaboration ──────────────────────────────────────────────────────
import brokerRequestsRoutes   from "./routes/broker-requests";
import nearbyPlacesRoutes     from "./routes/nearby-places";
import promotionsRoutes       from "./routes/promotions";
import commissionRoutes       from "./routes/commission";
import leadRoutingRoutes      from "./routes/lead-routing";
import clientPortalRoutes     from "./routes/client-portal";
import dealDocumentsRoutes    from "./routes/deal-documents";
import tenanciesRoutes        from "./routes/tenancies";
import inboxRoutes            from "./routes/inbox";
import customReportsRoutes    from "./routes/custom-reports";
import chatbotRoutes          from "./routes/chatbot";
import projectsRoutes         from "./routes/projects";
import maintenanceRoutes      from "./routes/maintenance";
import vendorsRoutes          from "./routes/vendors";
import feedbackRoutes         from "./routes/feedback";
import shortlistsRoutes       from "./routes/shortlists";
import subdivisionsRoutes     from "./routes/subdivisions";
import warrantiesRoutes       from "./routes/warranties";

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
import { apiRateLimit, authRateLimit } from "./src/middleware/rate-limit.middleware";
import { optionalAuth }      from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. MIDDLEWARE
  // ─────────────────────────────────────────────────────────────────────────────

  // Health check — before rate limiter so it's always reachable by load balancers
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  });

  // General API rate limiter (100 req/min per IP) — custom in-memory implementation
  app.use("/api/", apiRateLimit);

  // Locale detection middleware (runs on every request)
  app.use(localeMiddleware);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. AUTHENTICATION  /api/auth/*
  // ─────────────────────────────────────────────────────────────────────────────
  app.use("/api/auth/login", authRateLimit);
  app.use("/api/auth/register", authRateLimit);
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
  // Organization team routes (corp owner sees their agents)
  const orgTeamRoutes = (await import("./routes/org-team")).default;
  app.use("/api/org", orgTeamRoutes);
  app.use("/api/org/lead-routing", leadRoutingRoutes);
  app.use("/api/client", clientPortalRoutes);
  app.use("/api/tenancies", authenticateToken, tenanciesRoutes);

  app.use("/api/pool",           buyerPoolRoutes);
  app.use("/api/favorites",      favoritesRoutes);
  app.use("/api/messages",       messagesRoutes);
  app.use("/api/notifications",  notificationsRoutes);
  app.use("/api/campaigns",      campaignsRoutes);
  app.use("/api/sequences",     sequencesRoutes);
  app.use("/api/billing",        billingRoutes);
  app.use("/api/support",        supportRoutes);
  app.use("/api/appointments",   appointmentsRoutes);
  app.use("/api/inquiries",      inquiriesRoutes);
  app.use("/api/audit-logs",     authenticateToken, auditLogsRoutes);
  app.use("/api/broker-requests", brokerRequestsRoutes);
  app.use("/api/nearby-places",  nearbyPlacesRoutes);
  app.use("/api/promotions",     promotionsRoutes);
  app.use("/api/deals",          commissionRoutes);  // mounts under /api/deals/:dealId/commission
  app.use("/api/deals",          dealDocumentsRoutes);  // mounts under /api/deals/:dealId/documents
  app.use("/api/inbox",          inboxRoutes);
  app.use("/api/webhooks",       inboxRoutes);       // webhook handler at POST /api/webhooks/whatsapp
  app.use("/api/reports",        customReportsRoutes);  // POST /api/reports/custom, GET/POST /api/reports/saved
  app.use("/api/chatbot",        chatbotRoutes);        // public chatbot (no auth)
  app.use("/api/projects",       projectsRoutes);
  app.use("/api/maintenance",    maintenanceRoutes);
  app.use("/api/vendors",        vendorsRoutes);
  app.use("/api/feedback",       feedbackRoutes);
  app.use("/api/shortlists",    shortlistsRoutes);
  app.use("/api/subdivisions", subdivisionsRoutes);
  app.use("/api/warranties",   warrantiesRoutes);

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
  app.use("/api/rbac-admin", apiRateLimit, rbacAdminRoutes);

  // All CMS sub-modules grouped under a single /api/cms mount point
  const cmsRouter = express.Router();
  cmsRouter.use(cmsLandingRoutes);
  cmsRouter.use(cmsArticlesRoutes);
  cmsRouter.use(cmsMediaRoutes);
  cmsRouter.use(cmsSEORoutes);
  cmsRouter.use(cmsTemplatesRoutes);
  cmsRouter.use(cmsNavigationRoutes);
  app.use("/api/cms", apiRateLimit, cmsRouter);

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
