import express from "express";
import multer from "multer";
import { z } from "zod";
import { MediaService } from "../services/mediaService";
import * as path from "path";
import * as fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Extend Express Request type to include file from multer
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "public", "uploads");
const storage = multer.diskStorage({
  destination: async (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

function getAuth(req: any) {
  const user = req.session?.user || req.user;
  const roles: string[] = Array.isArray(user?.roles)
    ? user.roles
    : typeof user?.roles === "string"
    ? [user.roles]
    : [];
  return {
    id: user?.id ?? "anonymous",
    roles,
  };
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    const auth = getAuth(req);
    const roleSet = new Set(auth.roles.map((r) => r.toUpperCase()));
    const allowed = roles.some((r) => roleSet.has(r.toUpperCase()));
    if (!allowed) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

// Get image dimensions helper
async function getImageDimensions(
  filePath: string
): Promise<{ width: number; height: number } | null> {
  try {
    // For now, return null - can be enhanced with sharp or jimp
    // This would require additional dependencies
    return null;
  } catch {
    return null;
  }
}

// List media
router.get(
  "/media",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const {
        mimeType,
        uploadedBy,
        page = "1",
        pageSize = "50",
        search,
      } = req.query as Record<string, string | undefined>;

      const result = await MediaService.listMedia({
        mimeType,
        uploadedBy,
        page: parseInt(page || "1", 10),
        pageSize: parseInt(pageSize || "50", 10),
        search,
      });

      res.json(result);
    } catch (error) {
      console.error("Failed to list media:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to load media",
      });
    }
  }
);

// Get media by ID
router.get(
  "/media/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const media = await MediaService.getMedia(req.params.id);
      res.json(media);
    } catch (error) {
      console.error("Failed to get media:", error);
      res.status(404).json({
        message: error instanceof Error ? error.message : "Media not found",
      });
    }
  }
);

// Upload media
router.post(
  "/media",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const auth = getAuth(req);
      const fileUrl = `/uploads/${req.file.filename}`;
      const dimensions = await getImageDimensions(req.file.path);

      const media = await MediaService.createMedia({
        payload: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: fileUrl,
          mimeType: req.file.mimetype,
          size: req.file.size,
          width: dimensions?.width,
          height: dimensions?.height,
          alt: req.body.alt,
          title: req.body.title,
          description: req.body.description,
        },
        uploadedBy: auth.id,
      });

      res.status(201).json(media);
    } catch (error) {
      console.error("Failed to upload media:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to upload media",
      });
    }
  }
);

// Update media metadata
router.put(
  "/media/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const media = await MediaService.updateMedia({
        id: req.params.id,
        payload: req.body,
      });
      res.json(media);
    } catch (error) {
      console.error("Failed to update media:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to update media",
      });
    }
  }
);

// Delete media
router.delete(
  "/media/:id",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN"]),
  async (req, res) => {
    try {
      await MediaService.deleteMedia({ id: req.params.id });
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete media:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to delete media",
      });
    }
  }
);

// Track media usage
router.post(
  "/media/:id/usage",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const { entityType, entityId } = req.body;
      const usage = await MediaService.trackUsage({
        mediaId: req.params.id,
        entityType,
        entityId,
      });
      res.json(usage);
    } catch (error) {
      console.error("Failed to track usage:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to track usage",
      });
    }
  }
);

// Remove media usage
router.delete(
  "/media/:id/usage",
  requireRole(["WEBSITE_ADMIN", "CMS_ADMIN", "EDITOR"]),
  async (req, res) => {
    try {
      const { entityType, entityId } = req.body;
      await MediaService.removeUsage({
        mediaId: req.params.id,
        entityType,
        entityId,
      });
      res.status(204).send();
    } catch (error) {
      console.error("Failed to remove usage:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to remove usage",
      });
    }
  }
);

export default router;

