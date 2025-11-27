/**
 * routes/unverified-listings.ts - Unverified Listings API Routes
 * 
 * Location: apps/api/ → Routes/ → unverified-listings.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for unverified property listings. Handles:
 * - Public submission of unverified listings
 * - Retrieval of unverified listings
 * - Listing verification workflow
 * 
 * API Endpoints:
 * - GET /api/unverified-listings - Get unverified listings
 * - POST /api/unverified-listings - Submit unverified listing
 * 
 * Related Files:
 * - apps/web/src/pages/unverified-listing.tsx - Public listing submission
 * - apps/web/src/pages/unverified-listings-management.tsx - Management interface
 */

import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";

const router = express.Router();

const MAX_VIDEO_SIZE_BYTES = 1024 * 1024;

// Old schema - DEPRECATED - Not used anymore
// This schema is kept for backward compatibility reference only
const submissionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(30),
  propertyType: z.string().min(1),
  propertyCategory: z.string().optional(), // DEPRECATED - field doesn't exist in property_listings table
  listingType: z.string().min(1),
  price: z.number().nonnegative(),
  city: z.string().min(1),
  state: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  address: z.string().min(1),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().min(0).nullable().optional(),
  areaSqm: z.number().min(0).nullable().optional(),
  landArea: z.number().min(0).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  completionYear: z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
  furnishing: z.string().nullable().optional(),
  occupancy: z.string().nullable().optional(),
  maintenanceFees: z.number().min(0).nullable().optional(),
  paymentPlan: z.string().nullable().optional(),
  amenities: z.array(z.string()).optional().default([]),
  additionalNotes: z.string().nullable().optional(),
  contact: z.object({
    name: z.string().min(3),
    email: z.string().email().nullable().optional(),
    phone: z.string().min(7).nullable().optional(),
    preferredTime: z.string().nullable().optional(),
  }),
  media: z
    .object({
      images: z.array(z.string()).max(15).optional().default([]),
      videos: z.array(z.string()).max(5).optional().default([]),
    })
    .optional()
    .default({ images: [], videos: [] }),
});

const calculateBase64Size = (dataUrl: string): number => {
  const base64Segment = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const paddingMatches = (base64Segment.match(/=*$/) ?? [""])[0].length;
  return Math.ceil((base64Segment.length * 3) / 4) - paddingMatches;
};

// GET route to fetch all unverified listings (for admin dashboard)
router.get("/", async (req, res) => {
  try {
    // Check if status query param exists in the URL (even if empty string)
    if ('status' in req.query) {
      const status = req.query.status ? (req.query.status as string).trim() : undefined;
      const listings = await storage.getAllPropertyListings(status);
      return res.json(listings);
    }
    // Otherwise, return health check message
    res.status(200).json({ 
      message: "Unverified listings API is running",
      endpoint: "POST /api/unverified-listings to submit a listing",
      endpointGet: "GET /api/unverified-listings?status=Pending to get listings"
    });
  } catch (error) {
    console.error("Error fetching unverified listings:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to fetch unverified listings" 
    });
  }
});

// GET route for a specific listing by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const listing = await storage.getPropertyListingById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.json(listing);
  } catch (error) {
    console.error("Error fetching listing:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to fetch listing" 
    });
  }
});

// POST route to accept a listing (approve and activate)
router.post("/:id/accept", async (req, res) => {
  try {
    const id = req.params.id;
    const listing = await storage.getPropertyListingById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    // Update listing to approved and active
    const updated = await storage.updatePropertyListing(id, {
      is_verified: true,
      is_active: true,
      status: "Approved",
    });
    
    res.json({ 
      message: "Listing accepted successfully",
      listing: updated 
    });
  } catch (error) {
    console.error("Error accepting listing:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to accept listing" 
    });
  }
});

// POST route to reject a listing
router.post("/:id/reject", async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    const listing = await storage.getPropertyListingById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    // Update listing to rejected
    const updated = await storage.updatePropertyListing(id, {
      is_verified: false,
      is_active: false,
      status: "Rejected",
    });
    
    res.json({ 
      message: "Listing rejected successfully",
      listing: updated 
    });
  } catch (error) {
    console.error("Error rejecting listing:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to reject listing" 
    });
  }
});

