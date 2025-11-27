/**
 * routes/sitemap.ts - Sitemap API Routes
 * 
 * Location: apps/api/ → Routes/ → sitemap.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for sitemap generation. Handles:
 * - XML sitemap generation
 * - Robots.txt generation
 * 
 * API Endpoints:
 * - GET /sitemap.xml - Generate XML sitemap
 * - GET /robots.txt - Generate robots.txt
 * 
 * Related Files:
 * - apps/web/src/pages/ - Page components included in sitemap
 */

import express from 'express';
import { storage } from '../storage-prisma';

const router = express.Router();

router.get('/sitemap.xml', async (_req, res) => {
  try {
    const base = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    const listings = await storage.getAllProperties();
    const staticPaths = [
      '/', '/listings', '/search-properties', '/agencies', '/post-listing', '/favorites', '/compare',
      '/about', '/contact', '/faq', '/terms', '/privacy'
    ];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (const p of staticPaths) {
      xml += `<url><loc>${base}${p}</loc></url>`;
    }
    for (const l of listings.slice(0, 5000)) {
      xml += `<url><loc>${base}/listing/${l.id}</loc></url>`;
    }
    xml += `</urlset>`;
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (e) {
    res.status(500).send('');
  }
});

export default router;

