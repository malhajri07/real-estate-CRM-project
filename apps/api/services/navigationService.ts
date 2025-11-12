// @ts-nocheck
import { prisma } from "../prismaClient";
import { z } from "zod";

const NavigationLinkSchema = z.object({
  label: z.string().min(1).max(100),
  href: z.string().min(1),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
  target: z.enum(["_self", "_blank"]).optional(),
  icon: z.string().optional(),
});

const NavigationLinksUpdateSchema = z.array(NavigationLinkSchema);

export const NavigationService = {
  async getNavigationLinks() {
    const links = await prisma.navigationLink.findMany({
      orderBy: { order: "asc" },
    });

    return links;
  },

  async getVisibleNavigationLinks() {
    const links = await prisma.navigationLink.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
    });

    return links;
  },

  async updateNavigationLinks(params: {
    links: z.infer<typeof NavigationLinksUpdateSchema>;
  }) {
    const { links } = params;
    const validated = NavigationLinksUpdateSchema.parse(links);

    // Delete all existing links
    await prisma.navigationLink.deleteMany({});

    // Create new links
    const created = await Promise.all(
      validated.map((link, index) =>
        prisma.navigationLink.create({
          data: {
            label: link.label,
            href: link.href,
            order: link.order ?? index,
            visible: link.visible ?? true,
            target: link.target ?? "_self",
            icon: link.icon,
          },
        })
      )
    );

    return created;
  },

  async createNavigationLink(params: {
    payload: z.infer<typeof NavigationLinkSchema>;
  }) {
    const { payload } = params;
    const validated = NavigationLinkSchema.parse(payload);

    // Get max order
    const lastLink = await prisma.navigationLink.findFirst({
      orderBy: { order: "desc" },
    });
    const order = validated.order ?? (lastLink?.order ?? 0) + 1;

    return prisma.navigationLink.create({
      data: {
        label: validated.label,
        href: validated.href,
        order,
        visible: validated.visible ?? true,
        target: validated.target ?? "_self",
        icon: validated.icon,
      },
    });
  },

  async updateNavigationLink(params: {
    id: string;
    payload: z.infer<typeof NavigationLinkSchema>;
  }) {
    const { id, payload } = params;
    const validated = NavigationLinkSchema.parse(payload);

    const existing = await prisma.navigationLink.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Navigation link not found");
    }

    return prisma.navigationLink.update({
      where: { id },
      data: {
        label: validated.label,
        href: validated.href,
        order: validated.order ?? existing.order,
        visible: validated.visible ?? existing.visible,
        target: validated.target ?? existing.target,
        icon: validated.icon,
      },
    });
  },

  async deleteNavigationLink(params: { id: string }) {
    const { id } = params;
    await prisma.navigationLink.delete({ where: { id } });
  },

  async reorderNavigationLinks(params: {
    orders: Array<{ id: string; order: number }>;
  }) {
    const { orders } = params;

    await Promise.all(
      orders.map(({ id, order }) =>
        prisma.navigationLink.update({
          where: { id },
          data: { order },
        })
      )
    );

    return this.getNavigationLinks();
  },
};