router.post("/", async (req, res) => {
  try {
    // Schema matching property_listings table exactly
    // See data/schema/prisma/schema.prisma for table definition
    const updatedSchema = z.object({
      title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
      description: z.string().optional(),
      propertyCategory: z.string().optional(), // Property category code (e.g., 'residential')
      propertyType: z.string().min(1, "نوع العقار مطلوب"), // Property type code (e.g., 'apartment', 'villa') - Maps to property_type VARCHAR(50) NOT NULL
      listingType: z.string().min(1, "نوع العرض مطلوب"), // Maps to listing_type VARCHAR(30) NOT NULL
      country: z.string().optional().default("Saudi Arabia"),
      region: z.string().optional(),
      city: z.string().min(1),
      district: z.string().optional(),
      streetAddress: z.string().optional(),
      address: z.string().optional(), // Fallback for old format
      latitude: z.union([z.string(), z.number()]).optional(),
      longitude: z.union([z.string(), z.number()]).optional(),
      bedrooms: z.number().int().min(0).nullable().optional(),
      bathrooms: z.number().int().min(0).nullable().optional(),
      livingRooms: z.number().int().min(0).nullable().optional(),
      kitchens: z.number().int().min(0).nullable().optional(),
      floorNumber: z.number().int().nullable().optional(),
      totalFloors: z.number().int().nullable().optional(),
      areaSqm: z.union([z.string(), z.number()]).optional(),
      buildingYear: z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
      hasParking: z.boolean().optional().default(false),
      hasElevator: z.boolean().optional().default(false),
      hasMaidsRoom: z.boolean().optional().default(false),
      hasDriverRoom: z.boolean().optional().default(false),
      furnished: z.boolean().optional().default(false),
      balcony: z.boolean().optional().default(false),
      swimmingPool: z.boolean().optional().default(false),
      centralAc: z.boolean().optional().default(false),
      price: z.union([z.string(), z.number()]).transform((val) => {
        const num = typeof val === "string" ? parseFloat(val) : val;
        if (isNaN(num) || num < 0) throw new Error("السعر يجب أن يكون رقمًا صحيحًا");
        return num;
      }),
      currency: z.string().optional().default("SAR"),
      paymentFrequency: z.string().optional(),
      imageGallery: z.array(z.string()).max(10).optional().default([]),
      images: z.array(z.string()).max(10).optional().default([]), // Support old format
      videoClipUrl: z.string().optional(),
      contactName: z.string().optional(),
      mobileNumber: z.union([
        z.string().min(7, "رقم الجوال يجب أن يكون 7 أحرف على الأقل"),
        z.literal(""),
      ]).optional(),
      // Support old format for backward compatibility
      contact: z.object({
        name: z.string().min(3).optional(),
        phone: z.string().min(7).optional(),
        email: z.string().email().optional(),
      }).optional(),
    }).passthrough().refine((data) => {
      // At least one of mobileNumber or contact.phone must be provided
      // mobile_number is NOT NULL in the database
      const hasMobile = data.mobileNumber && data.mobileNumber.length >= 7;
      const hasContactPhone = data.contact?.phone && data.contact.phone.length >= 7;
      return hasMobile || hasContactPhone;
    }, {
      message: "يجب إدخال رقم الجوال إما في حقل رقم الجوال أو في معلومات الاتصال",
      path: ["mobileNumber"],
    }); // passthrough() already allows unknown fields

    console.log("Request body received:", JSON.stringify(req.body, null, 2));
    
    // Remove propertyCategory and any other fields not in property_listings table
    const cleanedBody: any = {};
    const allowedFields = [
      'title', 'description', 'propertyCategory', 'propertyType', 'listingType', 'country', 'region', 'city', 
      'district', 'streetAddress', 'address', 'latitude', 'longitude', 'bedrooms', 'bathrooms',
      'livingRooms', 'kitchens', 'floorNumber', 'totalFloors', 'areaSqm', 'buildingYear',
      'hasParking', 'hasElevator', 'hasMaidsRoom', 'hasDriverRoom', 'furnished', 'balcony',
      'swimmingPool', 'centralAc', 'price', 'currency', 'paymentFrequency', 'imageGallery',
      'images', 'videoClipUrl', 'contactName', 'mobileNumber', 'contact', 'status'
    ];
    
    // Only copy allowed fields - STRICTLY EXCLUDE propertyCategory
    Object.keys(req.body).forEach(key => {
      // Completely skip propertyCategory - it doesn't exist in property_listings table
      if (key === 'propertyCategory' || key === 'property_category') {
        console.log(`⚠️ EXCLUDED ${key} from request (not in property_listings database schema)`);
        return;
      }
      if (allowedFields.includes(key)) {
        cleanedBody[key] = req.body[key];
      } else {
        console.log(`⚠️ Ignoring unknown field: ${key}`);
      }
    });
    
    // Final safety check: Ensure propertyCategory is NOT in cleanedBody
    if ('propertyCategory' in cleanedBody) {
      delete cleanedBody.propertyCategory;
      console.error("ERROR: propertyCategory was still in cleanedBody after filtering!");
    }
    if ('property_category' in cleanedBody) {
      delete cleanedBody.property_category;
      console.error("ERROR: property_category was still in cleanedBody after filtering!");
    }
    
    console.log("Cleaned body (allowed fields only):", JSON.stringify(cleanedBody, null, 2));
    console.log("Verification - propertyCategory in cleanedBody?", 'propertyCategory' in cleanedBody || 'property_category' in cleanedBody ? 'YES - ERROR!' : 'NO - OK');
    
    const parsed = updatedSchema.parse(cleanedBody);
    
    console.log("Parsed data (after cleanup):", JSON.stringify(parsed, null, 2));

    // Handle both new and old image formats
    let imageGallery: string[] = [];
    if (parsed.imageGallery && Array.isArray(parsed.imageGallery)) {
      imageGallery = parsed.imageGallery;
    } else if (parsed.images && Array.isArray(parsed.images)) {
      imageGallery = parsed.images;
    }

    // Validate image count
    if (imageGallery.length > 10) {
      return res.status(400).json({ 
        message: `يمكن رفع حتى 10 صور فقط` 
      });
    }

    // Validate image size (if base64 strings)
    const MAX_IMAGE_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    let totalSize = 0;
    for (const img of imageGallery) {
      if (typeof img === "string" && img.startsWith("data:")) {
        const base64Segment = img.includes(",") ? img.split(",")[1] : img;
        const paddingMatches = (base64Segment.match(/=*$/) ?? [""])[0].length;
        const sizeBytes = Math.ceil((base64Segment.length * 3) / 4) - paddingMatches;
        totalSize += sizeBytes;
      }
    }

    if (totalSize > MAX_IMAGE_TOTAL_SIZE_BYTES) {
      return res.status(400).json({ 
        message: `إجمالي حجم الصور يجب أن يكون أقل من ${MAX_IMAGE_TOTAL_SIZE_BYTES / (1024 * 1024)} ميجابايت` 
      });
    }

    // Validate video if provided
    if (parsed.videoClipUrl) {
      if (typeof parsed.videoClipUrl === "string" && parsed.videoClipUrl.startsWith("data:")) {
        const sizeBytes = calculateBase64Size(parsed.videoClipUrl);
        if (sizeBytes > MAX_VIDEO_SIZE_BYTES) {
          return res.status(400).json({ 
            message: `حجم الفيديو يجب أن يكون أقل من ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)} ميجابايت` 
          });
        }
      }
    }

    // Map to property_listings format
    const listingData = {
      title: parsed.title,
      description: parsed.description || null,
      propertyType: parsed.propertyType,
      listingType: parsed.listingType,
      country: parsed.country || "Saudi Arabia",
      region: parsed.region || null,
      city: String(parsed.city || ""),
      district: parsed.district || null,
      streetAddress: parsed.streetAddress || parsed.address || null,
      latitude: parsed.latitude ? (typeof parsed.latitude === "string" ? parseFloat(parsed.latitude) : parsed.latitude) : null,
      longitude: parsed.longitude ? (typeof parsed.longitude === "string" ? parseFloat(parsed.longitude) : parsed.longitude) : null,
      bedrooms: parsed.bedrooms || null,
      bathrooms: parsed.bathrooms || null,
      livingRooms: parsed.livingRooms || null,
      kitchens: parsed.kitchens || null,
      floorNumber: parsed.floorNumber || null,
      totalFloors: parsed.totalFloors || null,
      areaSqm: parsed.areaSqm ? (typeof parsed.areaSqm === "string" ? parseFloat(parsed.areaSqm) : parsed.areaSqm) : null,
      buildingYear: parsed.buildingYear || null,
      hasParking: parsed.hasParking ?? false,
      hasElevator: parsed.hasElevator ?? false,
      hasMaidsRoom: parsed.hasMaidsRoom ?? false,
      hasDriverRoom: parsed.hasDriverRoom ?? false,
      furnished: parsed.furnished ?? false,
      balcony: parsed.balcony ?? false,
      swimmingPool: parsed.swimmingPool ?? false,
      centralAc: parsed.centralAc ?? false,
      price: parsed.price,
      currency: parsed.currency || "SAR",
      paymentFrequency: parsed.paymentFrequency || null,
      mainImageUrl: imageGallery.length > 0 ? imageGallery[0] : null,
      imageGallery: imageGallery,
      videoClipUrl: parsed.videoClipUrl || null,
      contactName: parsed.contactName || parsed.contact?.name || null,
      mobileNumber: parsed.mobileNumber && parsed.mobileNumber.length >= 7 
        ? parsed.mobileNumber 
        : (parsed.contact?.phone && parsed.contact.phone.length >= 7 
          ? parsed.contact.phone 
          : ""),
      status: "Pending",
    };

    const created = await storage.createPropertyListing(listingData);

    res.status(201).json({ 
      id: created.id, 
      propertyId: created.propertyId,
      message: "تم استلام إعلانك بنجاح وسيتم مراجعته قريباً." 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
      console.error("Error paths:", error.errors.map(e => e.path));
      
      // Filter out propertyCategory errors completely - they should never appear since we filter the request body
      const filteredErrors = error.errors.filter(e => {
        const pathStr = Array.isArray(e.path) ? e.path.join('.') : String(e.path || '');
        return !pathStr.toLowerCase().includes('propertycategory') && 
               !pathStr.toLowerCase().includes('property_category') &&
               !pathStr.toLowerCase().includes('property-category');
      });
      
      // If all errors are about propertyCategory, return a generic message without mentioning propertyCategory
      if (filteredErrors.length === 0 && error.errors.length > 0) {
        console.error("All validation errors were filtered out (likely propertyCategory)");
        return res.status(400).json({ 
          message: "يرجى التحقق من الحقول المدخلة والتأكد من صحة جميع البيانات.",
          errors: [],
        });
      }
      
      // If no valid errors remain after filtering, skip validation error response
      if (filteredErrors.length === 0) {
        console.error("No valid errors after filtering propertyCategory");
        return res.status(400).json({ 
          message: "يرجى التحقق من الحقول المدخلة.",
          errors: [],
        });
      }
      
      const firstError = filteredErrors[0];
      const errorMessage = firstError 
        ? `${Array.isArray(firstError.path) ? firstError.path.join('.') : String(firstError.path || 'حقل')}: ${firstError.message}`
        : "يرجى التحقق من الحقول المدخلة";
      
      return res.status(400).json({ 
        message: "يرجى التحقق من الحقول المدخلة", 
        errors: filteredErrors,
        details: filteredErrors.map(e => {
          const pathStr = Array.isArray(e.path) ? e.path.join('.') : String(e.path || 'حقل');
          return `${pathStr}: ${e.message}`;
        }),
        firstError: errorMessage
      });
    }
    console.error("Error creating unverified listing:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "تعذر معالجة الطلب حالياً" 
    });
  }
});

export default router;
