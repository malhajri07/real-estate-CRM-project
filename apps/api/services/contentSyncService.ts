// @ts-nocheck
import { prisma } from "../prismaClient";

/**
 * Content Sync Service
 * Handles synchronization of draft → published state and cache invalidation
 */
export const ContentSyncService = {
  /**
   * Sync draft content to published state
   */
  async syncDraftToPublished(entityType: "article" | "landing", entityId: string) {
    try {
      if (entityType === "article") {
        const article = await prisma.cMSArticle.findUnique({
          where: { id: entityId },
        });

        if (!article) {
          throw new Error("Article not found");
        }

        // Update published fields
        await prisma.cMSArticle.update({
          where: { id: entityId },
          data: {
            publishedAt: new Date(),
            status: "published",
          },
        });

        return { success: true, message: "Article published successfully" };
      }

      if (entityType === "landing") {
        // For landing sections, publish all draft cards
        const section = await prisma.landingSection.findUnique({
          where: { id: entityId },
          include: { cards: true },
        });

        if (!section) {
          throw new Error("Section not found");
        }

        // Update section status
        await prisma.landingSection.update({
          where: { id: entityId },
          data: {
            status: "published",
            publishedAt: new Date(),
          },
        });

        // Publish all draft cards in this section
        await prisma.landingCard.updateMany({
          where: {
            sectionId: entityId,
            status: "draft",
          },
          data: {
            status: "published",
            publishedAt: new Date(),
          },
        });

        return { success: true, message: "Landing section published successfully" };
      }

      throw new Error(`Unknown entity type: ${entityType}`);
    } catch (error) {
      console.error("Error syncing draft to published:", error);
      throw error;
    }
  },

  /**
   * Sync navigation changes to public header
   * This is called when navigation links are updated
   */
  async syncNavigation() {
    try {
      // Get all published navigation links
      const navigationSection = await prisma.landingSection.findFirst({
        where: {
          slug: "navigation",
          status: "published",
        },
        include: {
          cards: {
            where: {
              status: "published",
              visible: true,
            },
            orderBy: {
              orderIndex: "asc",
            },
          },
        },
      });

      if (!navigationSection) {
        return { links: [] };
      }

      // Also check NavigationLink table (new CMS navigation system)
      const navigationLinks = await prisma.navigationLink.findMany({
        where: {
          visible: true,
        },
        orderBy: {
          order: "asc",
        },
      });

      // Combine both sources, prioritizing NavigationLink table
      const links = navigationLinks.length > 0
        ? navigationLinks.map((link) => ({
            id: link.id,
            label: link.label,
            href: link.href,
            order: link.order,
            visible: link.visible,
            target: link.target,
            icon: link.icon,
          }))
        : navigationSection.cards.map((card) => ({
            id: card.id,
            label: card.content?.label || card.title || "",
            href: card.content?.href || "#",
            order: card.orderIndex,
            visible: card.visible,
          }));

      return { links };
    } catch (error) {
      console.error("Error syncing navigation:", error);
      return { links: [] };
    }
  },

  /**
   * Sync SEO settings to page meta tags
   */
  async syncSEOSettings(pagePath: string) {
    try {
      const seoSettings = await prisma.sEOSettings.findFirst({
        where: {
          pagePath,
        },
      });

      if (!seoSettings) {
        // Return global SEO settings as fallback
        const globalSEO = await prisma.sEOSettings.findFirst({
          where: {
            pagePath: "/",
          },
        });
        return globalSEO || null;
      }

      return seoSettings;
    } catch (error) {
      console.error("Error syncing SEO settings:", error);
      return null;
    }
  },

  /**
   * Invalidate cache on publish
   */
  async invalidateCache(entityType: "article" | "landing" | "navigation" | "seo") {
    try {
      // In a production environment, you would invalidate CDN cache here
      // For now, we'll just log it
      console.log(`Cache invalidated for ${entityType}`);

      // You can add Redis cache invalidation here if needed
      // await redis.del(`cache:${entityType}:*`);

      return { success: true };
    } catch (error) {
      console.error("Error invalidating cache:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Sync all content (useful for initial setup or migration)
   */
  async syncAll() {
    try {
      const results = {
        navigation: await this.syncNavigation(),
        seo: await this.syncSEOSettings("/"),
      };

      return results;
    } catch (error) {
      console.error("Error syncing all content:", error);
      throw error;
    }
  },
};

