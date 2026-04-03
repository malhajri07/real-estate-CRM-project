/**
 * listing.validators.ts — Comprehensive Zod Schemas for Listing CRUD
 *
 * Location: apps/api/src/validators/listing.validators.ts
 *
 * Provides granular validation schemas with Arabic error messages for:
 * - Listing creation
 * - Listing updates (partial)
 * - Listing search/filter with pagination and geo-queries
 * - Listing media management
 * - Listing moderation actions
 * - Listing bulk operations
 *
 * All error messages are in Arabic for the Saudi market.
 *
 * Usage:
 *   import { listingValidators } from '../validators/listing.validators';
 *   const parsed = listingValidators.create.parse(req.body);
 */

import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────────────

const propertyCategoryEnum = z.enum(
  ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL", "MIXED_USE"],
  { errorMap: () => ({ message: "تصنيف العقار غير صالح — القيم المسموحة: سكني، تجاري، صناعي، زراعي، متعدد الاستخدام" }) }
);

const propertyTypeEnum = z.enum(
  ["APARTMENT", "VILLA", "DUPLEX", "STUDIO", "LAND", "OFFICE", "SHOP", "BUILDING", "WAREHOUSE", "FARM", "CHALET", "TOWER", "COMPOUND", "OTHER"],
  { errorMap: () => ({ message: "نوع العقار غير صالح" }) }
);

const listingTypeEnum = z.enum(
  ["SALE", "RENT", "LEASE", "DAILY_RENT", "AUCTION"],
  { errorMap: () => ({ message: "نوع الإعلان غير صالح — القيم المسموحة: بيع، إيجار، تأجير، إيجار يومي، مزاد" }) }
);

const listingStatusEnum = z.enum(
  ["ACTIVE", "PENDING", "SOLD", "RENTED", "EXPIRED", "WITHDRAWN", "DRAFT"],
  { errorMap: () => ({ message: "حالة الإعلان غير صالحة" }) }
);

const moderationStatusEnum = z.enum(
  ["PENDING_REVIEW", "APPROVED", "REJECTED", "FLAGGED", "REQUIRES_CHANGES"],
  { errorMap: () => ({ message: "حالة المراجعة غير صالحة" }) }
);

const furnishingEnum = z.enum(
  ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"],
  { errorMap: () => ({ message: "حالة التأثيث غير صالحة — القيم المسموحة: مؤثث، مؤثث جزئياً، بدون أثاث" }) }
);

const facingDirectionEnum = z.enum(
  ["NORTH", "SOUTH", "EAST", "WEST", "NORTH_EAST", "NORTH_WEST", "SOUTH_EAST", "SOUTH_WEST"],
  { errorMap: () => ({ message: "اتجاه الواجهة غير صالح" }) }
);

const amenityEnum = z.enum([
  "PARKING", "ELEVATOR", "POOL", "GARDEN", "SECURITY", "AC",
  "BALCONY", "STORAGE", "GYM", "INTERNET", "CENTRAL_HEATING",
  "WATER_TANK", "VIEW", "ROOFTOP", "FENCE", "PLAYGROUND",
  "MOSQUE_NEARBY", "SCHOOL_NEARBY", "MAID_ROOM", "DRIVER_ROOM",
]);

// ─── Shared Field Schemas ───────────────────────────────────────────────────

const titleField = z
  .string()
  .min(5, "عنوان الإعلان يجب أن يكون ٥ أحرف على الأقل")
  .max(200, "عنوان الإعلان لا يمكن أن يتجاوز ٢٠٠ حرف")
  .trim();

const descriptionField = z
  .string()
  .max(10000, "وصف الإعلان لا يمكن أن يتجاوز ١٠٬٠٠٠ حرف")
  .optional()
  .nullable();

const priceField = z.coerce
  .number()
  .nonnegative("السعر يجب أن يكون موجباً")
  .max(999999999, "السعر لا يمكن أن يتجاوز ٩٩٩٬٩٩٩٬٩٩٩");

const areaField = z.coerce
  .number()
  .positive("المساحة يجب أن تكون أكبر من صفر")
  .max(9999999, "المساحة لا يمكن أن تتجاوز ٩٬٩٩٩٬٩٩٩ م²");

const latitudeField = z.coerce
  .number()
  .min(-90, "خط العرض يجب أن يكون بين -٩٠ و ٩٠")
  .max(90, "خط العرض يجب أن يكون بين -٩٠ و ٩٠");

