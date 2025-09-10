import express from "express";
import { z } from "zod";
import { storage } from "../storage";

const router = express.Router();

const InquirySchema = z.object({
  propertyId: z.string(),
  customerId: z.string().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  inquiryType: z.string().optional(),
  message: z.string().optional(),
  preferredContactMethod: z.string().optional(),
  preferredContactTime: z.string().optional(),
  requestedViewingDate: z.preprocess((v) => (v ? new Date(String(v)) : null), z.date().nullable().optional()),
});

router.post("/", async (req, res) => {
  try {
    const data = InquirySchema.parse(req.body);
    const userId = (req as any)?.user?.id || null;
    const rec = await storage.createPropertyInquiry({
      ...data,
      customerId: data.customerId || userId || null,
      status: 'new',
    } as any);
    res.status(201).json(rec);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid inquiry", errors: err.errors });
    }
    console.error("Error creating inquiry:", err);
    res.status(500).json({ message: "Failed to create inquiry" });
  }
});

export default router;

