/**
 * routes.ts - Main Route Registration and Configuration
 * 
 * Location: apps/api/ → Core Application Files → routes.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * This file is the central hub for all API route registration. It:
 * - Imports all route modules from the ./routes/ directory
 * - Registers them with the Express application
 * - Sets up authentication and middleware
 * - Defines inline routes for specific functionality
 * - Handles CSV upload and processing for bulk data import
 * 
 * Route Structure:
 * - /api/auth/* - Authentication and user management
 * - /api/pool/* - Buyer pool and claims workflow (RBAC)
 * - /api/accounts/* - Account management
 * - /api/listings/* - Property listings (public and private)
 * - /api/locations/* - Geographic and location data
 * - /api/favorites/* - User favorites and saved items
 * - /api/inquiries/* - Property inquiries and messages
 * - /api/search/* - Search functionality
 * - /api/moderation/* - Content moderation
 * - /api/reports/* - Analytics and reporting
 * - /api/agencies/* - Agency and agent management
 * - /api/requests/* - General request handling
 * - /api/csv/* - CSV upload and processing
 * - / - Sitemap and SEO routes
 * 
 * Related Files:
 * - apps/api/routes/ - Individual route handler modules (26 files)
 * - apps/api/index.ts - Server entry point that calls this
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
/**
 * Uses Prisma-based storage for all database operations
 * This fixes the database connection issues caused by WebSocket connection attempts
 * to Neon database when using SQLite.
 * 
 * Dependencies: storage-prisma.ts for Prisma-based database operations
 * Routes affected: All routes that use storage
 * Pages affected: All pages that interact with data
 */
import { storage } from "./storage-prisma";

// Route module imports - Each handles specific functionality
import listingsRoutes from "./routes/listings";       // Property listings
import unverifiedListingsRoutes from "./routes/unverified-listings"; // Public unverified submissions (saves to property_listings table)
import marketingRequestRoutes from "./routes/marketing-requests"; // Marketing request marketplace
import locationsRoutes from "./routes/locations";     // Geographic data
import favoritesRoutes from "./routes/favorites";     // User favorites
import inquiriesRoutes from "./routes/inquiries";     // Property inquiries
import searchRoutes from "./routes/search";           // Search functionality
import moderationRoutes from "./routes/moderation";   // Content moderation
import reportsRoutes from "./routes/reports";         // Analytics reports
import agenciesRoutes from "./routes/agencies";       // Agency management
import requestsRoutes from "./routes/requests";       // General requests
import populateRoutes from "./routes/populate";       // Data population
import sitemapRoutes from "./routes/sitemap";         // SEO sitemap
import authRoutes from "./routes/auth";               // Authentication routes (Prisma-backed)
import buyerPoolRoutes from "./routes/buyer-pool";    // Buyer pool (RBAC)
import knowledgeBaseRoutes from "./routes/knowledge-base"; // Agent Knowledge Base

import rbacAdminRoutes from "./routes/rbac-admin";    // RBAC admin dashboard
import propertyCategoriesRoutes from "./routes/property-categories"; // Property categories dimension table
import propertyTypesRoutes from "./routes/property-types"; // Property types (related to categories)
import cmsLandingRoutes from "./routes/cms-landing";
import communityRoutes from "./routes/community";
import cmsArticlesRoutes from "./routes/cms-articles";
import cmsMediaRoutes from "./routes/cms-media";
import cmsSEORoutes from "./routes/cms-seo";
import cmsTemplatesRoutes from "./routes/cms-templates";
import cmsNavigationRoutes from "./routes/cms-navigation";
import leadsRoutes from "./routes/leads";
import dealsRoutes from "./routes/deals";
import activitiesRoutes from "./routes/activities";
import messagesRoutes from "./routes/messages";
import notificationsRoutes from "./routes/notifications";
import campaignsRoutes from "./routes/campaigns";
import landingRoutes from "./routes/landing";
import csvRoutes from "./routes/csv";
import billingRoutes from "./routes/billing";
import supportRoutes from "./routes/support";
import appointmentsRoutes from "./routes/appointments";
import auditLogsRoutes from "./routes/audit-logs";
import { JWT_SECRET as getJwtSecret } from "./config/env";
import { localeMiddleware } from "./src/middleware/locale";

