import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../src/middleware/auth.middleware';
import { communityService } from '../src/services/community.service';
import { UserRole } from '@shared/rbac'; // Or wherever UserRole is defined

const router = express.Router();

// Validation Schemas
const createPostSchema = z.object({
    content: z.string().min(3).max(2000),
    type: z.enum(["DISCUSSION", "DEAL", "ALERT"]).optional(),
    tags: z.array(z.string()).optional()
});

const createCommentSchema = z.object({
    content: z.string().min(1).max(1000)
});

// GET /api/community/feed
router.get('/feed', authenticateToken, async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const type = req.query.type as string | undefined;
        const tag = req.query.tag as string | undefined;

        const result = await communityService.getFeed({ page, limit, type, tag });
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Community Feed Error:', error);
        res.status(500).json({ message: 'Failed to fetch community feed' });
    }
});

// POST /api/community/post
router.post('/post', authenticateToken, async (req, res) => {
    try {
        const data = createPostSchema.parse(req.body);
        const userId = req.user!.id;

        const post = await communityService.createPost(userId, {
            content: data.content,
            type: data.type || "DISCUSSION",
            tags: data.tags
        });

        res.status(201).json({ success: true, data: post });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.errors });
        }
        console.error('Create Post Error:', error);
        res.status(500).json({ message: 'Failed to create post' });
    }
});

// POST /api/community/post/:id/like
router.post('/post/:id/like', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await communityService.toggleLike(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Like Post Error:', error);
        res.status(500).json({ message: 'Failed to like post' });
    }
});

// POST /api/community/post/:id/comment
router.post('/post/:id/comment', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = createCommentSchema.parse(req.body);
        const userId = req.user!.id;

        const comment = await communityService.addComment(userId, id, content);
        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', errors: error.errors });
        }
        console.error('Add Comment Error:', error);
        res.status(500).json({ message: 'Failed to add comment' });
    }
});

export default router;
