/**
 * routes.ts - Main Route Registration and Configuration
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
 * - /api/media/* - File upload and media management
 * - /api/requests/* - General request handling
 * - /api/analytics/* - Analytics and KPI data
 * - /api/csv/* - CSV upload and processing
 * - / - Sitemap and SEO routes
 */

import type { Express } from "express";
import jwt from 'jsonwebtoken';
import { hasPermission, getVisibilityScope } from './rbac-policy';
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
// Removed unused schema imports - using Prisma schema instead
import { z } from "zod";
import { setupMockAuth, isAuthenticated } from "./authMock";
// import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage"; // Removed - Replit-specific
// import { registerRoleBasedRoutes } from "./roleRoutes"; // Temporarily disabled - requires migration to Prisma

// Route module imports - Each handles specific functionality
// import accountRoutes from "./routes/accounts";        // Account management - Temporarily disabled
import listingsRoutes from "./routes/listings";       // Property listings
import unverifiedListingsRoutes from "./routes/unverified-listings"; // Public unverified submissions
import marketingRequestRoutes from "./routes/marketing-requests"; // Marketing request marketplace
import locationsRoutes from "./routes/locations";     // Geographic data
import favoritesRoutes from "./routes/favorites";     // User favorites
import inquiriesRoutes from "./routes/inquiries";     // Property inquiries
import searchRoutes from "./routes/search";           // Search functionality
import moderationRoutes from "./routes/moderation";   // Content moderation
import reportsRoutes from "./routes/reports";         // Analytics reports
import agenciesRoutes from "./routes/agencies";       // Agency management
// import mediaRoutes from "./routes/media";             // Media uploads - Temporarily disabled (Replit-specific)
import requestsRoutes from "./routes/requests";       // General requests
import populateRoutes from "./routes/populate";       // Data population
import sitemapRoutes from "./routes/sitemap";         // SEO sitemap
// import authRoutes from "./routes/auth";               // Authentication - Temporarily disabled
import simpleAuthRoutes from "./routes/simple-auth";  // Simple authentication
import buyerPoolRoutes from "./routes/buyer-pool";    // Buyer pool (RBAC)
import cmsRoutes from "./routes/cms";                 // Custom CMS (replaces Strapi)
import analyticsRoutes from "./src/routes/analytics"; // Analytics data
import rbacAdminRoutes from "./routes/rbac-admin";    // RBAC admin dashboard

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
  // Disabled mock authentication - using real database authentication
  // await setupMockAuth(app);

  /**
   * RBAC System Routes
   * 
   * Registers role-based access control routes for:
   * - User role management
   * - Permission checking
   * - Organization management
   * 
   * Dependencies: registerRoleBasedRoutes() from ./roleRoutes.ts
   * Pages affected: RBAC dashboard, user management, admin settings
   */
  // registerRoleBasedRoutes(app); // Temporarily disabled - requires migration to Prisma

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
  // app.use("/api/auth", authRoutes); // Temporarily disabled due to import errors
  app.use("/api/auth", simpleAuthRoutes); // Simple authentication system

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

  /**
   * CMS Routes - /api/cms/*
   * 
   * Handles content management system functionality including:
   * - GET /api/cms/landing-page - Get landing page content
   * - PUT /api/cms/landing-page - Update landing page content
   * - GET /api/cms/pricing-plans - Get pricing plans
   * - POST /api/cms/pricing-plans - Create pricing plan
   * - PUT /api/cms/pricing-plans/:id - Update pricing plan
   * - DELETE /api/cms/pricing-plans/:id - Delete pricing plan
   * 
   * Dependencies: cmsRoutes from ./routes/cms.ts
   * Pages affected: Landing page, CMS admin panel
   * Status: Custom CMS replacing Strapi
   */
  app.use("/api/cms", cmsRoutes);
  app.use("/api/unverified-listings", unverifiedListingsRoutes);
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
   * Account Management Routes - /api/accounts/*
   * 
   * Handles user account management:
   * - GET /api/accounts/profile - Get user profile
   * - PUT /api/accounts/profile - Update user profile
   * - POST /api/accounts/change-password - Change password
   * 
   * Dependencies: accountRoutes from ./routes/accounts.ts
   * Pages affected: User settings, profile management, account settings
   * Status: Temporarily disabled - requires migration to Prisma
   */
  // app.use("/api/accounts", accountRoutes);

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
   * Media Upload Routes - /api/media/*
   * 
   * Handles file upload and media management:
   * - POST /api/media/upload - Upload files
   * - GET /api/media/:id - Get media file
   * - DELETE /api/media/:id - Delete media file
   * 
   * Dependencies: mediaRoutes from ./routes/media.ts
   * Pages affected: Property images, profile pictures, document uploads
   * Status: Temporarily disabled - requires Replit object storage replacement
   */
  // app.use("/api/media", mediaRoutes);

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
   * Analytics Routes - /api/analytics/*
   * 
   * Handles analytics and KPI data:
   * - GET /api/analytics/overview - Get overview analytics
   * - GET /api/analytics/comprehensive - Get comprehensive analytics
   * - GET /api/analytics/kpis - Get KPI data
   * 
   * Dependencies: analyticsRoutes from ./src/routes/analytics.ts
   * Pages affected: Analytics dashboard, RBAC dashboard, KPI displays
   */
  app.use("/api/analytics", analyticsRoutes);

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

  /**
   * Inline Routes - Additional functionality not in separate modules
   */

  /**
   * User Data Route - GET /api/auth/user
   * 
   * Gets detailed user information for authenticated users.
   * 
   * Dependencies: storage.getUser() from ./storage.ts
   * Pages affected: User profile, account settings, user management
   */
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  /**
   * CSV Upload URL Route - POST /api/csv/upload-url
   * 
   * Generates a secure upload URL for CSV file uploads.
   * Used for bulk lead import functionality.
   * 
   * Dependencies: Local file system storage (Replit object storage removed)
   * Pages affected: CSV uploader component, bulk import functionality
   * Status: Simplified to use local file system instead of Replit object storage
   */
  app.post("/api/csv/upload-url", async (req, res) => {
    try {
      // Return a simple upload endpoint for local file system
      res.json({ 
        uploadURL: "/api/csv/upload",
        message: "Use multipart/form-data to upload CSV files directly"
      });
    } catch (error) {
      console.error("Error getting CSV upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/csv/process-leads", async (req, res) => {
    try {
      const { csvUrl } = req.body;

      if (!csvUrl) {
        return res.status(400).json({ error: "CSV URL is required" });
      }

      // Extract object path from URL
      const url = new URL(csvUrl);
      const pathParts = url.pathname.split('/');
      const objectPath = pathParts.slice(2).join('/'); // Remove bucket name

      // TODO: Implement local file system CSV processing
      // For now, return an error indicating this needs to be implemented
      return res.status(501).json({ error: "CSV processing not implemented - requires local file system implementation" });

      // Parse CSV content
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return res.status(400).json({ error: "ملف CSV فارغ" });
      }

      // Assume first line is header
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      const results = {
        total: dataLines.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process each line
      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const leadData: any = {};

          // Map CSV columns to lead fields
          headers.forEach((header, index) => {
            const value = values[index] || '';

            // Map common column names (case insensitive)
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('firstname') || lowerHeader.includes('first_name') || lowerHeader === 'الاسم الأول') {
              leadData.firstName = value;
            } else if (lowerHeader.includes('lastname') || lowerHeader.includes('last_name') || lowerHeader === 'الاسم الأخير') {
              leadData.lastName = value;
            } else if (lowerHeader.includes('email') || lowerHeader === 'البريد الإلكتروني') {
              leadData.email = value;
            } else if (lowerHeader.includes('phone') || lowerHeader === 'الهاتف') {
              leadData.phone = value;
            } else if (lowerHeader.includes('budget') || lowerHeader === 'الميزانية') {
              leadData.budgetRange = value;
            } else if (lowerHeader.includes('source') || lowerHeader === 'المصدر') {
              leadData.leadSource = value;
            } else if (lowerHeader.includes('interest') || lowerHeader === 'نوع الاهتمام') {
              leadData.interestType = value;
            } else if (lowerHeader.includes('notes') || lowerHeader === 'ملاحظات') {
              leadData.notes = value;
            }
          });

          // Validate required fields
          if (!leadData.firstName || !leadData.lastName || !leadData.email) {
            results.errors.push(`السطر ${i + 2}: مطلوب الاسم الأول والأخير والبريد الإلكتروني`);
            results.failed++;
            continue;
          }

          // Set defaults
          leadData.status = leadData.status || "new";
          leadData.leadSource = leadData.leadSource || "csv_import";
          leadData.interestType = leadData.interestType || "buying";

          // Validate using schema
          const validatedData = insertLeadSchema.parse(leadData);

          // Create lead
          await storage.createLead(validatedData);
          results.successful++;

        } catch (error) {
          console.error(`Error processing line ${i + 2}:`, error);
          results.errors.push(`السطر ${i + 2}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
          results.failed++;
        }
      }

      res.json({
        success: true,
        message: `تم معالجة ${results.total} سطر. نجح: ${results.successful}, فشل: ${results.failed}`,
        results
      });

    } catch (error) {
      console.error("Error processing CSV:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "ملف CSV غير موجود" });
      }
      res.status(500).json({ error: "خطأ في معالجة ملف CSV" });
    }
  });

  // Lead routes
  // Helper: decode roles/org from Authorization header (simple-auth JWT)
  function decodeAuth(req: any): { id?: string; roles: string[]; organizationId?: string } {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return { roles: [] };
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      let roles: string[] = [];
      try { roles = JSON.parse(decoded.roles || '[]'); } catch { if (decoded.roles) roles = [decoded.roles]; }
      return { id: decoded.userId, roles, organizationId: decoded.organizationId };
    } catch { return { roles: [] }; }
  }

  const requireAnyPerm = (perms: string[]) => (req: any, res: any, next: any) => {
    const auth = decodeAuth(req);
    if (perms.some(p => hasPermission(auth.roles, p as any))) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };

  app.get("/api/leads", async (req, res) => {
    try {
      const auth = decodeAuth(req);
      const leads = await storage.getAllLeads();
      const scope = getVisibilityScope(auth.roles);
      let filtered = leads;
      if (scope === 'corporate') {
        filtered = leads.filter((l: any) => l.agent?.organizationId && l.agent.organizationId === auth.organizationId);
      } else if (scope === 'self') {
        filtered = leads.filter((l: any) => l.agentId === auth.id);
      }
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const leads = await storage.searchLeads(query);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to search leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", requireAnyPerm(['requests:manage:all','requests:manage:corporate','requests:pool:pickup']), async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", requireAnyPerm(['requests:manage:all','requests:manage:corporate','requests:pool:pickup']), async (req, res) => {
    try {
      const validatedData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, validatedData);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", requireAnyPerm(['requests:manage:all','requests:manage:corporate','requests:pool:pickup']), async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Property routes
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Public properties for map (no authentication required)
  app.get("/api/properties/map", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      // Filter to only include active properties with coordinates and essential info
      const mapProperties = properties
        .filter(p => p.status === 'active' && p.latitude && p.longitude)
        .map(p => ({
          id: p.id,
          title: p.title,
          address: p.address,
          city: p.city,
          price: p.price,
          propertyCategory: p.propertyCategory,
          propertyType: p.propertyType,
          latitude: p.latitude,
          longitude: p.longitude,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          squareFeet: p.squareFeet,
          status: p.status
        }));
      res.json(mapProperties);
    } catch (error) {
      console.error("Error fetching properties for map:", error);
      res.status(500).json({ message: "Failed to fetch properties for map" });
    }
  });

  app.get("/api/properties/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const properties = await storage.searchProperties(query);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(req.params.id, validatedData);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProperty(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Deal routes
  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.getAllDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/stage/:stage", async (req, res) => {
    try {
      const deals = await storage.getDealsByStage(req.params.stage);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals by stage" });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.put("/api/deals/:id", async (req, res) => {
    try {
      const validatedData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(req.params.id, validatedData);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  // Activity routes
  app.get("/api/activities/lead/:leadId", async (req, res) => {
    try {
      const activities = await storage.getActivitiesByLead(req.params.leadId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/today", async (req, res) => {
    try {
      const activities = await storage.getTodaysActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      const properties = await storage.getAllProperties();
      const deals = await storage.getAllDeals();

      const activeDeals = deals.filter(deal => !['closed', 'lost'].includes(deal.stage));
      const closedDeals = deals.filter(deal => deal.stage === 'closed');

      const monthlyRevenue = closedDeals.reduce((sum, deal) => {
        const commission = deal.commission ? parseFloat(deal.commission) : 0;
        return sum + commission;
      }, 0);

      const metrics = {
        totalLeads: leads.length,
        activeProperties: properties.filter(p => p.status === 'active').length,
        dealsInPipeline: activeDeals.length,
        monthlyRevenue: monthlyRevenue,
        pipelineByStage: {
          lead: deals.filter(d => d.stage === 'lead').length,
          qualified: deals.filter(d => d.stage === 'qualified').length,
          showing: deals.filter(d => d.stage === 'showing').length,
          negotiation: deals.filter(d => d.stage === 'negotiation').length,
          closed: deals.filter(d => d.stage === 'closed').length,
        }
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/lead/:leadId", async (req, res) => {
    try {
      const { leadId } = req.params;
      const messages = await storage.getMessagesByLead(leadId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages for lead" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);

      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create message" });
      }
    }
  });

  // Notifications API
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Campaigns API
  app.post("/api/campaigns", async (req, res) => {
    try {
      const { title, message, type, leadIds } = req.body;

      if (!title || !message || !type || !leadIds || !Array.isArray(leadIds)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const campaign = {
        id: Date.now().toString(),
        title,
        message,
        type,
        leadIds,
        status: "sent",
        sentAt: new Date().toISOString(),
        recipientCount: leadIds.length
      };

      // For now, just return success - storage methods will be added
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Saudi Regions API
  app.get("/api/saudi-regions", async (req, res) => {
    try {
      const regions = await storage.getAllSaudiRegions();
      res.json(regions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Saudi regions" });
    }
  });

  app.post("/api/saudi-regions/seed", async (req, res) => {
    try {
      const regions = await storage.seedSaudiRegions();
      res.json({
        message: "Saudi regions seeded successfully",
        count: regions.length,
        regions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed Saudi regions" });
    }
  });

  // Saudi Cities API
  app.get("/api/saudi-cities", async (req, res) => {
    try {
      const cities = await storage.getAllSaudiCities();
      res.json(cities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Saudi cities" });
    }
  });

  app.get("/api/saudi-cities/region/:regionCode", async (req, res) => {
    try {
      const cities = await storage.getCitiesByRegion(req.params.regionCode);
      res.json(cities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cities for region" });
    }
  });

  app.post("/api/saudi-cities/seed", async (req, res) => {
    try {
      const cities = await storage.seedSaudiCities();
      res.json({
        message: "Saudi cities seeded successfully",
        count: cities.length,
        cities
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed Saudi cities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
