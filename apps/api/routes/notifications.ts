import express from 'express';
import { prisma } from '../prismaClient';
import { decodeAuth } from '../src/middleware/auth-helpers';
import { authenticateToken } from '../src/middleware/auth.middleware';

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
router.put("/:id", authenticateToken, async (req, res) => {
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
router.delete("/:id", authenticateToken, async (req, res) => {
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

// GET /api/notifications/count — Real actionable notification count
router.get("/count", async (req, res) => {
    try {
        const auth = decodeAuth(req);
        if (!auth.id) return res.json({ count: 0 });

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const roles: string[] = Array.isArray(auth.roles) ? auth.roles : (() => { try { return JSON.parse(String(auth.roles || "[]")); } catch { return []; } })();
        const isOwner = roles.includes("CORP_OWNER") || roles.includes("WEBSITE_ADMIN");

        const counts = await Promise.all([
            // New leads (last 7 days, not contacted)
            prisma.leads.count({
                where: {
                    agentId: auth.id,
                    createdAt: { gte: sevenDaysAgo },
                    lastContactAt: null,
                },
            }),
            // Pending listing approvals (CORP_OWNER only)
            isOwner && auth.organizationId
                ? prisma.listings.count({ where: { organizationId: auth.organizationId, status: "PENDING_APPROVAL" } })
                : Promise.resolve(0),
            // Upcoming appointments (next 24h)
            prisma.appointments.count({
                where: {
                    agentId: auth.id,
                    scheduledAt: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
                    status: "SCHEDULED",
                },
            }),
            // Overdue rent payments (for agents managing tenancies)
            prisma.rent_payments.count({
                where: {
                    tenancy: { agentId: auth.id },
                    status: "PENDING",
                    dueDate: { lt: now },
                },
            }),
            // Unread messages
            prisma.messages.count({
                where: {
                    agentId: auth.id,
                    direction: "INBOUND",
                    status: { not: "READ" },
                },
            }),
        ]);

        const total = counts.reduce((sum, c) => sum + c, 0);

        res.json({
            count: total,
            breakdown: {
                newLeads: counts[0],
                pendingApprovals: counts[1],
                upcomingAppointments: counts[2],
                overduePayments: counts[3],
                unreadMessages: counts[4],
            },
        });
    } catch (error) {
        console.error("Notification count error:", error);
        res.json({ count: 0 });
    }
});

export default router;
