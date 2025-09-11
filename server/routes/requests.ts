import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";

const router = express.Router();

const RequestSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  gender: z.string().optional(),
  requestType: z.enum(["buy", "rent"]).default("buy"),
  pricePeriod: z.string().optional(),
  propertyTypes: z.array(z.string()).optional(),
  propertyKind: z.string().optional(),
  cities: z.array(z.string()).optional(),
  city: z.string().optional(),
  neighborhoods: z.array(z.string()).optional(),
  neighborhood: z.string().optional(),
  minPrice: z.union([z.number(), z.string()]).optional(),
  maxPrice: z.union([z.number(), z.string()]).optional(),
  minBedrooms: z.union([z.number(), z.string()]).optional(),
  maxBedrooms: z.union([z.number(), z.string()]).optional(),
  bedrooms: z.union([z.number(), z.string()]).optional(),
  bathrooms: z.union([z.number(), z.string()]).optional(),
  minBathrooms: z.union([z.number(), z.string()]).optional(),
  livingRooms: z.union([z.number(), z.string()]).optional(),
  driverRooms: z.union([z.number(), z.string()]).optional(),
  maidRooms: z.union([z.number(), z.string()]).optional(),
  hasSeparateMajles: z.boolean().optional(),
  minArea: z.union([z.number(), z.string()]).optional(),
  maxArea: z.union([z.number(), z.string()]).optional(),
  furnishing: z.string().optional(),
  orientation: z.string().optional(),
  hasElevator: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  timeframe: z.string().optional(),
  requestDate: z.preprocess((v) => (v ? new Date(String(v)) : undefined), z.date().optional()),
  notes: z.string().optional(),
});

router.post("/", async (req, res) => {
  try {
    const data = RequestSchema.parse(req.body);
    const userId = (req as any)?.user?.id || undefined;
    const created = await storage.createRealEstateRequest({
      ...data,
      // normalize numeric strings
      minPrice: data.minPrice ? Number(data.minPrice) : undefined,
      maxPrice: data.maxPrice ? Number(data.maxPrice) : undefined,
      minBedrooms: data.minBedrooms ? Number(data.minBedrooms) : undefined,
      maxBedrooms: data.maxBedrooms ? Number(data.maxBedrooms) : undefined,
      bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
      minBathrooms: data.minBathrooms ? Number(data.minBathrooms) : undefined,
      livingRooms: data.livingRooms ? Number(data.livingRooms) : undefined,
      driverRooms: data.driverRooms ? Number(data.driverRooms) : undefined,
      maidRooms: data.maidRooms ? Number(data.maidRooms) : undefined,
      minArea: data.minArea ? Number(data.minArea) : undefined,
      maxArea: data.maxArea ? Number(data.maxArea) : undefined,
      customerId: userId,
      requestDate: data.requestDate ?? new Date(),
    } as any);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request", errors: err.errors });
    }
    console.error("Error creating real estate request:", err);
    res.status(500).json({ message: "Failed to create request" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const items = await storage.listRealEstateRequests();
    res.json(items);
  } catch (err) {
    console.error("Error listing real estate requests:", err);
    res.status(500).json({ message: "Failed to list requests" });
  }
});

export default router;

// Admin: update status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: "status is required" });
    const updated = await storage.updateRealEstateRequestStatus(req.params.id, String(status));
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating request status:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// Admin: export CSV
router.get("/export", async (_req, res) => {
  try {
    const items = await storage.listRealEstateRequests();
    const header = [
      "id","createdAt","requestDate","status","customerName","customerEmail","customerPhone","gender","requestType","pricePeriod","city","neighborhood","cities","neighborhoods","propertyKind","propertyTypes","minPrice","maxPrice","minBedrooms","maxBedrooms","bedrooms","bathrooms","minBathrooms","minArea","maxArea","livingRooms","driverRooms","maidRooms","hasSeparateMajles","furnishing","orientation","hasElevator","hasParking","timeframe","notes"
    ];
    const lines = [header.join(",")];
    for (const r of items) {
      const row = [
        r.id,
        (r as any).createdAt?.toISOString?.() || String((r as any).createdAt || ""),
        (r as any).requestDate ? (new Date((r as any).requestDate)).toISOString() : "",
        (r as any).status || "",
        r.customerName,
        r.customerEmail,
        r.customerPhone || "",
        (r as any).gender || "",
        r.requestType,
        (r as any).pricePeriod || "",
        (r as any).city || "",
        (r as any).neighborhood || "",
        (r as any).cities?.join(";") || "",
        (r as any).neighborhoods?.join(";") || "",
        (r as any).propertyKind || "",
        (r as any).propertyTypes?.join(";") || "",
        String((r as any).minPrice ?? ""),
        String((r as any).maxPrice ?? ""),
        String((r as any).minBedrooms ?? ""),
        String((r as any).maxBedrooms ?? ""),
        String((r as any).bedrooms ?? ""),
        String((r as any).bathrooms ?? ""),
        String((r as any).minBathrooms ?? ""),
        String((r as any).minArea ?? ""),
        String((r as any).maxArea ?? ""),
        String((r as any).livingRooms ?? ""),
        String((r as any).driverRooms ?? ""),
        String((r as any).maidRooms ?? ""),
        String((r as any).hasSeparateMajles ?? ""),
        String((r as any).furnishing ?? ""),
        String((r as any).orientation ?? ""),
        String((r as any).hasElevator ?? ""),
        String((r as any).hasParking ?? ""),
        String((r as any).timeframe ?? ""),
        JSON.stringify((r as any).notes ?? "").replaceAll(","," ")
      ];
      lines.push(row.map(v => `"${String(v).replaceAll('"','""')}"`).join(","));
    }
    const csv = lines.join("\n");
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="real-estate-requests.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error exporting requests:", err);
    res.status(500).json({ message: "Failed to export" });
  }
});
