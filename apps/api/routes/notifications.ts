import express from 'express';
import { storage } from '../storage-prisma';
import { decodeAuth } from '../src/middleware/auth-helpers';

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        if (!auth.id) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const notifications = await storage.getNotifications(auth.id);
        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

export default router;
