// @ts-nocheck
import { prisma } from "../prismaClient";
import { z } from "zod";

const TemplateCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
  type: z.string(),
  content: z.string().min(1),
  contentJson: z.any().optional(),
  variables: z.any().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

const TemplateUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
  type: z.string().optional(),
  content: z.string().optional(),
  contentJson: z.any().optional(),
  variables: z.any().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function snapshotVersion(params: {
  templateId: string;
  version: number;
  snapshot: Record<string, unknown>;
  actor?: string;
}) {
  await prisma.contentTemplateVersion.create({
    data: {
      templateId: params.templateId,
      version: params.version,
      snapshot: params.snapshot,
      createdBy: params.actor,
    },
  });
}

export const TemplateService = {
  async listTemplates(options: {
    type?: string;
    category?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const {
      type,
      category,
      page = 1,
      pageSize = 20,
      search,
    } = options;

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.contentTemplate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              versions: true,
            },
          },
        },
      }),
      prisma.contentTemplate.count({ where }),
    ]);

    return {
      items: templates.map((template) => ({
        ...template,
        versionCount: template._count.versions,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getTemplate(id: string) {
    const template = await prisma.contentTemplate.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 10,
        },
      },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  },

  async getTemplateBySlug(slug: string) {
    const template = await prisma.contentTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  },

  async createTemplate(params: {
    payload: z.infer<typeof TemplateCreateSchema>;
    createdBy?: string;
    actor?: string;
  }) {
    const { payload, createdBy, actor } = params;
    const validated = TemplateCreateSchema.parse(payload);

    // Check if slug exists
    const existing = await prisma.contentTemplate.findUnique({
      where: { slug: validated.slug },
    });
    if (existing) {
      throw new Error("Slug already exists");
    }

    const template = await prisma.contentTemplate.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        type: validated.type,
        content: validated.content,
        contentJson: validated.contentJson,
        variables: validated.variables,
        description: validated.description,
        category: validated.category,
        createdBy,
      },
    });

    // Create initial version snapshot
    await snapshotVersion({
      templateId: template.id,
      version: 1,
      snapshot: template,
      actor,
    });

    return template;
  },

  async updateTemplate(params: {
    id: string;
    payload: z.infer<typeof TemplateUpdateSchema>;
    actor?: string;
  }) {
    const { id, payload, actor } = params;
    const validated = TemplateUpdateSchema.parse(payload);

    const existing = await prisma.contentTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Template not found");
    }

    // Check slug uniqueness if changing
    if (validated.slug && validated.slug !== existing.slug) {
      const slugExists = await prisma.contentTemplate.findUnique({
        where: { slug: validated.slug },
      });
      if (slugExists) {
        throw new Error("Slug already exists");
      }
    }

    const updated = await prisma.contentTemplate.update({
      where: { id },
      data: {
        name: validated.name,
        slug: validated.slug,
        type: validated.type,
        content: validated.content,
        contentJson: validated.contentJson,
        variables: validated.variables,
        description: validated.description,
        category: validated.category,
      },
    });

    // Create version snapshot - get latest version number
    const latestVersion = await prisma.contentTemplateVersion.findFirst({
      where: { templateId: id },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latestVersion?.version ?? 0) + 1;

    await snapshotVersion({
      templateId: id,
      version: nextVersion,
      snapshot: updated,
      actor,
    });

    return updated;
  },

  async cloneTemplate(params: {
    id: string;
    newName?: string;
    actor?: string;
  }) {
    const { id, newName, actor } = params;
    const template = await prisma.contentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    const clonedName = newName || `${template.name} (Copy)`;
    const clonedSlug = `${template.slug}-copy-${Date.now()}`;

    const cloned = await prisma.contentTemplate.create({
      data: {
        name: clonedName,
        slug: clonedSlug,
        type: template.type,
        content: template.content,
        contentJson: template.contentJson,
        variables: template.variables,
        description: template.description,
        category: template.category,
        createdBy: actor,
      },
    });

    // Create initial version snapshot
    await snapshotVersion({
      templateId: cloned.id,
      version: 1,
      snapshot: cloned,
      actor,
    });

    return cloned;
  },

  async deleteTemplate(params: { id: string; actor?: string }) {
    const { id, actor } = params;
    await prisma.contentTemplate.delete({ where: { id } });
  },
};

