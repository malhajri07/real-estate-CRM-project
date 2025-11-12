// @ts-nocheck
import { prisma } from "../prismaClient";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const MediaCreateSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  url: z.string().url(),
  mimeType: z.string(),
  size: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

const MediaUpdateSchema = z.object({
  alt: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const MediaService = {
  async listMedia(options: {
    mimeType?: string;
    uploadedBy?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const {
      mimeType,
      uploadedBy,
      page = 1,
      pageSize = 50,
      search,
    } = options;

    const where: any = {};
    if (mimeType) {
      where.mimeType = mimeType;
    }
    if (uploadedBy) {
      where.uploadedBy = uploadedBy;
    }
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { originalName: { contains: search, mode: "insensitive" } },
        { alt: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    const [media, total] = await Promise.all([
      prisma.mediaLibrary.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              usages: true,
            },
          },
        },
      }),
      prisma.mediaLibrary.count({ where }),
    ]);

    return {
      items: media.map((item) => ({
        ...item,
        usageCount: item._count.usages,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getMedia(id: string) {
    const media = await prisma.mediaLibrary.findUnique({
      where: { id },
      include: {
        usages: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!media) {
      throw new Error("Media not found");
    }

    return media;
  },

  async createMedia(params: {
    payload: z.infer<typeof MediaCreateSchema>;
    uploadedBy?: string;
  }) {
    const { payload, uploadedBy } = params;
    const validated = MediaCreateSchema.parse(payload);

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(validated.mimeType)) {
      throw new Error(`MIME type ${validated.mimeType} not allowed`);
    }

    // Validate file size
    if (validated.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE} bytes`);
    }

    const media = await prisma.mediaLibrary.create({
      data: {
        filename: validated.filename,
        originalName: validated.originalName,
        url: validated.url,
        mimeType: validated.mimeType,
        size: validated.size,
        width: validated.width,
        height: validated.height,
        alt: validated.alt,
        title: validated.title,
        description: validated.description,
        uploadedBy,
      },
    });

    return media;
  },

  async updateMedia(params: {
    id: string;
    payload: z.infer<typeof MediaUpdateSchema>;
  }) {
    const { id, payload } = params;
    const validated = MediaUpdateSchema.parse(payload);

    const existing = await prisma.mediaLibrary.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Media not found");
    }

    return prisma.mediaLibrary.update({
      where: { id },
      data: {
        alt: validated.alt,
        title: validated.title,
        description: validated.description,
      },
    });
  },

  async deleteMedia(params: { id: string }) {
    const { id } = params;
    const media = await prisma.mediaLibrary.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!media) {
      throw new Error("Media not found");
    }

    // Check if media is in use
    if (media._count.usages > 0) {
      throw new Error("Cannot delete media that is in use");
    }

    // Delete file from filesystem if it exists
    try {
      if (media.url.startsWith("/uploads/")) {
        const filePath = path.join(process.cwd(), "public", media.url);
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue with database deletion even if file deletion fails
    }

    await prisma.mediaLibrary.delete({ where: { id } });
  },

  async trackUsage(params: {
    mediaId: string;
    entityType: string;
    entityId: string;
  }) {
    const { mediaId, entityType, entityId } = params;

    // Check if usage already exists
    const existing = await prisma.mediaUsage.findFirst({
      where: {
        mediaId,
        entityType,
        entityId,
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.mediaUsage.create({
      data: {
        mediaId,
        entityType,
        entityId,
      },
    });
  },

  async removeUsage(params: {
    mediaId: string;
    entityType: string;
    entityId: string;
  }) {
    const { mediaId, entityType, entityId } = params;

    await prisma.mediaUsage.deleteMany({
      where: {
        mediaId,
        entityType,
        entityId,
      },
    });
  },

  async getUsageCount(mediaId: string) {
    return prisma.mediaUsage.count({
      where: { mediaId },
    });
  },
};

