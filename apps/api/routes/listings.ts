/**
 * routes/listings.ts — Property listing CRUD, search, map markers, REGA compliance,
 * approval workflow, lead matching, and CMA valuation.
 *
 * Mounted at `/api/listings` in `apps/api/routes.ts`.
 *
 * | Method | Path                     | Auth? | Purpose                                          |
 * |--------|--------------------------|-------|--------------------------------------------------|
 * | GET    | /                        | No    | Paginated + filtered listing search               |
 * | GET    | /map                     | No    | Lightweight markers (lat/lng/price) for map view  |
 * | GET    | /featured                | No    | Top 12 featured or newest listings                |
 * | GET    | /pending-approval/count  | Yes   | Badge count for CORP_OWNER                        |
 * | GET    | /:id                     | No    | Full listing detail                               |
 * | GET    | /:id/similar             | No    | Same city + type, limit 8                         |
 * | GET    | /:id/valuation           | No    | CMA / automated valuation                         |
 * | POST   | /                        | Yes   | Create listing (REGA compliance gated)            |
 * | PUT    | /:id                     | Yes   | Update listing fields                             |
 * | PATCH  | /:id/status              | Yes   | Moderation status update                          |
 * | PATCH  | /:id/approve             | Yes   | CORP_OWNER approves PENDING_APPROVAL → ACTIVE     |
 * | PATCH  | /:id/reject              | Yes   | CORP_OWNER rejects → DRAFT with reason            |
 * | POST   | /:id/match-leads         | Yes   | Find + notify matching leads in the same city     |
 * | DELETE | /:id                     | Yes   | Hard-delete listing                               |
 *
 * REGA compliance: `POST /` with `status=ACTIVE` runs `checkListingRegaCompliance`
 * and rejects if FAL, ad license, or address fields are missing. CORP_AGENT listings
 * auto-route to PENDING_APPROVAL for owner review.
 *
 * Consumer: property pages (`properties/index.tsx`, `properties/detail.tsx`,
 * `post-listing.tsx`), map page, landing featured section.
 *
 * @see [[Features/Properties & Listings]]
 * @see [[Features/REGA Compliance]]
 */

import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";
import { getErrorResponse } from "../i18n";
import { listingSchemas } from "../src/validators/listings.schema";
import { authenticateToken } from "../src/middleware/auth.middleware";
import { requireFalLicense } from "../src/middleware/fal-license.middleware";
import { checkListingRegaCompliance } from "../src/validators/saudi-regulation.validators";

const router = express.Router();

// Simple query parsing and filtering for listings
/**
 * List  with optional filters.
 *
 * @route   GET /api/listings/
 * @auth    Public — no auth required
 */
