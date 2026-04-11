/**
 * routes/deal-documents.ts — Document attachment CRUD per deal.
 *
 * Mounted at `/api/deals` (nested: `/:dealId/documents`) in `apps/api/routes.ts`.
 *
 * | Method | Path                            | Auth? | Purpose                |
 * |--------|---------------------------------|-------|------------------------|
 * | GET    | /:dealId/documents              | Yes   | List attached files     |
 * | POST   | /:dealId/documents              | Yes   | Upload (base64 → disk)  |
 * | DELETE | /:dealId/documents/:docId       | Yes   | Delete file + DB row    |
 *
 * Files stored locally in `uploads/deals/` — S3 migration planned.
 * Base64 data URLs are decoded, written to disk, and the path stored in
 * `deal_documents.fileUrl`.
 *
 * Consumer: deal detail sheet in `pipeline/index.tsx` (Documents tab).
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const router = Router();
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "deals");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// GET /api/deals/:dealId/documents — List documents
/**
 * Fetch a single :dealId by ID.
 *
 * @route   GET /api/deal-documents/:dealId/documents
 * @auth    Required — any authenticated user
 */
router.get("/:dealId/documents", authenticateToken, async (req, res) => {
  try {
    const docs = await prisma.deal_documents.findMany({
      where: { dealId: req.params.dealId },
      include: { uploader: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(docs.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      fileUrl: d.fileUrl,
      uploadedBy: `${d.uploader.firstName} ${d.uploader.lastName}`,
      notes: d.notes,
      createdAt: d.createdAt,
    })));
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "فشل تحميل المستندات" });
  }
});

// POST /api/deals/:dealId/documents — Upload document (base64)
/**
 * Create a new :dealId record.
 *
 * @route   POST /api/deal-documents/:dealId/documents
 * @auth    Required — any authenticated user
 */
router.post("/:dealId/documents", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const schema = z.object({
      fileName: z.string().min(1),
      fileData: z.string().min(1), // base64 data URL
      fileType: z.string().optional(),
      notes: z.string().optional(),
    });

    const data = schema.parse(req.body);

    // Extract base64 content
    const matches = data.fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ message: "صيغة الملف غير صالحة" });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "bin";
    const storedName = `${randomUUID()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, storedName);

    fs.writeFileSync(filePath, buffer);

    const doc = await prisma.deal_documents.create({
      data: {
        dealId: req.params.dealId,
        fileName: data.fileName,
        fileUrl: `/uploads/deals/${storedName}`,
        fileType: data.fileType || ext,
        fileSize: buffer.length,
        uploadedBy: user.id,
        notes: data.notes,
      },
    });

    res.status(201).json(doc);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة" });
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "فشل رفع المستند" });
  }
});

// DELETE /api/deals/:dealId/documents/:docId — Delete document
/**
 * Delete a :dealId record.
 *
 * @route   DELETE /api/deal-documents/:dealId/documents/:docId
 * @auth    Required — any authenticated user
 */
router.delete("/:dealId/documents/:docId", authenticateToken, async (req, res) => {
  try {
    const doc = await prisma.deal_documents.findUnique({ where: { id: req.params.docId } });
    if (!doc) return res.status(404).json({ message: "المستند غير موجود" });

    // Delete file from disk
    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.deal_documents.delete({ where: { id: req.params.docId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "فشل حذف المستند" });
  }
});

export default router;
