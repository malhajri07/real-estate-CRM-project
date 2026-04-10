/**
 * routes/community.ts — Agent community forum (posts, comments, reactions).
 *
 * Mounted at `/api/community`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | /posts | Yes | List posts (filterable by type/channel/tags) |
 * | GET | /posts/:id | Yes | Get post with comments |
 * | POST | /posts | Yes | Create new post |
 * | PUT | /posts/:id | Yes | Edit post |
 * | DELETE | /posts/:id | Yes | Delete post |
 * | POST | /posts/:id/comments | Yes | Add comment to post |
 * | POST | /posts/:id/react | Yes | Add reaction to post |
 * | GET | /channels | Yes | List available forum channels |
 *
 * Consumer: platform forum page (`/platform/forum`), query key `community-posts`.
 */

import express from "express";
import { z } from "zod";
import { authenticateToken } from "../src/middleware/auth.middleware";
import { communityService } from "../src/services/community.service";

const router = express.Router();

// Validation Schemas
const createPostSchema = z.object({
  content: z.string().min(3).max(5000),
  type: z.enum(["DISCUSSION", "NEWS", "ANNOUNCEMENT", "DEAL", "ALERT"]).optional(),
  tags: z.array(z.string()).optional(),
  channelId: z.string().uuid().optional().nullable(),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["IMAGE", "VIDEO"]),
        order: z.number().optional(),
      })
    )
    .optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

const createChannelSchema = z.object({
  nameAr: z.string().min(2).max(100),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

const updateChannelSchema = z.object({
  nameAr: z.string().min(2).max(100).optional(),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/community/channels
router.get("/channels", authenticateToken, async (req, res) => {
  try {
    const channels = await communityService.getChannels();
    res.json({ success: true, data: channels });
  } catch (error) {
    console.error("Community Channels Error:", error);
    res.status(500).json({ message: "فشل تحميل القنوات" });
  }
});

// POST /api/community/channels
router.post("/channels", authenticateToken, async (req, res) => {
  try {
    const data = createChannelSchema.parse(req.body);
    const userId = req.user!.id;
    const channel = await communityService.createChannel(userId, data);
    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    }
    console.error("Create Channel Error:", error);
    res.status(500).json({ message: "فشل إنشاء القناة" });
  }
});

// GET /api/community/channels/:id
router.get("/channels/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await communityService.getChannelById(id);
    if (!channel) return res.status(404).json({ message: "القناة غير موجودة" });
    res.json({ success: true, data: channel });
  } catch (error) {
    console.error("Get Channel Error:", error);
    res.status(500).json({ message: "فشل تحميل القناة" });
  }
});

// PATCH /api/community/channels/:id
router.patch("/channels/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateChannelSchema.parse(req.body);
    const userId = req.user!.id;
    const channel = await communityService.updateChannel(id, userId, data);
    if (!channel) return res.status(404).json({ message: "القناة غير موجودة أو لا تملك صلاحية التعديل" });
    res.json({ success: true, data: channel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    }
    console.error("Update Channel Error:", error);
    res.status(500).json({ message: "فشل تحديث القناة" });
  }
});

// DELETE /api/community/channels/:id
router.delete("/channels/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const channel = await communityService.deleteChannel(id, userId);
    if (!channel) return res.status(404).json({ message: "القناة غير موجودة أو لا تملك صلاحية الحذف" });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Channel Error:", error);
    res.status(500).json({ message: "فشل حذف القناة" });
  }
});

// GET /api/community/feed
router.get("/feed", authenticateToken, async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const type = req.query.type as string | undefined;
    const tag = req.query.tag as string | undefined;
    const channelId = req.query.channelId as string | undefined;

    const result = await communityService.getFeed({ page, limit, type, tag, channelId });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Community Feed Error:", error);
    res.status(500).json({ message: "فشل تحميل المنشورات" });
  }
});

// POST /api/community/post
router.post("/post", authenticateToken, async (req, res) => {
  try {
    const data = createPostSchema.parse(req.body);
    const userId = req.user!.id;

    const post = await communityService.createPost(userId, {
      content: data.content,
      type: data.type || "DISCUSSION",
      tags: data.tags,
      channelId: data.channelId ?? undefined,
      media: data.media,
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    }
    console.error("Create Post Error:", error);
    res.status(500).json({ message: "فشل إنشاء المنشور" });
  }
});

// POST /api/community/post/:id/like
router.post("/post/:id/like", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await communityService.toggleLike(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Like Post Error:", error);
    res.status(500).json({ message: "فشل الإعجاب بالمنشور" });
  }
});

// POST /api/community/post/:id/comment
router.post("/post/:id/comment", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = createCommentSchema.parse(req.body);
    const userId = req.user!.id;

    const comment = await communityService.addComment(userId, id, content);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    }
    console.error("Add Comment Error:", error);
    res.status(500).json({ message: "فشل إضافة التعليق" });
  }
});

export default router;