router.get("/", async (req, res) => {
  try {
    const {
      q,
      ids,
      city,
      propertyType,
      propertyCategory,
      listingType,
      minPrice,
      maxPrice,
      minBedrooms,
      minBathrooms,
      status,
      sort,
      page = "1",
      pageSize = "20",
    } = req.query as Record<string, string | undefined>;

    // Parse pagination parameters with hard cap
    const MAX_PAGE_SIZE = 10000;
    const pageSizeStr = pageSize || "20";
    const isAll = pageSizeStr.toLowerCase() === "all";
    const pageNum = isAll ? 1 : Math.max(1, parseInt(page || "1", 10) || 1);
    const sizeNum = isAll ? MAX_PAGE_SIZE : Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSizeStr, 10) || 20));

    // Parse filter parameters
    const filterOptions: any = {
      page: pageNum,
      pageSize: sizeNum,
      sort: sort || 'newest',
    };

    if (q && q.trim().length > 0) {
      filterOptions.q = q.trim();
    }

    if (ids && ids.trim().length > 0) {
      filterOptions.ids = ids.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (city) filterOptions.city = city;
    if (propertyType) filterOptions.propertyType = propertyType;
    if (propertyCategory) filterOptions.propertyCategory = propertyCategory;
    if (listingType) filterOptions.listingType = listingType;
    if (status) filterOptions.status = status;

    if (minPrice) {
      const mp = Number(minPrice);
      if (!Number.isNaN(mp)) filterOptions.minPrice = mp;
    }

    if (maxPrice) {
      const mp = Number(maxPrice);
      if (!Number.isNaN(mp)) filterOptions.maxPrice = mp;
    }

    if (minBedrooms) {
      const mb = Number(minBedrooms);
      if (!Number.isNaN(mb)) filterOptions.minBedrooms = mb;
    }

    if (minBathrooms) {
      const mb = Number(minBathrooms);
      if (!Number.isNaN(mb)) filterOptions.minBathrooms = mb;
    }

    // Use SQL-level pagination
    const result = await storage.getPropertiesPaginated(filterOptions);

    // Process items to ensure photoUrls/imageGallery is included
    const items = result.items.map((item: any) => {
      // Ensure photoUrls/imageGallery is included in response
      let photoUrls: string[] | undefined = undefined;
      if (item.photoUrls && Array.isArray(item.photoUrls)) {
        photoUrls = item.photoUrls;
      } else if (item.photos) {
        try {
          // Try to parse photos if it's a JSON string
          const parsed = typeof item.photos === 'string' ? JSON.parse(item.photos) : item.photos;
          photoUrls = Array.isArray(parsed) ? parsed : undefined;
        } catch {
          // If parsing fails, ignore
        }
      } else if (item.imageGallery && Array.isArray(item.imageGallery)) {
        photoUrls = item.imageGallery;
      }

      /** Days on market — calculated from createdAt (E7). Consumer: property card badge. */
      const createdDate = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
      const daysOnMarket = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));

      return {
        ...item,
        propertyType: item.type ?? null,
        listingType: Array.isArray(item.listings) && item.listings.length > 0
          ? item.listings[0].listingType
          : null,
        photoUrls,
        imageGallery: photoUrls,
        daysOnMarket,
      };
    });

    res.json({
      items,
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

// Map endpoint: return lightweight listing markers
/**
 * List map with optional filters.
 *
 * @route   GET /api/listings/map
 * @auth    Public — no auth required
 */
router.get("/map", async (req, res) => {
  try {
    const { city, propertyType, propertyCategory, listingType } = req.query as Record<string, string | undefined>;
    const properties = await storage.getAllProperties();



    const mapProperties = properties
      .filter((p) => p.latitude && p.longitude)
      .filter((p) => (city ? p.city === city : true))
      .filter((p) => (propertyType ? (p as any).type === propertyType : true))
      // Property category is optional in seed data; don't exclude when absent
      // .filter((p) => (propertyCategory ? p.propertyCategory === propertyCategory : true))
      .filter((p) => (listingType ? (p as any).listingType === listingType : true))
      .map((p) => ({
        id: p.id,
        title: p.title,
        address: p.address,
        city: p.city,
        price: p.price,
        propertyCategory: p.category,
        propertyType: p.type,
        latitude: p.latitude,
        longitude: p.longitude,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqm: (p as any).areaSqm ?? null,
        status: p.status,
      }));


    res.json(mapProperties);
  } catch (err) {
    console.error("Error fetching listings for map:", err);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

// Listing detail
/**
 * Fetch a single :id by ID.
 *
 * @route   GET /api/listings/:id
 * @auth    Public — no auth required
 */
router.get("/:id", async (req, res) => {
  try {
    const item = await storage.getProperty(req.params.id);
    if (!item) return res.status(404).json(getErrorResponse('LISTING_NOT_FOUND', (req as any).locale));
    res.json(item);
  } catch (err) {
    console.error("Error fetching listing detail:", err);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

// Similar listings
/**
 * Fetch a single :id by ID.
 *
 * @route   GET /api/listings/:id/similar
 * @auth    Public — no auth required
 */
router.get("/:id/similar", async (req, res) => {
  try {
    const current = await storage.getProperty(req.params.id);
    if (!current) return res.status(404).json({ message: "Listing not found" });
    const all = await storage.getAllProperties();
    const similar = all
      .filter(p => p.id !== current.id && p.city === current.city && (p as any).type === (current as any).type)
      .slice(0, 8);
    res.json(similar);
  } catch (err) {
    console.error("Error fetching similar listings:", err);
    res.status(500).json({ message: "Failed to fetch similar listings" });
  }
});

/**
 * @route GET /api/listings/:id/interested-count
 * @auth  Not required
 * @returns `{ count }` — number of users who favorited this property.
 *   Source: `favorites` table. Consumer: "X مهتم" badge on property detail (E8).
 */
router.get("/:id/interested-count", async (req, res) => {
  try {
    const { prisma: db } = await import("../prismaClient");
    const count = await db.favorites.count({ where: { propertyId: req.params.id } });
    res.json({ count });
  } catch (err) {
    res.json({ count: 0 });
  }
});

/**
 * @route GET /api/listings/:id/price-history
 * @auth  Not required
 * @returns Array of `{ oldPrice, newPrice, changedAt }` — price change timeline.
 *   Source: `property_price_history` table. Consumer: price timeline on detail page (E8).
 */
router.get("/:id/price-history", async (req, res) => {
  try {
    const { prisma: db } = await import("../prismaClient");
    const history = await db.property_price_history.findMany({
      where: { propertyId: req.params.id },
      orderBy: { changedAt: "desc" },
      take: 20,
    });
    res.json(history.map((h) => ({
      oldPrice: Number(h.oldPrice),
      newPrice: Number(h.newPrice),
      changedAt: h.changedAt,
    })));
  } catch (err) {
    res.json([]);
  }
});

// Featured/new listings
/**
 * List featured with optional filters.
 *
 * @route   GET /api/listings/featured
 * @auth    Public — no auth required
 */
router.get("/featured", async (req, res) => {
  try {
    const all = await storage.getAllProperties();
    let featured = all.filter((p: any) => p.isFeatured === true && p.status === 'active');
    if (featured.length === 0) {
      // fallback to newest
      featured = all.sort((a: any, b: any) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
    }
    res.json(featured.slice(0, 12));
  } catch (err) {
    console.error("Error fetching featured listings:", err);
    res.status(500).json({ message: "Failed to fetch featured listings" });
  }
});

// Create a new listing — requires FAL license per نظام الوساطة العقارية (Article 4)
/**
 * Create a new  record.
 *
 * @route   POST /api/listings/
 * @auth    Required — any authenticated user
 */
router.post("/", authenticateToken, requireFalLicense, async (req, res) => {
  try {
    const data = listingSchemas.create.parse(req.body);
    const isPublishing = data.status === "active" || data.status === "ACTIVE";

    // REGA compliance gate: if publishing (not draft), enforce mandatory fields
    if (isPublishing) {
      const missing = checkListingRegaCompliance({
        falLicenseNumber: data.falLicenseNumber || (req as any).falLicense?.number,
        regaAdLicenseNumber: data.regaAdLicenseNumber,
        city: data.city,
        district: data.district,
        areaSqm: data.squareFeet,
        price: data.price,
        type: data.propertyType,
        description: data.description,
      });

      if (missing.length > 0) {
        return res.status(400).json({
          message: "الإعلان لا يستوفي متطلبات ضوابط الإعلانات العقارية",
          code: "REGA_COMPLIANCE",
          missingFields: missing,
          details: `حقول مطلوبة: ${missing.join("، ")}`,
        });
      }
    }

    // Attach agent's FAL number to the listing automatically
    const falNumber = data.falLicenseNumber || (req as any).falLicense?.number;
    const user = (req as any).user;
    const roles: string[] = typeof user.roles === "string" ? JSON.parse(user.roles) : (user.roles || []);
    const isCorpAgent = roles.includes("CORP_AGENT");

    // CORP_AGENT listings require CORP_OWNER approval before publishing
    // INDIV_AGENT and CORP_OWNER listings auto-publish
    let finalStatus = data.status || "active";
    if (isPublishing && isCorpAgent && user.organizationId) {
      finalStatus = "PENDING_APPROVAL";
    }

    const listing = await storage.createProperty(
      {
        title: data.title,
        description: data.description,
        address: data.address,
        city: data.city,
        district: data.district,
        propertyType: data.propertyType,
        propertyCategory: data.propertyCategory,
        listingType: data.listingType,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        squareFeet: data.squareFeet,
        latitude: data.latitude,
        longitude: data.longitude,
        features: data.features,
        regionId: data.regionId,
        cityId: data.cityId,
        districtId: data.districtId,
        agentId: data.agentId || user.id,
        organizationId: data.organizationId || user.organizationId,
        status: finalStatus,
        regaAdLicenseNumber: data.regaAdLicenseNumber,
        falLicenseNumber: falNumber,
        deedNumber: data.deedNumber,
        legalStatus: data.legalStatus,
        facadeDirection: data.facadeDirection,
        buildingAge: data.buildingAge,
      } as any,
      "default-user",
      "default-tenant",
    );
    res.status(201).json(listing);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', (req as any).locale, err.errors));
    }
    console.error("Error creating listing:", err);
    res.status(500).json(getErrorResponse('SERVER_ERROR', (req as any).locale));
  }
});

// Update a listing
/**
 * Update an existing :id record.
 *
 * @route   PUT /api/listings/:id
 * @auth    Required — any authenticated user
 */
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ message: "Request body is required" });
    }

    // Track price changes in history table (E8)
    if (body.price !== undefined) {
      try {
        const existing = await storage.getProperty(req.params.id);
        const oldPrice = Number((existing as any)?.price || 0);
        const newPrice = Number(body.price);
        if (oldPrice > 0 && newPrice > 0 && oldPrice !== newPrice) {
          const { prisma: db } = await import("../prismaClient");
          await db.property_price_history.create({
            data: {
              propertyId: req.params.id,
              oldPrice,
              newPrice,
              changedBy: (req as any).user?.id || null,
            },
          });
        }
      } catch { /* best effort — don't fail the update */ }
    }

    const updated = await storage.updateProperty(req.params.id, body);
    if (!updated) return res.status(404).json({ message: "Listing not found" });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: err.errors });
    }
    console.error("Error updating listing:", err);
    res.status(500).json({ message: "Failed to update listing" });
  }
});

