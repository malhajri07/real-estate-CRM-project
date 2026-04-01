import express from 'express';
import { prisma } from '../prismaClient';
import { decodeAuth } from '../src/middleware/auth-helpers';

const router = express.Router();

// GET /api/notifications - Get all notifications for the authenticated user
router.get("/", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        if (!auth.id) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Try to fetch from audit_logs as notification-like records for the user
        // Since there's no dedicated notifications table, use audit_logs filtered by userId
        const logs = await prisma.audit_logs.findMany({
            where: {
                OR: [
                    { userId: auth.id },
                    // Also include system-wide notifications (no userId)
                    { action: { startsWith: 'NOTIFICATION_' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const notifications = logs.map((log) => ({
            id: log.id,
            type: log.action,
            title: log.entity || 'System',
            message: log.action,
            isRead: false, // Default - would need a join table for read status
            createdAt: log.createdAt.toISOString(),
        }));

        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});

// GET /api/notifications/:id - Get a single notification
router.get("/:id", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        if (!auth.id) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const log = await prisma.audit_logs.findUnique({
            where: { id: req.params.id },
        });

        if (!log) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({
            id: log.id,
            type: log.action,
            title: log.entity || 'System',
            message: log.action,
            isRead: false,
            createdAt: log.createdAt.toISOString(),
        });
    } catch (error) {
        console.error("Error fetching notification:", error);
        res.status(500).json({ message: "Failed to fetch notification" });
    }
});

// PUT /api/notifications/:id - Mark notification as read
router.put("/:id", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        if (!auth.id) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const log = await prisma.audit_logs.findUnique({
            where: { id: req.params.id },
        });

        if (!log) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Mark as read by recording a "read" audit entry
        // Since audit_logs don't have a read flag, we track read status via a marker action
        await prisma.audit_logs.create({
            data: {
                userId: auth.id,
                action: 'NOTIFICATION_READ',
                entity: 'notification',
                entityId: req.params.id,
            },
        });

        res.json({
            id: log.id,
            type: log.action,
            title: log.entity || 'System',
            message: log.action,
            isRead: true,
            createdAt: log.createdAt.toISOString(),
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Failed to update notification" });
    }
});

// DELETE /api/notifications/:id - Dismiss/delete a notification
router.delete("/:id", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        if (!auth.id) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const log = await prisma.audit_logs.findUnique({
            where: { id: req.params.id },
        });

        if (!log) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Record dismissal - we don't delete audit logs but record a dismissal marker
        await prisma.audit_logs.create({
            data: {
                userId: auth.id,
                action: 'NOTIFICATION_DISMISSED',
                entity: 'notification',
                entityId: req.params.id,
            },
        });

        res.status(204).send();
    } catch (error) {
        console.error("Error dismissing notification:", error);
        res.status(500).json({ message: "Failed to dismiss notification" });
    }
});

export default router;