// Force server restart for dashboard routes catch


/**
 * registerRoutes - Main route registration function
 * 
 * This function registers all API routes with the Express application.
 * It returns an HTTP server instance for use in the main server setup.
 * 
 * Dependencies:
 * - registerRoleBasedRoutes() from ./roleRoutes.ts - RBAC system routes
 * - All route modules from ./routes/ directory
 * 
 * Route Registration Order (important for middleware and precedence):
 * 1. RBAC system routes (role-based access control)
 * 2. Authentication routes
 * 3. Core business logic routes
 * 4. Utility and support routes
 * 5. Catch-all routes (sitemap, etc.)
 */
export async function registerRoutes(app: Express): Promise<Server> {
  /*
   * RBAC System Routes removed (legacy). 
   * RBAC logic is now handled via rbacAdminRoutes and explicit middleware checks.
   */

  /**
   * Rate limiting for authentication endpoints
   * Import from index.ts or define here
   */
  const rateLimit = (await import('express-rate-limit')).default;

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increased to 100 attempts per 15 minutes for debugging
    message: {
      error: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for localhost in development
      const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || !req.ip;
      return process.env.NODE_ENV === 'development' && isLocalhost;
    }
  });

  /**
   * Authentication Routes - /api/auth/*
   * 
   * Handles user authentication and session management:
   * - POST /api/auth/login - User login
   * - POST /api/auth/register - User registration
   * - GET /api/auth/me - Get current user info
   * - POST /api/auth/logout - User logout
   * 
   * Dependencies: authRoutes from ./routes/auth.ts
   * Pages affected: Login page, RBAC login page, user profile
   */
  // General API rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for development/admin usage
    message: {
      error: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks and CMS admin routes
      if (req.path === '/health') return true;
      if (req.path.startsWith('/api/cms/')) return true; // CMS routes need more requests
      if (req.path.startsWith('/api/rbac-admin/')) return true; // Admin dashboard needs more requests
      return false;
    },
  });

  // Apply general rate limiting to all API routes
  app.use("/api/", apiLimiter);

  // Apply locale middleware globally
  app.use(localeMiddleware);

  // Apply rate limiting to authentication endpoints
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth", authRoutes);

  /**
   * Buyer Pool Routes - /api/pool/*
   * 
   * Handles buyer pool and claims workflow (RBAC feature):
   * - GET /api/pool/buyers - Search buyer requests
   * - POST /api/pool/buyers/:id/claim - Claim a buyer request
   * - POST /api/pool/buyers/:id/release - Release a claim
   * 
   * Dependencies: buyerPoolRoutes from ./routes/buyer-pool.ts
   * Pages affected: Buyer pool search, lead management, claims workflow
   */
  app.use("/api/pool", buyerPoolRoutes);
  app.use("/api/pool", buyerPoolRoutes);
  app.use("/api/community", communityRoutes);
  app.use("/api/knowledge", knowledgeBaseRoutes);

  // CMS Routes
  app.use("/api/cms", cmsLandingRoutes);
  app.use("/api/cms", cmsArticlesRoutes);
  app.use("/api/cms", cmsMediaRoutes);
  app.use("/api/cms", cmsSEORoutes);
  app.use("/api/cms", cmsTemplatesRoutes);
  app.use("/api/cms", cmsNavigationRoutes);

  app.use("/api/unverified-listings", unverifiedListingsRoutes); // Saves to property_listings table
  app.use("/api/property-categories", propertyCategoriesRoutes); // Property categories dimension table
  app.use("/api/property-types", propertyTypesRoutes); // Property types (filtered by category)
  app.use("/api/marketing-requests", marketingRequestRoutes);

  /**
   * RBAC Admin Routes - /api/rbac-admin/*
   * 
   * Handles RBAC dashboard functionality:
   * - GET /api/rbac-admin/stats - System statistics
   * - GET /api/rbac-admin/activities - Recent activities
   * - GET /api/rbac-admin/users - User management
   * - POST /api/rbac-admin/users - Create user
   * - PUT /api/rbac-admin/users/:id - Update user
   * - DELETE /api/rbac-admin/users/:id - Delete user
   * - GET /api/rbac-admin/organizations - Organization management
   * - POST /api/rbac-admin/organizations - Create organization
   * - GET /api/rbac-admin/roles - Role and permission management
   * 
   * Dependencies: rbacAdminRoutes from ./routes/rbac-admin.ts
   * Pages affected: RBAC dashboard, user management, organization management
   */
  app.use("/api/rbac-admin", rbacAdminRoutes);

  /**
   * Property Listings Routes - /api/listings/*
   * 
   * Handles property listings (public and private):
   * - GET /api/listings - Get all listings
   * - GET /api/listings/featured - Get featured listings
   * - GET /api/listings/:id - Get specific listing
   * - POST /api/listings - Create new listing
   * - PUT /api/listings/:id - Update listing
   * - DELETE /api/listings/:id - Delete listing
   * 
   * Dependencies: listingsRoutes from ./routes/listings.ts
   * Pages affected: Listings page, property detail page, post listing page
   */
  app.use("/api/listings", listingsRoutes);

  /**
   * Location Routes - /api/locations/*
   * 
   * Handles geographic and location data:
   * - GET /api/locations/cities - Get all cities
   * - GET /api/locations/districts - Get districts by city
   * - GET /api/locations/regions - Get all regions
   * 
   * Dependencies: locationsRoutes from ./routes/locations.ts
   * Pages affected: Property search, location filters, address forms
   */
  app.use("/api/locations", locationsRoutes);

  /**
   * User Favorites Routes - /api/favorites/*
   * 
   * Handles user favorites and saved items:
   * - GET /api/favorites - Get user favorites
   * - POST /api/favorites - Add to favorites
   * - DELETE /api/favorites/:id - Remove from favorites
   * 
   * Dependencies: favoritesRoutes from ./routes/favorites.ts
   * Pages affected: Favorites page, property cards, saved searches
   */
  app.use("/api/favorites", favoritesRoutes);

  /**
   * Property Inquiries Routes - /api/inquiries/*
   * 
   * Handles property inquiries and messages:
   * - GET /api/inquiries - Get user inquiries
   * - POST /api/inquiries - Create new inquiry
   * - PUT /api/inquiries/:id - Update inquiry
   * 
   * Dependencies: inquiriesRoutes from ./routes/inquiries.ts
   * Pages affected: Property detail page, inquiries management, messaging
   */
  app.use("/api/inquiries", inquiriesRoutes);

  /**
   * Search Routes - /api/search/*
   * 
   * Handles search functionality:
   * - GET /api/search/properties - Search properties
   * - GET /api/search/agencies - Search agencies
   * - GET /api/search/agents - Search agents
   * 
   * Dependencies: searchRoutes from ./routes/search.ts
   * Pages affected: Search properties page, search results, filters
   */
  app.use("/api/search", searchRoutes);

  /**
   * Content Moderation Routes - /api/moderation/*
   * 
   * Handles content moderation:
   * - GET /api/moderation/queue - Get moderation queue
   * - POST /api/moderation/approve - Approve content
   * - POST /api/moderation/reject - Reject content
   * 
   * Dependencies: moderationRoutes from ./routes/moderation.ts
   * Pages affected: Moderation page, admin content review
   */
  app.use("/api/moderation", moderationRoutes);

  /**
   * Reports Routes - /api/reports/*
   * 
   * Handles analytics and reporting:
   * - GET /api/reports/sales - Sales reports
   * - GET /api/reports/performance - Performance reports
   * - GET /api/reports/analytics - Analytics data
   * 
   * Dependencies: reportsRoutes from ./routes/reports.ts
   * Pages affected: Reports page, analytics dashboard, performance metrics
   */
  app.use("/api/reports", reportsRoutes);

  /**
   * Agency Management Routes - /api/agencies/*
   * 
   * Handles agency and agent management:
   * - GET /api/agencies - Get all agencies
   * - GET /api/agencies/:id - Get specific agency
   * - GET /api/agencies/:id/agents - Get agency agents
   * 
   * Dependencies: agenciesRoutes from ./routes/agencies.ts
   * Pages affected: Agencies page, agency detail page, agent profiles
   */
  app.use("/api/agencies", agenciesRoutes);

  /**
   * General Request Routes - /api/requests/*
   * 
   * Handles general request processing:
   * - GET /api/requests - Get all requests
   * - POST /api/requests - Create new request
   * - PUT /api/requests/:id - Update request
   * 
   * Dependencies: requestsRoutes from ./routes/requests.ts
   * Pages affected: Request management, admin requests page
   */
  app.use("/api/requests", requestsRoutes);


  /**
   * Data Population Routes - /api/*
   * 
   * Handles data seeding and population:
   * - POST /api/populate - Populate database with sample data
   * - POST /api/seed - Seed database
   * 
   * Dependencies: populateRoutes from ./routes/populate.ts
   * Pages affected: Admin data management, development tools
   */
  app.use("/api", populateRoutes);

  /**
   * Deals Routes - /api/deals/*
   */
  app.use("/api/deals", dealsRoutes);

  /**
   * Activities Routes - /api/activities/*
   */
  app.use("/api/activities", activitiesRoutes);

  /**
   * Messages Routes - /api/messages/*
   */
  app.use("/api/messages", messagesRoutes);

  /**
   * Notifications Routes - /api/notifications/*
   */
  app.use("/api/notifications", notificationsRoutes);

  /**
   * Campaigns Routes - /api/campaigns/*
   */
  app.use("/api/campaigns", campaignsRoutes);

  /**
   * CSV Routes - /api/csv/*
   */
  app.use("/api/csv", csvRoutes);

  /**
   * Billing Routes - /api/billing/*
   */
  app.use("/api/billing", billingRoutes);

  /**
   * Support Tickets Routes - /api/support/*
   */
  app.use("/api/support", supportRoutes);

  /**
   * Appointments Routes - /api/appointments/*
   */
  app.use("/api/appointments", appointmentsRoutes);

  /**
   * Audit Logs Routes - /api/audit-logs/*
   */
  app.use("/api/audit-logs", auditLogsRoutes);


  /**
   * Public Landing Page Routes - /api/landing/*
   */
  app.use("/api/landing", landingRoutes);

  // Preview route for landing page
  app.use("/preview/landing", landingRoutes);

  /**
   * Health Check Endpoint - /health
   * 
   * Provides health status for monitoring and orchestration
   */
  app.get("/health", async (req, res) => {
    const checks: Record<string, any> = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
    };

    try {
      // Check database connection
      const { prisma } = await import('./prismaClient');
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok' };
    } catch (error) {
      checks.database = { status: 'error', error: (error as Error).message };
    }

    // Check Redis if configured
    if (process.env.REDIS_URL) {
      try {
        const Redis = (await import('ioredis')).default;
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
        redis.disconnect();
        checks.redis = { status: 'ok' };
      } catch (error) {
        checks.redis = { status: 'error', error: (error as Error).message };
      }
    } else {
      checks.redis = { status: 'not_configured' };
    }

    const healthy = checks.database?.status === 'ok';
    res.status(healthy ? 200 : 503).json(checks);
  });

  /**
   * Sitemap Routes - /
   * 
   * Handles SEO and sitemap generation:
   * - GET /sitemap.xml - Generate sitemap
   * - GET /robots.txt - Robots.txt file
   * 
   * Dependencies: sitemapRoutes from ./routes/sitemap.ts
   * Pages affected: SEO, search engine indexing
   */
  app.use("/", sitemapRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