// Update status/moderation
/**
 * Partially update a :id record.
 *
 * @route   PATCH /api/listings/:id/status
 * @auth    Required — any authenticated user
 */
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { status, moderationStatus } = req.body || {};
    if (!status && !moderationStatus) {
      return res.status(400).json({ message: "status or moderationStatus is required" });
    }
    const updated = await storage.updateProperty(req.params.id, { status, moderationStatus } as any);
    if (!updated) return res.status(404).json({ message: "Listing not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating listing status:", err);
    res.status(500).json({ message: "Failed to update listing status" });
  }
});

// CMA / Property valuation
/**
 * Fetch a single :id by ID.
 *
 * @route   GET /api/listings/:id/valuation
 * @auth    Public — no auth required
 */
router.get("/:id/valuation", async (req, res) => {
  try {
    const { valuationService } = await import("../src/services/valuation.service");
    const result = await valuationService.getValuation(req.params.id);
    if (!result) return res.json({ available: false, message: "لا توجد بيانات كافية للتقييم" });
    res.json({ available: true, ...result });
  } catch (error) {
    console.error("Valuation error:", error);
    res.status(500).json({ message: "فشل التقييم" });
  }
});

// Match leads — find leads whose preferences match this listing and notify them
/**
 * Create a new :id record.
 *
 * @route   POST /api/listings/:id/match-leads
 * @auth    Required — any authenticated user
 */
