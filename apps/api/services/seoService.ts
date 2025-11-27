/**
 * seoService.ts - SEO Service
 * 
 * Location: apps/api/ → Services/ → seoService.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Service for managing SEO settings and metadata. Provides business logic for:
 * - SEO metadata management (title, description, keywords)
 * - Open Graph and social media metadata
 * - Page-specific SEO settings
 * 
 * Related Files:
 * - apps/api/routes/cms-seo.ts - SEO API routes
 * - apps/web/src/pages/admin/seo-management.tsx - SEO management UI
 */

// @ts-nocheck
import { prisma } from "../prismaClient";
import { z } from "zod";

const SEOSettingsSchema = z.object({
  pagePath: z.string(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().max(200).optional(),
  ogImage: z.string().url().optional(),
  ogType: z.string().optional(),
  twitterCard: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().max(200).optional(),
  twitterImage: z.string().url().optional(),
  robotsMeta: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
});

export const SEOService = {
  async getSettings(pagePath: string) {
    const settings = await prisma.sEOSettings.findUnique({
      where: { pagePath },
    });

    if (!settings) {
      // Return default settings
      return {
        pagePath,
        metaTitle: null,
        metaDescription: null,
        metaKeywords: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogType: "website",
        twitterCard: "summary_large_image",
        twitterTitle: null,
        twitterDescription: null,
        twitterImage: null,
        robotsMeta: "index, follow",
        canonicalUrl: null,
      };
    }

    return settings;
  },

  async getAllSettings() {
    return prisma.sEOSettings.findMany({
      orderBy: { pagePath: "asc" },
    });
  },

  async updateSettings(params: {
    pagePath: string;
    payload: z.infer<typeof SEOSettingsSchema>;
  }) {
    const { pagePath, payload } = params;
    const validated = SEOSettingsSchema.parse(payload);

    const existing = await prisma.sEOSettings.findUnique({
      where: { pagePath },
    });

    if (existing) {
      return prisma.sEOSettings.update({
        where: { pagePath },
        data: {
          metaTitle: validated.metaTitle,
          metaDescription: validated.metaDescription,
          metaKeywords: validated.metaKeywords,
          ogTitle: validated.ogTitle,
          ogDescription: validated.ogDescription,
          ogImage: validated.ogImage,
          ogType: validated.ogType,
          twitterCard: validated.twitterCard,
          twitterTitle: validated.twitterTitle,
          twitterDescription: validated.twitterDescription,
          twitterImage: validated.twitterImage,
          robotsMeta: validated.robotsMeta,
          canonicalUrl: validated.canonicalUrl,
        },
      });
    }

    return prisma.sEOSettings.create({
      data: {
        pagePath: validated.pagePath,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        metaKeywords: validated.metaKeywords,
        ogTitle: validated.ogTitle,
        ogDescription: validated.ogDescription,
        ogImage: validated.ogImage,
        ogType: validated.ogType || "website",
        twitterCard: validated.twitterCard || "summary_large_image",
        twitterTitle: validated.twitterTitle,
        twitterDescription: validated.twitterDescription,
        twitterImage: validated.twitterImage,
        robotsMeta: validated.robotsMeta || "index, follow",
        canonicalUrl: validated.canonicalUrl,
      },
    });
  },

  async deleteSettings(pagePath: string) {
    await prisma.sEOSettings.delete({
      where: { pagePath },
    });
  },

  async generateSitemap() {
    // Get all published articles
    const articles = await prisma.cMSArticle.findMany({
      where: { status: "published" },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get all navigation links
    const navLinks = await prisma.navigationLink.findMany({
      where: { visible: true },
      select: {
        href: true,
      },
    });

    const urls: Array<{
      loc: string;
      lastmod: string;
      changefreq: string;
      priority: number;
    }> = [];

    // Add homepage
    urls.push({
      loc: "/",
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 1.0,
    });

    // Add navigation links
    navLinks.forEach((link) => {
      if (link.href.startsWith("/") && !link.href.startsWith("//")) {
        urls.push({
          loc: link.href,
          lastmod: new Date().toISOString(),
          changefreq: "weekly",
          priority: 0.8,
        });
      }
    });

    // Add blog articles
    articles.forEach((article) => {
      urls.push({
        loc: `/blog/${article.slug}`,
        lastmod: article.updatedAt.toISOString(),
        changefreq: "monthly",
        priority: 0.6,
      });
    });

    // Generate XML
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${process.env.APP_URL || "https://example.com"}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return sitemapXml;
  },

  async getRobotsTxt() {
    // Get robots.txt content from database or return default
    const settings = await prisma.sEOSettings.findFirst({
      where: { pagePath: "/robots.txt" },
    });

    if (settings?.robotsMeta) {
      return settings.robotsMeta;
    }

    // Default robots.txt
    return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: ${process.env.APP_URL || "https://example.com"}/sitemap.xml`;
  },

  async updateRobotsTxt(content: string) {
    // Store robots.txt content in SEO settings
    const existing = await prisma.sEOSettings.findUnique({
      where: { pagePath: "/robots.txt" },
    });

    if (existing) {
      return prisma.sEOSettings.update({
        where: { pagePath: "/robots.txt" },
        data: { robotsMeta: content },
      });
    }

    return prisma.sEOSettings.create({
      data: {
        pagePath: "/robots.txt",
        robotsMeta: content,
      },
    });
  },
};