const longitudeField = z.coerce
  .number()
  .min(-180, "خط الطول يجب أن يكون بين -١٨٠ و ١٨٠")
  .max(180, "خط الطول يجب أن يكون بين -١٨٠ و ١٨٠");

// ─── Location Schema ────────────────────────────────────────────────────────

const locationSchema = z.object({
  address: z.string().max(500, "العنوان لا يمكن أن يتجاوز ٥٠٠ حرف").optional().nullable(),
  city: z.string().min(1, "المدينة مطلوبة").max(100),
  district: z.string().max(100, "اسم الحي لا يمكن أن يتجاوز ١٠٠ حرف").optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zipCode: z.string().max(10, "الرمز البريدي لا يمكن أن يتجاوز ١٠ أرقام").optional().nullable(),
  regionId: z.coerce.number().int().positive().optional().nullable(),
  cityId: z.coerce.number().int().positive().optional().nullable(),
  districtId: z.coerce.number().int().positive().optional().nullable(),
  latitude: z.union([latitudeField, z.string().transform(Number)]).optional().nullable(),
  longitude: z.union([longitudeField, z.string().transform(Number)]).optional().nullable(),
});

// ─── Create Schema ──────────────────────────────────────────────────────────

const createListingSchema = z.object({
  // Core fields
  title: titleField,
  description: descriptionField,
  propertyCategory: propertyCategoryEnum.optional().nullable(),
  propertyType: propertyTypeEnum,
  listingType: listingTypeEnum.default("SALE"),
  status: listingStatusEnum.default("DRAFT"),
  moderationStatus: moderationStatusEnum.default("PENDING_REVIEW"),

  // Pricing
  price: z.union([priceField, z.string().min(1, "السعر مطلوب")]),
  pricePerMeter: z.coerce.number().nonnegative().optional().nullable(),
  rentFrequency: z.enum(["MONTHLY", "YEARLY", "DAILY", "WEEKLY"], {
    errorMap: () => ({ message: "فترة الإيجار غير صالحة" }),
  }).optional().nullable(),

  // Specs
  bedrooms: z.coerce.number().int("عدد غرف النوم يجب أن يكون عدداً صحيحاً").nonnegative().max(50, "عدد غرف النوم لا يمكن أن يتجاوز ٥٠").optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().max(50).optional().nullable(),
  livingRooms: z.coerce.number().int().nonnegative().max(20).optional().nullable(),
  squareFeet: z.union([areaField, z.string().transform(Number)]).optional().nullable(),
  lotSize: z.coerce.number().nonnegative().optional().nullable(),
  floorNumber: z.coerce.number().int().min(-5, "الطابق لا يمكن أن يكون أقل من -٥").max(200).optional().nullable(),
  totalFloors: z.coerce.number().int().positive().max(200, "عدد الطوابق لا يمكن أن يتجاوز ٢٠٠").optional().nullable(),
  yearBuilt: z.coerce.number().int().min(1900, "سنة البناء يجب أن تكون بعد ١٩٠٠").max(2030, "سنة البناء لا يمكن أن تكون في المستقبل البعيد").optional().nullable(),
  garageSpaces: z.coerce.number().int().nonnegative().max(20).optional().nullable(),
  furnishing: furnishingEnum.optional().nullable(),
  facingDirection: facingDirectionEnum.optional().nullable(),

  // Location (flat or nested)
  ...locationSchema.shape,

  // Amenities & features
  features: z.array(z.string().min(1)).max(50, "لا يمكن إضافة أكثر من ٥٠ ميزة").optional(),
  amenities: z.array(amenityEnum).max(25, "لا يمكن تحديد أكثر من ٢٥ مرفق").optional(),

  // Media
  images: z.array(z.object({
    url: z.string().url("رابط الصورة غير صالح"),
    alt: z.string().max(200).optional(),
    caption: z.string().max(500).optional(),
    isPrimary: z.boolean().optional(),
    order: z.coerce.number().int().nonnegative().optional(),
  })).max(50, "لا يمكن رفع أكثر من ٥٠ صورة").optional(),
  videoUrl: z.string().url("رابط الفيديو غير صالح").optional().nullable(),
  virtualTourUrl: z.string().url("رابط الجولة الافتراضية غير صالح").optional().nullable(),

  // Ownership
  ownerId: z.string().uuid("معرف المالك غير صالح").optional().nullable(),
  createdBy: z.string().uuid("معرف المنشئ غير صالح").optional().nullable(),
  agentId: z.string().uuid("معرف الوكيل غير صالح").optional().nullable(),
  organizationId: z.string().uuid("معرف المنظمة غير صالح").optional().nullable(),

  // Meta
  deedNumber: z.string().max(50, "رقم الصك لا يمكن أن يتجاوز ٥٠ حرف").optional().nullable(),
  licenseNumber: z.string().max(50, "رقم الرخصة لا يمكن أن يتجاوز ٥٠ حرف").optional().nullable(),
  advertisingLicense: z.string().max(50).optional().nullable(),
  availableFrom: z.string().datetime({ message: "تاريخ التوفر غير صالح" }).optional().nullable(),
  expiresAt: z.string().datetime({ message: "تاريخ انتهاء الإعلان غير صالح" }).optional().nullable(),
});