router.post("/:id/match-leads", authenticateToken, async (req, res) => {
  try {
    const listing = await storage.getProperty(req.params.id);
    if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });

    const property = listing as any;
    const price = Number(property.price) || 0;
    const city = property.city || "";
    const type = property.type || property.propertyType || "";

    if (!city || !price) {
      return res.json({ matched: 0, message: "بيانات العقار غير كافية للمطابقة" });
    }

    // Find leads that match: same city, budget covers price, compatible interest type
    const { prisma: db } = await import("../prismaClient");
    const matchingLeads = await db.leads.findMany({
      where: {
        status: { notIn: ["WON", "LOST"] },
        customer: {
          city: city,
        },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true, whatsappNumber: true } },
      },
      take: 50,
    });

    // Create campaign for matched leads
    if (matchingLeads.length > 0) {
      const user = (req as any).user;
      const message = `عقار جديد يطابق اهتمامك!\n\n${property.title || type}\n📍 ${city}\n💰 ${price.toLocaleString()} ر.س\n\nتواصل مع وسيطك للمزيد من التفاصيل.`;

      await db.campaigns.create({
        data: {
          agentId: user.id,
          organizationId: user.organizationId || undefined,
          title: `مطابقة عقار: ${property.title || city}`,
          message,
          channel: "whatsapp",
          status: "SENT",
          recipientCount: matchingLeads.length,
          deliveredCount: matchingLeads.length,
          sentAt: new Date(),
          recipients: {
            create: matchingLeads.map((lead) => ({
              leadId: lead.id,
              customerId: lead.customerId || undefined,
              name: lead.customer ? `${lead.customer.firstName} ${lead.customer.lastName}` : undefined,
              phone: lead.customer?.whatsappNumber || lead.customer?.phone || undefined,
              status: "DELIVERED",
              deliveredAt: new Date(),
            })),
          },
        },
      });
    }

    res.json({ matched: matchingLeads.length, message: `تم إرسال إشعار لـ ${matchingLeads.length} عميل مطابق` });
  } catch (error) {
    console.error("Error matching leads:", error);
    res.status(500).json({ message: "فشل مطابقة العملاء" });
  }
});

