import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";

const router = express.Router();

const MAX_VIDEO_SIZE_BYTES = 1024 * 1024;

const submissionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(30),
  propertyType: z.string().min(1),
  propertyCategory: z.string().min(1),
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

router.post("/", async (req, res) => {
  try {
    const parsed = submissionSchema.parse(req.body);

    const imageData = parsed.media.images ?? [];
    const videoData = parsed.media.videos ?? [];

    for (const video of videoData) {
      const sizeBytes = calculateBase64Size(video);
      if (sizeBytes > MAX_VIDEO_SIZE_BYTES) {
        return res.status(400).json({ message: "حجم مقطع الفيديو يتجاوز 1 ميجابايت." });
      }
    }

    const featuresPayload = {
      submissionSource: "public-unverified",
      listingType: parsed.listingType,
      state: parsed.state,
      zipCode: parsed.zipCode,
      landArea: parsed.landArea,
      completionYear: parsed.completionYear,
      furnishing: parsed.furnishing,
      occupancy: parsed.occupancy,
      maintenanceFees: parsed.maintenanceFees,
      paymentPlan: parsed.paymentPlan,
      amenities: parsed.amenities ?? [],
      additionalNotes: parsed.additionalNotes,
      contact: parsed.contact,
      media: { videos: videoData },
      metadata: {
        submittedAt: new Date().toISOString(),
        reviewStatus: "pending",
        channel: "public-form",
      },
    };

    const propertyPayload: Record<string, unknown> = {
      title: parsed.title,
      description: parsed.description,
      type: parsed.propertyType,
      category: parsed.propertyCategory,
      city: parsed.city,
      district: parsed.district,
      address: parsed.address,
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      areaSqm: parsed.areaSqm,
      price: parsed.price,
      status: "pending",
      visibility: "public",
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      features: JSON.stringify(featuresPayload),
      photos: JSON.stringify(imageData),
    };

    const created = await storage.createProperty(propertyPayload, "public-unverified-user", "default-tenant");

    res.status(201).json({ id: created.id, message: "تم استلام الإعلان وسيتم مراجعته." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "يرجى التحقق من الحقول المدخلة", errors: error.errors });
    }
    console.error("Error creating unverified listing:", error);
    res.status(500).json({ message: "تعذر معالجة الطلب حالياً" });
  }
});

export default router;
