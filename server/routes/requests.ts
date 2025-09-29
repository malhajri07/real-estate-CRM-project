import express from "express";
import { z } from "zod";
import { storage } from "../storage-prisma";

const router = express.Router();

const RequestSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  mobileNumber: z.string().trim().min(6),
  email: z.string().trim().email(),
  nationality: z.string().trim().min(2),
  age: z.coerce.number().int().min(0).max(120),
  monthlyIncome: z.coerce.number().nonnegative(),
  gender: z.enum(["male", "female", "other"]),
  typeOfProperty: z.string().trim().min(1),
  typeOfContract: z.string().trim().min(1),
  numberOfRooms: z.coerce.number().int().min(0),
  numberOfBathrooms: z.coerce.number().int().min(0),
  numberOfLivingRooms: z.coerce.number().int().min(0),
  houseDirection: z.string().trim().min(1).optional(),
  budgetSize: z.coerce.number().nonnegative(),
  hasMaidRoom: z.boolean().optional(),
  hasDriverRoom: z.boolean().optional(),
  kitchenInstalled: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  parkingAvailable: z.boolean().optional(),
  city: z.string().trim().min(1),
  district: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  sqm: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().optional(),
});

router.post("/", async (req, res) => {
  try {
    const data = RequestSchema.parse(req.body);
    const created = await storage.createRealEstateRequest({
      ...data,
      hasMaidRoom: data.hasMaidRoom ?? false,
      hasDriverRoom: data.hasDriverRoom ?? false,
      kitchenInstalled: data.kitchenInstalled ?? false,
      hasElevator: data.hasElevator ?? false,
      parkingAvailable: data.parkingAvailable ?? false,
    });
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
    const items = await storage.getAllRealEstateRequests();
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
    const updated = await storage.updateRealEstateRequest(req.params.id, { status: String(status) });
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
    const items = await storage.getAllRealEstateRequests();
    const header = [
      "id",
      "createdAt",
      "first_name",
      "last_name",
      "mobile_number",
      "email",
      "nationality",
      "age",
      "monthly_income",
      "gender",
      "type_of_property",
      "type_of_contract",
      "number_of_rooms",
      "number_of_bathrooms",
      "number_of_living_rooms",
      "budget_size",
      "city",
      "district",
      "sqm",
      "notes"
    ];
    const lines = [header.join(",")];
    for (const r of items) {
      const row = [
        r.id,
        (r as any).createdAt?.toISOString?.() || String((r as any).createdAt || ""),
        (r as any).firstName || "",
        (r as any).lastName || "",
        (r as any).mobileNumber || "",
        (r as any).email || "",
        (r as any).nationality || "",
        String((r as any).age ?? ""),
        String((r as any).monthlyIncome ?? ""),
        (r as any).gender || "",
        (r as any).typeOfProperty || "",
        (r as any).typeOfContract || "",
        String((r as any).numberOfRooms ?? ""),
        String((r as any).numberOfBathrooms ?? ""),
        String((r as any).numberOfLivingRooms ?? ""),
        String((r as any).budgetSize ?? ""),
        (r as any).city || "",
        (r as any).district || "",
        String((r as any).sqm ?? ""),
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