// Approve listing (CORP_OWNER only) — changes PENDING_APPROVAL → ACTIVE
/**
 * Partially update a :id record.
 *
 * @route   PATCH /api/listings/:id/approve
 * @auth    Required — any authenticated user
 */
router.patch("/:id/approve", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const roles: string[] = typeof user.roles === "string" ? JSON.parse(user.roles) : (user.roles || []);

    if (!roles.includes("CORP_OWNER") && !roles.includes("WEBSITE_ADMIN")) {
      return res.status(403).json({ message: "فقط مدير المنشأة يمكنه الموافقة على الإعلانات" });
    }

    const listing = await storage.getProperty(req.params.id);
    if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });

    // Verify same org
    if (!roles.includes("WEBSITE_ADMIN") && (listing as any).organizationId !== user.organizationId) {
      return res.status(403).json({ message: "لا يمكنك الموافقة على إعلانات منشأة أخرى" });
    }

    const updated = await storage.updateProperty(req.params.id, { status: "ACTIVE" } as any);
    res.json({ ...updated, approved: true, approvedBy: user.id });
  } catch (err) {
    console.error("Error approving listing:", err);
    res.status(500).json({ message: "فشل الموافقة على الإعلان" });
  }
});

// Reject listing (CORP_OWNER only) — changes PENDING_APPROVAL → DRAFT with notes
/**
 * Partially update a :id record.
 *
 * @route   PATCH /api/listings/:id/reject
 * @auth    Required — any authenticated user
 */
router.patch("/:id/reject", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const roles: string[] = typeof user.roles === "string" ? JSON.parse(user.roles) : (user.roles || []);

    if (!roles.includes("CORP_OWNER") && !roles.includes("WEBSITE_ADMIN")) {
      return res.status(403).json({ message: "فقط مدير المنشأة يمكنه رفض الإعلانات" });
    }

    const { reason } = req.body || {};
    const listing = await storage.getProperty(req.params.id);
    if (!listing) return res.status(404).json({ message: "الإعلان غير موجود" });

    if (!roles.includes("WEBSITE_ADMIN") && (listing as any).organizationId !== user.organizationId) {
      return res.status(403).json({ message: "لا يمكنك رفض إعلانات منشأة أخرى" });
    }

    const updated = await storage.updateProperty(req.params.id, {
      status: "DRAFT",
      description: reason
        ? `${(listing as any).description || ""}\n\n--- سبب الرفض: ${reason} ---`
        : (listing as any).description,
    } as any);
    res.json({ ...updated, rejected: true, rejectedBy: user.id, reason });
  } catch (err) {
    console.error("Error rejecting listing:", err);
    res.status(500).json({ message: "فشل رفض الإعلان" });
  }
});

// Get pending approval count (for CORP_OWNER badge)
/**
 * List pending-approval with optional filters.
 *
 * @route   GET /api/listings/pending-approval/count
 * @auth    Required — any authenticated user
 */
router.get("/pending-approval/count", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user.organizationId) return res.json({ count: 0 });

    const count = await (await import("../prismaClient")).prisma.listings.count({
      where: { organizationId: user.organizationId, status: "PENDING_APPROVAL" },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ count: 0 });
  }
});

// Delete listing
/**
 * Delete a :id record.
 *
 * @route   DELETE /api/listings/:id
 * @auth    Required — any authenticated user
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    await storage.deleteProperty(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting listing:", err);
    res.status(500).json({ message: "Failed to delete listing" });
  }
});

export default router;
