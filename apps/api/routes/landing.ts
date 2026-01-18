
import express from 'express';
import { LandingService } from '../services/landingService';
import jwt from 'jsonwebtoken';
import { JWT_SECRET as getJwtSecret } from "../config/env";

const router = express.Router();
const previewToken = process.env.LANDING_PREVIEW_TOKEN;

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
        const data = await LandingService.getPublicLanding();
        // Reduced cache time and allow no-cache header to bypass cache
        const noCache = req.headers['cache-control']?.includes('no-cache') || req.query.t;
        if (noCache) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
        } else {
            res.setHeader("Cache-Control", "public, max-age=10, stale-while-revalidate=30");
        }
        res.json({ data });
    } catch (error) {
        console.error("Failed to fetch landing data:", error);
        res.status(500).json({ message: "Failed to load landing data" });
    }
});

router.get("/preview", async (req, res) => {
    if (previewToken) {
        const token = req.query.token;
        if (!token || token !== previewToken) {
            return res.status(401).json({ message: "Invalid preview token" });
        }
    } else {
        const auth = decodeAuth(req);
        const roleSet = new Set(auth.roles.map((r: string) => r.toUpperCase()));
        if (!roleSet.has("WEBSITE_ADMIN") && !roleSet.has("CMS_ADMIN") && !roleSet.has("EDITOR")) {
            return res.status(403).json({ message: "Preview unavailable" });
        }
    }

    try {
        const data = await LandingService.listSections({
            status: "draft",
            includeArchived: false,
        });
        res.json({ data });
    } catch (error) {
        console.error("Failed to load preview landing data:", error);
        res.status(500).json({ message: "Failed to load preview landing data" });
    }
});

export default router;