// ─── Update Schema ──────────────────────────────────────────────────────────

const updateListingSchema = z.object({
  title: titleField.optional(),
  description: descriptionField,
  propertyCategory: propertyCategoryEnum.optional().nullable(),
  propertyType: propertyTypeEnum.optional(),
  listingType: listingTypeEnum.optional(),
  status: listingStatusEnum.optional(),
  moderationStatus: moderationStatusEnum.optional(),

  price: z.union([priceField, z.string()]).optional().nullable(),
  pricePerMeter: z.coerce.number().nonnegative().optional().nullable(),
  rentFrequency: z.enum(["MONTHLY", "YEARLY", "DAILY", "WEEKLY"]).optional().nullable(),

  bedrooms: z.coerce.number().int().nonnegative().max(50).optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().max(50).optional().nullable(),
  livingRooms: z.coerce.number().int().nonnegative().max(20).optional().nullable(),
  squareFeet: z.union([z.coerce.number().nonnegative(), z.string()]).optional().nullable(),
  lotSize: z.coerce.number().nonnegative().optional().nullable(),
  floorNumber: z.coerce.number().int().min(-5).max(200).optional().nullable(),
  totalFloors: z.coerce.number().int().positive().max(200).optional().nullable(),
  yearBuilt: z.coerce.number().int().min(1900).max(2030).optional().nullable(),
  garageSpaces: z.coerce.number().int().nonnegative().max(20).optional().nullable(),
  furnishing: furnishingEnum.optional().nullable(),
  facingDirection: facingDirectionEnum.optional().nullable(),

  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zipCode: z.string().max(10).optional().nullable(),
  regionId: z.coerce.number().int().positive().optional().nullable(),
  cityId: z.coerce.number().int().positive().optional().nullable(),
  districtId: z.coerce.number().int().positive().optional().nullable(),
  latitude: z.union([latitudeField, z.string().transform(Number)]).optional().nullable(),
  longitude: z.union([longitudeField, z.string().transform(Number)]).optional().nullable(),

  features: z.array(z.string()).max(50).optional(),
  amenities: z.array(amenityEnum).max(25).optional(),
  images: z.array(z.object({
    url: z.string().url("رابط الصورة غير صالح"),
    alt: z.string().max(200).optional(),
    caption: z.string().max(500).optional(),
    isPrimary: z.boolean().optional(),
    order: z.coerce.number().int().nonnegative().optional(),
  })).max(50).optional(),
  videoUrl: z.string().url().optional().nullable(),
  virtualTourUrl: z.string().url().optional().nullable(),

  ownerId: z.string().uuid().optional().nullable(),
  createdBy: z.string().uuid().optional().nullable(),
  agentId: z.string().uuid().optional().nullable(),
  organizationId: z.string().uuid().optional().nullable(),

  deedNumber: z.string().max(50).optional().nullable(),
  licenseNumber: z.string().max(50).optional().nullable(),
  advertisingLicense: z.string().max(50).optional().nullable(),
  availableFrom: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

// ─── Search Schema ──────────────────────────────────────────────────────────

const searchListingsSchema = z.object({
  search: z.string().max(200, "نص البحث لا يمكن أن يتجاوز ٢٠٠ حرف").optional(),
  propertyCategory: z.union([propertyCategoryEnum, z.array(propertyCategoryEnum)]).optional(),
  propertyType: z.union([propertyTypeEnum, z.array(propertyTypeEnum)]).optional(),
  listingType: z.union([listingTypeEnum, z.array(listingTypeEnum)]).optional(),
  status: z.union([listingStatusEnum, z.array(listingStatusEnum)]).optional(),
  moderationStatus: z.union([moderationStatusEnum, z.array(moderationStatusEnum)]).optional(),

  // Price range
  minPrice: z.coerce.number().nonnegative("الحد الأدنى للسعر يجب أن يكون موجباً").optional(),
  maxPrice: z.coerce.number().nonnegative("الحد الأقصى للسعر يجب أن يكون موجباً").optional(),

  // Specs filter
  minBedrooms: z.coerce.number().int().nonnegative().optional(),
  maxBedrooms: z.coerce.number().int().nonnegative().optional(),
  minBathrooms: z.coerce.number().int().nonnegative().optional(),
  minArea: z.coerce.number().nonnegative().optional(),
  maxArea: z.coerce.number().nonnegative().optional(),
  furnishing: furnishingEnum.optional(),

  // Location filter
  city: z.string().optional(),
  district: z.string().optional(),
  region: z.string().optional(),
  cityId: z.coerce.number().int().optional(),
  regionId: z.coerce.number().int().optional(),

  // Geo search (nearby)
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive("نصف القطر يجب أن يكون موجباً").max(500, "نصف القطر لا يمكن أن يتجاوز ٥٠٠ كم").optional(),

  // Amenities
  amenities: z.union([z.string(), z.array(z.string())]).optional(),

  // Agent / org
  agentId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),

  // Date filter
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
  sortBy: z.enum([
    "price", "createdAt", "updatedAt", "squareFeet", "bedrooms", "relevance",
  ], { errorMap: () => ({ message: "حقل الترتيب غير صالح" }) }).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine(
  (data) => {
    if (data.minPrice !== undefined && data.maxPrice !== undefined) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  { message: "الحد الأدنى للسعر يجب أن يكون أقل من الحد الأقصى", path: ["minPrice"] }
).refine(
  (data) => {
    if (data.latitude !== undefined || data.longitude !== undefined) {
      return data.latitude !== undefined && data.longitude !== undefined;
    }
    return true;
  },
  { message: "يجب تحديد كل من خط العرض وخط الطول للبحث الجغرافي", path: ["latitude"] }
);

// ─── Moderation Schema ──────────────────────────────────────────────────────

const moderationActionSchema = z.object({
  listingId: z.string().uuid("معرف الإعلان غير صالح"),
  action: z.enum(["APPROVE", "REJECT", "FLAG", "REQUEST_CHANGES"], {
    errorMap: () => ({ message: "إجراء المراجعة غير صالح" }),
  }),
  reason: z.string().max(1000, "سبب المراجعة لا يمكن أن يتجاوز ١٠٠٠ حرف").optional().nullable(),
  requiredChanges: z.array(z.string().min(1).max(500)).max(10, "لا يمكن طلب أكثر من ١٠ تعديلات").optional(),
  internalNote: z.string().max(2000, "الملاحظة الداخلية لا يمكن أن تتجاوز ٢٠٠٠ حرف").optional().nullable(),
}).refine(
  (data) => {
    if (data.action === "REJECT" || data.action === "FLAG") {
      return data.reason !== undefined && data.reason !== null && data.reason.length > 0;
    }
    return true;
  },
  { message: "سبب الرفض أو التعليم مطلوب", path: ["reason"] }
);

// ─── Bulk Operations ────────────────────────────────────────────────────────

const bulkUpdateListingsSchema = z.object({
  listingIds: z
    .array(z.string().uuid("معرف الإعلان غير صالح"))
    .min(1, "يجب تحديد إعلان واحد على الأقل")
    .max(100, "لا يمكن تحديث أكثر من ١٠٠ إعلان في المرة الواحدة"),
  updates: z.object({
    status: listingStatusEnum.optional(),
    moderationStatus: moderationStatusEnum.optional(),
    agentId: z.string().uuid().optional().nullable(),
  }),
});

// ─── Exports ────────────────────────────────────────────────────────────────

export const listingValidators = {
  create: createListingSchema,
  update: updateListingSchema,
  search: searchListingsSchema,
  moderate: moderationActionSchema,
  bulkUpdate: bulkUpdateListingsSchema,
} as const;

/** Inferred TypeScript types from Zod schemas */
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type SearchListingsInput = z.infer<typeof searchListingsSchema>;
export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
export type BulkUpdateListingsInput = z.infer<typeof bulkUpdateListingsSchema>;
