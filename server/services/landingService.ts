import { PrismaClient, LandingSection, LandingCard } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export const SectionDraftSchema = z.object({
  title: z.string().max(120).optional(),
  subtitle: z.string().max(180).optional(),
  body: z.string().max(10_000).optional(),
  cta: z
    .object({
      label: z.string().max(60).optional(),
      href: z.string().url().optional().or(z.literal("")),
      style: z.string().optional(),
    })
    .nullish(),
  media: z
    .object({
      url: z.string().url().optional().or(z.literal("")),
      alt: z.string().max(160).optional(),
    })
    .nullish(),
  badges: z.array(z.string()).optional(),
  layoutVariant: z
    .enum(["hero", "grid", "pricing", "logos", "cta", "custom"])
    .optional(),
  theme: z.record(z.any()).optional(),
  visibility: z.boolean().optional(),
  meta: z.record(z.any()).optional(),
  locales: z.record(z.any()).optional(),
});

export const CardDraftSchema = z.object({
  title: z.string().max(120).optional(),
  body: z.string().max(10_000).optional(),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  icon: z.string().optional(),
  cta: z
    .object({
      label: z.string().max(60).optional(),
      href: z.string().url().optional().or(z.literal("")),
    })
    .nullish(),
  badges: z.array(z.string()).optional(),
  layoutVariant: z.string().optional(),
  theme: z.record(z.any()).optional(),
  visibility: z.boolean().optional(),
  locales: z.record(z.any()).optional(),
});

const SlugSchema = z.string().min(3).max(64);

function sanitizeDraft<T extends z.ZodTypeAny>(schema: T, payload: unknown) {
  try {
    return schema.parse(payload ?? {});
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues.map((i) => i.message).join(", "));
    }
    throw error;
  }
}

function ensureRole(roles: string[] | undefined, allowed: string[]) {
  const roleSet = new Set((roles ?? []).map((r) => r.toUpperCase()));
  return allowed.some((role) => roleSet.has(role.toUpperCase()));
}

async function nextSectionOrderIndex() {
  const last = await prisma.landingSection.findFirst({
    orderBy: { orderIndex: "desc" },
  });
  return (last?.orderIndex ?? 0) + 1;
}

async function nextCardOrderIndex(sectionId: string) {
  const last = await prisma.landingCard.findFirst({
    where: { sectionId },
    orderBy: { orderIndex: "desc" },
  });
  return (last?.orderIndex ?? 0) + 1;
}

async function logAudit(params: {
  actor: string;
  entityType: "section" | "card";
  entityId: string;
  action:
    | "create"
    | "update"
    | "reorder"
    | "publish"
    | "archive"
    | "restore"
    | "delete";
  fromVersion?: number | null;
  toVersion?: number | null;
}) {
  await prisma.landingAuditLog.create({
    data: {
      actor: params.actor,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      fromVersion: params.fromVersion ?? null,
      toVersion: params.toVersion ?? null,
    },
  });
}

async function snapshotVersion(params: {
  entityType: "section" | "card";
  entityId: string;
  version: number;
  snapshot: Record<string, unknown>;
  actor?: string;
}) {
  await prisma.landingVersion.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      version: params.version,
      snapshot: params.snapshot,
      createdBy: params.actor,
    },
  });
}

