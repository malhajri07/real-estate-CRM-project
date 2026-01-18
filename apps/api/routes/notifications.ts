
import express from 'express';
import { storage } from '../storage-prisma';
import jwt from 'jsonwebtoken';
import { JWT_SECRET as getJwtSecret } from "../config/env";

const router = express.Router();

// Helper: decode roles/org from Authorization header (simple-auth JWT)
function decodeAuth(req: any): { id?: string; roles: string[]; organizationId?: string } {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return { roles: [] };
        const decoded: any = jwt.verify(token, getJwtSecret());
        let roles: string[] = [];
        try { roles = JSON.parse(decoded.roles || '[]'); } catch { if (decoded.roles) roles = [decoded.roles]; }
        return { id: decoded.userId, roles, organizationId: decoded.organizationId };
    } catch { return { roles: [] }; }
}

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
