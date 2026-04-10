/**
 * routes/landing.ts — Public landing-page data endpoint.
 *
 * Mounted at `/api/landing`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | / | No | Fetch all published landing sections and cards |
 *
 * Consumer: public home page (`/`), query key `landing-data`; supports `Cache-Control: no-cache` bypass.
 */

import express from 'express';
import crypto from 'crypto';
import { LandingService } from '../services/landingService';
import { decodeAuth } from '../src/middleware/auth-helpers';

const router = express.Router();

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
    const previewToken = process.env.LANDING_PREVIEW_TOKEN;
    if (previewToken) {
        const token = req.query.token as string | undefined;
        // Use timing-safe comparison to prevent timing attacks
        const isValid = token && previewToken &&
            token.length === previewToken.length &&
            crypto.timingSafeEqual(Buffer.from(token), Buffer.from(previewToken));

        if (!isValid) {
            return res.status(401).json({ message: "Invalid preview token" });
        }
    } else {
        const auth = decodeAuth(req);
        const roleSet = new Set(auth.roles.map((r) => r.toUpperCase()));
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
