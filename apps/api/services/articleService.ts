/**
 * articleService.ts - Article Service
 * 
 * Location: apps/api/ → Services/ → articleService.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Service for managing CMS articles. Provides business logic for:
 * - Article creation, update, and deletion
 * - Article publishing and status management
 * - Article categorization and tagging
 * - SEO metadata management
 * - Featured image handling
 * 
 * Related Files:
 * - apps/api/routes/cms-articles.ts - Article API routes
 * - apps/web/src/pages/admin/articles-management.tsx - Article management UI
 * - data/schema/prisma/schema.prisma - Article database schema
 */

// @ts-nocheck
import { prisma } from "../prismaClient";
import { z } from "zod";

const ArticleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  contentJson: z.any().optional(),
  featuredImageId: z.string().uuid().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().url().optional(),
});

const ArticleUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  contentJson: z.any().optional(),
  featuredImageId: z.string().uuid().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().url().optional(),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function snapshotVersion(params: {
  articleId: string;
  version: number;
  snapshot: Record<string, unknown>;
  actor?: string;
}) {
  await prisma.cMSArticleVersion.create({
    data: {
      articleId: params.articleId,
      version: params.version,
      snapshot: params.snapshot,
      createdBy: params.actor,
    },
  });
}

export const ArticleService = {
  async listArticles(options: {
    status?: "draft" | "published" | "archived";
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const {
      status,
      categoryId,
      tagId,
      authorId,
      page = 1,
      pageSize = 20,
      search,
    } = options;

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (authorId) {
      where.authorId = authorId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      where.categories = {
        some: {
          categoryId,
        },
      };
    }
    if (tagId) {
      where.tags = {
        some: {
          tagId,
        },
      };
    }

    try {
      const [articles, total] = await Promise.all([
        prisma.cMSArticle.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: status === "published" ? { publishedAt: "desc" } : { createdAt: "desc" },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
            featuredImage: true,
          },
        }),
        prisma.cMSArticle.count({ where }),
      ]);

      return {
        items: articles.map((article) => ({
          ...article,
          categories: article.categories.map((rel) => rel.category),
          tags: article.tags.map((rel) => rel.tag),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error("Error in listArticles:", error);
      // Return empty result on error instead of throwing
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  },

  async getArticle(id: string) {
    const article = await prisma.cMSArticle.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        featuredImage: true,
        versions: {
          orderBy: { version: "desc" },
          take: 10,
        },
      },
    });

    if (!article) {
      throw new Error("Article not found");
    }

    return {
      ...article,
      categories: article.categories.map((rel) => rel.category),
      tags: article.tags.map((rel) => rel.tag),
    };
  },

  async getArticleBySlug(slug: string, requirePublished: boolean = false) {
    const where: any = { slug };
    if (requirePublished) {
      where.status = "published";
    }
    
    const article = await prisma.cMSArticle.findFirst({
      where,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        featuredImage: true,
      },
    });

    if (!article) {
      throw new Error("Article not found");
    }

    return {
      ...article,
      categories: article.categories.map((rel) => rel.category),
      tags: article.tags.map((rel) => rel.tag),
    };
  },

  async createArticle(params: {
    payload: z.infer<typeof ArticleCreateSchema>;
    authorId: string;
    actor?: string;
  }) {
    const { payload, authorId, actor } = params;
    const validated = ArticleCreateSchema.parse(payload);

    // Check if slug exists
    const existing = await prisma.cMSArticle.findUnique({
      where: { slug: validated.slug },
    });
    if (existing) {
      throw new Error("Slug already exists");
    }

    const article = await prisma.cMSArticle.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        excerpt: validated.excerpt,
        content: validated.content,
        contentJson: validated.contentJson,
        featuredImageId: validated.featuredImageId,
        authorId,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        metaKeywords: validated.metaKeywords,
        ogImage: validated.ogImage,
        categories: validated.categoryIds
          ? {
              create: validated.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
        tags: validated.tagIds
          ? {
              create: validated.tagIds.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        featuredImage: true,
      },
    });

    // Create initial version snapshot
    await snapshotVersion({
      articleId: article.id,
      version: 1,
      snapshot: article,
      actor,
    });

    return {
      ...article,
      categories: article.categories.map((rel) => rel.category),
      tags: article.tags.map((rel) => rel.tag),
    };
  },

  async updateArticle(params: {
    id: string;
    payload: z.infer<typeof ArticleUpdateSchema>;
    actor?: string;
  }) {
    const { id, payload, actor } = params;
    const validated = ArticleUpdateSchema.parse(payload);

    const existing = await prisma.cMSArticle.findUnique({
      where: { id },
      include: {
        categories: true,
        tags: true,
      },
    });

    if (!existing) {
      throw new Error("Article not found");
    }

    // Check slug uniqueness if changing
    if (validated.slug && validated.slug !== existing.slug) {
      const slugExists = await prisma.cMSArticle.findUnique({
        where: { slug: validated.slug },
      });
      if (slugExists) {
        throw new Error("Slug already exists");
      }
    }

    // Update categories if provided
    if (validated.categoryIds !== undefined) {
      await prisma.cMSArticleCategoryRelation.deleteMany({
        where: { articleId: id },
      });
      if (validated.categoryIds.length > 0) {
        await prisma.cMSArticleCategoryRelation.createMany({
          data: validated.categoryIds.map((categoryId) => ({
            articleId: id,
            categoryId,
          })),
        });
      }
    }

    // Update tags if provided
    if (validated.tagIds !== undefined) {
      await prisma.cMSArticleTagRelation.deleteMany({
        where: { articleId: id },
      });
      if (validated.tagIds.length > 0) {
        await prisma.cMSArticleTagRelation.createMany({
          data: validated.tagIds.map((tagId) => ({
            articleId: id,
            tagId,
          })),
        });
      }
    }

    const updated = await prisma.cMSArticle.update({
      where: { id },
      data: {
        title: validated.title,
        slug: validated.slug,
        excerpt: validated.excerpt,
        content: validated.content,
        contentJson: validated.contentJson,
        featuredImageId: validated.featuredImageId ?? undefined,
        status: validated.status,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        metaKeywords: validated.metaKeywords,
        ogImage: validated.ogImage,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        featuredImage: true,
      },
    });

    // Create version snapshot - get latest version number
    const latestVersion = await prisma.cMSArticleVersion.findFirst({
      where: { articleId: id },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latestVersion?.version ?? 0) + 1;
    
    await snapshotVersion({
      articleId: id,
      version: nextVersion,
      snapshot: updated,
      actor,
    });

    return {
      ...updated,
      categories: updated.categories.map((rel) => rel.category),
      tags: updated.tags.map((rel) => rel.tag),
    };
  },

  async publishArticle(params: { id: string; actor?: string }) {
    const { id, actor } = params;
    const article = await prisma.cMSArticle.findUnique({ where: { id } });

    if (!article) {
      throw new Error("Article not found");
    }

    return prisma.cMSArticle.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: new Date(),
      },
    });
  },

  async archiveArticle(params: { id: string; actor?: string }) {
    const { id, actor } = params;
    const article = await prisma.cMSArticle.findUnique({ where: { id } });

    if (!article) {
      throw new Error("Article not found");
    }

    return prisma.cMSArticle.update({
      where: { id },
      data: {
        status: "archived",
      },
    });
  },

  async deleteArticle(params: { id: string; actor?: string }) {
    const { id, actor } = params;
    await prisma.cMSArticle.delete({ where: { id } });
  },

  // Category management
  async listCategories() {
    return prisma.cMSArticleCategory.findMany({
      orderBy: { name: "asc" },
    });
  },

  async createCategory(params: { name: string; description?: string }) {
    const slug = generateSlug(params.name);
    return prisma.cMSArticleCategory.create({
      data: {
        name: params.name,
        slug,
        description: params.description,
      },
    });
  },

  // Tag management
  async listTags() {
    return prisma.cMSArticleTag.findMany({
      orderBy: { name: "asc" },
    });
  },

  async createTag(params: { name: string }) {
    const slug = generateSlug(params.name);
    return prisma.cMSArticleTag.create({
      data: {
        name: params.name,
        slug,
      },
    });
  },

  async getArticleVersions(articleId: string) {
    const versions = await prisma.cMSArticleVersion.findMany({
      where: { articleId },
      orderBy: { version: "desc" },
    });
    return versions;
  },

  async restoreArticleVersion(params: {
    articleId: string;
    version: number;
    actor?: string;
  }) {
    const { articleId, version, actor } = params;
    
    const versionSnapshot = await prisma.cMSArticleVersion.findFirst({
      where: {
        articleId,
        version,
      },
    });

    if (!versionSnapshot) {
      throw new Error("Version not found");
    }

    const snapshot = versionSnapshot.snapshot as any;
    
    // Update article with version data
    const article = await prisma.cMSArticle.update({
      where: { id: articleId },
      data: {
        title: snapshot.title,
        slug: snapshot.slug,
        excerpt: snapshot.excerpt,
        content: snapshot.content,
        contentJson: snapshot.contentJson,
        featuredImageId: snapshot.featuredImageId,
        metaTitle: snapshot.metaTitle,
        metaDescription: snapshot.metaDescription,
        metaKeywords: snapshot.metaKeywords,
        ogImage: snapshot.ogImage,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        featuredImage: true,
      },
    });

    // Create new version snapshot for the restore
    const currentVersion = await prisma.cMSArticleVersion.findFirst({
      where: { articleId },
      orderBy: { version: "desc" },
    });
    const nextVersion = (currentVersion?.version || 0) + 1;

    await snapshotVersion({
      articleId,
      version: nextVersion,
      snapshot: article,
      actor,
    });

    return {
      ...article,
      categories: article.categories.map((rel) => rel.category),
      tags: article.tags.map((rel) => rel.tag),
    };
  },
};