export const LandingService = {
  async listSections(options: {
    status?: "draft" | "published";
    includeArchived?: boolean;
  }) {
    const { status = "draft", includeArchived = false } = options;
    const where: any = {};
    if (!includeArchived) {
      where.status = { not: "archived" };
    }
    const sections = await prisma.landingSection.findMany({
      where,
      orderBy: { orderIndex: "asc" },
      include: {
        cards: {
          orderBy: { orderIndex: "asc" },
          where: includeArchived ? {} : { status: { not: "archived" } },
        },
      },
    });

    return sections.map((section) =>
      transformSection(section, { view: status })
    );
  },

  async getPublicLanding() {
    const sections = await prisma.landingSection.findMany({
      where: { status: "published", visible: true },
      orderBy: { orderIndex: "asc" },
      include: {
        cards: {
          where: { status: "published", visible: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return sections.map((section) =>
      transformSection(section, { view: "published", includeMeta: false })
    );
  },

  async createSection(params: {
    slug: string;
    title?: string;
    subtitle?: string;
    layoutVariant?: LandingSection["layoutVariant"];
    theme?: Record<string, unknown>;
    draftJson?: unknown;
    actor: string;
  }) {
    const slug = SlugSchema.parse(params.slug);
    const draft = sanitizeDraft(SectionDraftSchema, params.draftJson ?? {});

    const section = await prisma.landingSection.create({
      data: {
        slug,
        title: params.title ?? draft.title ?? "",
        subtitle: params.subtitle ?? draft.subtitle ?? "",
        layoutVariant: params.layoutVariant ?? draft.layoutVariant ?? "custom",
        theme: params.theme ?? draft.theme ?? undefined,
        orderIndex: await nextSectionOrderIndex(),
        draftJson: draft,
        updatedBy: params.actor,
      },
    });

    await logAudit({
      actor: params.actor,
      entityType: "section",
      entityId: section.id,
      action: "create",
      toVersion: section.version,
    });

    return transformSection(section, { view: "draft" });
  },

  async updateSection(params: {
    id: string;
    payload: Record<string, unknown>;
    actor: string;
  }) {
    const draft = sanitizeDraft(SectionDraftSchema, params.payload.draftJson);
    const { title, subtitle, layoutVariant, theme, visible } = params.payload;

    const section = await prisma.landingSection.update({
      where: { id: params.id },
      data: {
        title: typeof title === "string" ? title : undefined,
        subtitle: typeof subtitle === "string" ? subtitle : undefined,
        layoutVariant:
          typeof layoutVariant === "string" ? layoutVariant : undefined,
        theme: theme ? (theme as any) : undefined,
        visible:
          typeof visible === "boolean" ? visible : undefined,
        draftJson: draft,
        updatedBy: params.actor,
        updatedAt: new Date(),
        status: params.payload.status ?? undefined,
      },
    });

    await logAudit({
      actor: params.actor,
      entityType: "section",
      entityId: section.id,
      action: "update",
      toVersion: section.version,
    });

    return transformSection(section, { view: "draft" });
  },

  async reorderSections(params: {
    orders: { id: string; orderIndex: number }[];
    actor: string;
  }) {
    await prisma.$transaction(
      params.orders.map(({ id, orderIndex }) =>
        prisma.landingSection.update({
          where: { id },
          data: { orderIndex },
        })
      )
    );

    for (const item of params.orders) {
      await logAudit({
        actor: params.actor,
        entityType: "section",
        entityId: item.id,
        action: "reorder",
      });
    }
  },

  async publishSection(params: {
    id: string;
    actor: string;
    publishCards?: boolean;
  }) {
    const section = await prisma.landingSection.findUnique({
      where: { id: params.id },
      include: { cards: true },
    });
    if (!section) throw new Error("Section not found");

    const nextVersion = section.version + 1;

    const updated = await prisma.landingSection.update({
      where: { id: params.id },
      data: {
        publishedJson: section.draftJson,
        status: "published",
        publishedBy: params.actor,
        publishedAt: new Date(),
        version: nextVersion,
      },
    });

    await snapshotVersion({
      entityType: "section",
      entityId: params.id,
      version: nextVersion,
      snapshot: {
        publishedJson: updated.publishedJson,
      } as Record<string, unknown>,
      actor: params.actor,
    });

    await logAudit({
      actor: params.actor,
      entityType: "section",
      entityId: params.id,
      action: "publish",
      fromVersion: section.version,
      toVersion: nextVersion,
    });

    if (params.publishCards) {
      await Promise.all(
        section.cards.map(async (card) => {
          const cardNextVersion = card.version + 1;
          await prisma.landingCard.update({
            where: { id: card.id },
            data: {
              publishedJson: card.draftJson,
              status: "published",
              publishedBy: params.actor,
              publishedAt: new Date(),
              version: cardNextVersion,
            },
          });
          await snapshotVersion({
            entityType: "card",
            entityId: card.id,
            version: cardNextVersion,
            snapshot: {
              publishedJson: card.draftJson ?? {},
            },
            actor: params.actor,
          });
          await logAudit({
            actor: params.actor,
            entityType: "card",
            entityId: card.id,
            action: "publish",
            fromVersion: card.version,
            toVersion: cardNextVersion,
          });
        })
      );
    }

    return transformSection(updated, { view: "published" });
  },

  async archiveSection(params: { id: string; actor: string }) {
    const section = await prisma.landingSection.update({
      where: { id: params.id },
      data: { status: "archived", visible: false, updatedBy: params.actor },
    });
    await logAudit({
      actor: params.actor,
      entityType: "section",
      entityId: params.id,
      action: "archive",
    });
    return section;
  },

  async deleteSection(params: { id: string; actor: string }) {
    await prisma.landingSection.delete({ where: { id: params.id } });
    await logAudit({
      actor: params.actor,
      entityType: "section",
      entityId: params.id,
      action: "delete",
    });
  },

  async createCard(params: {
    sectionId: string;
    draftJson?: unknown;
    actor: string;
  }) {
    const draft = sanitizeDraft(CardDraftSchema, params.draftJson ?? {});
    const card = await prisma.landingCard.create({
      data: {
        sectionId: params.sectionId,
        orderIndex: await nextCardOrderIndex(params.sectionId),
        title: draft.title ?? "",
        body: draft.body ?? "",
        mediaUrl: draft.mediaUrl ?? undefined,
        icon: draft.icon ?? undefined,
        ctaLabel: draft.cta?.label ?? undefined,
        ctaHref: draft.cta?.href ?? undefined,
        visible: draft.visibility ?? true,
        draftJson: draft,
        updatedBy: params.actor,
      },
    });

    await logAudit({
      actor: params.actor,
      entityType: "card",
      entityId: card.id,
      action: "create",
      toVersion: card.version,
    });

    return card;
  },

  async updateCard(params: {
    id: string;
    payload: Record<string, unknown>;
    actor: string;
  }) {
    const draft = sanitizeDraft(CardDraftSchema, params.payload.draftJson);
    const card = await prisma.landingCard.update({
      where: { id: params.id },
      data: {
        title: typeof params.payload.title === "string" ? params.payload.title : draft.title ?? undefined,
        body: typeof params.payload.body === "string" ? params.payload.body : draft.body ?? undefined,
        mediaUrl: draft.mediaUrl ?? undefined,
        icon: draft.icon ?? undefined,
        ctaLabel: draft.cta?.label ?? undefined,
        ctaHref: draft.cta?.href ?? undefined,
        visible:
          typeof params.payload.visible === "boolean"
            ? (params.payload.visible as boolean)
            : draft.visibility ?? true,
        draftJson: draft,
        updatedBy: params.actor,
        updatedAt: new Date(),
        status: params.payload.status ?? undefined,
      },
    });

    await logAudit({
      actor: params.actor,
      entityType: "card",
      entityId: card.id,
      action: "update",
      toVersion: card.version,
    });

    return card;
  },

  async reorderCards(params: {
    sectionId: string;
    orders: { id: string; orderIndex: number }[];
    actor: string;
  }) {
    await prisma.$transaction(
      params.orders.map(({ id, orderIndex }) =>
        prisma.landingCard.update({
          where: { id },
          data: { orderIndex },
        })
      )
    );
    for (const item of params.orders) {
      await logAudit({
        actor: params.actor,
        entityType: "card",
        entityId: item.id,
        action: "reorder",
      });
    }
  },

  async publishCard(params: { id: string; actor: string }) {
    const card = await prisma.landingCard.findUnique({
      where: { id: params.id },
    });
    if (!card) throw new Error("Card not found");
    const nextVersion = card.version + 1;
    const updated = await prisma.landingCard.update({
      where: { id: params.id },
      data: {
        publishedJson: card.draftJson,
        status: "published",
        publishedBy: params.actor,
        publishedAt: new Date(),
        version: nextVersion,
      },
    });

    await snapshotVersion({
      entityType: "card",
      entityId: params.id,
      version: nextVersion,
      snapshot: {
        publishedJson: updated.publishedJson,
      },
      actor: params.actor,
    });

    await logAudit({
      actor: params.actor,
      entityType: "card",
      entityId: params.id,
      action: "publish",
      fromVersion: card.version,
      toVersion: nextVersion,
    });

    return updated;
  },

  async archiveCard(params: { id: string; actor: string }) {
    const card = await prisma.landingCard.update({
      where: { id: params.id },
      data: { status: "archived", visible: false, updatedBy: params.actor },
    });
    await logAudit({
      actor: params.actor,
      entityType: "card",
      entityId: params.id,
      action: "archive",
    });
    return card;
  },

  async deleteCard(params: { id: string; actor: string }) {
    await prisma.landingCard.delete({ where: { id: params.id } });
    await logAudit({
      actor: params.actor,
      entityType: "card",
      entityId: params.id,
      action: "delete",
    });
  },
};

type TransformOptions = {
  view: "draft" | "published";
  includeMeta?: boolean;
};

function transformSection(
  section: LandingSection & { cards?: LandingCard[] },
  options: TransformOptions
) {
  const { view, includeMeta = true } = options;
  const base = {
    id: section.id,
    slug: section.slug,
    title: section.title,
    subtitle: section.subtitle,
    layoutVariant: section.layoutVariant,
    theme: section.theme,
    orderIndex: section.orderIndex,
    visible: section.visible,
    status: section.status,
    version: section.version,
    draftJson: includeMeta ? section.draftJson : undefined,
    publishedJson: includeMeta ? section.publishedJson : undefined,
    updatedBy: includeMeta ? section.updatedBy : undefined,
    updatedAt: includeMeta ? section.updatedAt : undefined,
    publishedBy: includeMeta ? section.publishedBy : undefined,
    publishedAt: includeMeta ? section.publishedAt : undefined,
  };

  const content =
    view === "published"
      ? (section.publishedJson as Record<string, unknown> | null)
      : (section.draftJson as Record<string, unknown> | null);

  const cards =
    section.cards?.map((card) => transformCard(card, options)) ?? undefined;

  return {
    ...base,
    content,
    cards,
  };
}

function transformCard(
  card: LandingCard,
  options: TransformOptions
) {
  const { view, includeMeta = true } = options;
  const content =
    view === "published"
      ? (card.publishedJson as Record<string, unknown> | null)
      : (card.draftJson as Record<string, unknown> | null);
  return {
    id: card.id,
    sectionId: card.sectionId,
    orderIndex: card.orderIndex,
    title: card.title,
    body: card.body,
    mediaUrl: card.mediaUrl,
    icon: card.icon,
    ctaLabel: card.ctaLabel,
    ctaHref: card.ctaHref,
    visible: card.visible,
    status: card.status,
    version: card.version,
    content,
    draftJson: includeMeta ? card.draftJson : undefined,
    publishedJson: includeMeta ? card.publishedJson : undefined,
    updatedBy: includeMeta ? card.updatedBy : undefined,
    updatedAt: includeMeta ? card.updatedAt : undefined,
    publishedBy: includeMeta ? card.publishedBy : undefined,
    publishedAt: includeMeta ? card.publishedAt : undefined,
  };
}
