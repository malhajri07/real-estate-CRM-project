/**
 * normalizers.ts - CMS Landing Page Data Normalizers
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → cms-landing/ → utils/ → normalizers.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Normalization utilities for CMS landing page. Converts:
 * - Section/card data structures to form state
 * - API responses to form-compatible format
 * 
 * Related Files:
 * - apps/web/src/pages/admin/cms-landing/index.tsx - CMS landing editor
 * - apps/api/services/landingService.ts - Landing page service
 */

/**
 * Normalization utilities for CMS Landing Page
 * 
 * Converts section/card data structures to form state
 */

import type { LandingSection, LandingCard, SectionFormState, CardFormState } from "../types";

/**
 * Normalizes section content into form state
 */
export function normalizeSectionContent(section: LandingSection): SectionFormState {
  const content = (section.content ?? section.draftJson ?? {}) as Record<string, any>;
  const base: SectionFormState = {
    title: content.title ?? section.title ?? "",
    subtitle: content.subtitle ?? section.subtitle ?? "",
    visible: section.visible ?? true,
  };

  switch (section.slug) {
    case "hero":
      return {
        ...base,
        badge: content.badge ?? "",
        body: content.body ?? "",
        primaryCtaLabel: content.cta?.label ?? "",
        primaryCtaHref: content.cta?.href ?? "",
        secondaryCtaLabel: content.secondaryCta?.label ?? "",
        secondaryCtaHref: content.secondaryCta?.href ?? "",
        dashboardTitle: content.dashboardTitle ?? section.title ?? "",
      };
    case "features":
    case "solutions":
    case "pricing":
    case "contact":
      return {
        ...base,
        description: content.subtitle ?? content.body ?? "",
      };
    case "footer":
      return {
        ...base,
        body: content.body ?? "",
        copyright: content.copyright ?? "",
        logoUrl: content.logoUrl ?? "",
      };
    case "cta":
      return {
        ...base,
        body: content.body ?? "",
        primaryCtaLabel: content.cta?.label ?? "",
        primaryCtaHref: content.cta?.href ?? "",
      };
    case "header":
      return {
        ...base,
        logoUrl: content.logo?.url ?? "",
        siteName: content.siteName ?? "",
      };
    default:
      return base;
  }
}

/**
 * Normalizes card content into form state based on section type
 */
export function normalizeCardContent(sectionSlug: string, card: LandingCard): CardFormState {
  const content = (card.content ?? card.draftJson ?? {}) as Record<string, any>;
  const base: CardFormState = {
    title: card.title ?? "",
    body: card.body ?? "",
    icon: card.icon ?? content.icon ?? "",
    ctaLabel: card.ctaLabel ?? content.cta?.label ?? "",
    ctaHref: card.ctaHref ?? content.cta?.href ?? "",
    visible: card.visible ?? true,
  };

  switch (sectionSlug) {
    case "hero":
      return {
        ...base,
        value: content.value ?? card.title ?? "",
        label: content.label ?? card.body ?? "",
        color: content.color ?? "blue",
      };
    case "features":
      return {
        ...base,
        body: content.body ?? card.body ?? "",
      };
    case "solutions":
      return {
        ...base,
        body: content.body ?? card.body ?? "",
        featuresText: Array.isArray(content.features)
          ? content.features
            .map((feature: any) =>
              typeof feature === "string" ? feature : feature?.text ?? ""
            )
            .filter(Boolean)
            .join("\n")
          : "",
      };
    case "stats":
      return {
        ...base,
        value: content.value ?? "",
        label: content.label ?? "",
        suffix: content.suffix ?? "",
      };
    case "pricing":
      return {
        ...base,
        price:
          typeof content.price === "number"
            ? String(content.price)
            : card.body && !Number.isNaN(Number(card.body))
              ? card.body
              : "",
        period: content.period ?? "monthly",
        isPopular: Boolean(content.isPopular ?? card.status === "published"),
        featuresText: Array.isArray(content.features)
          ? content.features
            .map((feature: any) =>
              typeof feature === "string" ? feature : feature?.text ?? ""
            )
            .filter(Boolean)
            .join("\n")
          : "",
      };
    case "contact":
      return {
        ...base,
        type: content.type ?? "",
        title: content.title ?? card.title ?? "",
        body: content.body ?? card.body ?? "",
        icon: content.icon ?? card.icon ?? "",
      };
    case "navigation":
      return {
        title: content.label ?? card.title ?? "",
        link: content.href ?? card.ctaHref ?? "",
        visible: card.visible ?? true,
      };
    case "footer":
      return {
        ...base,
        category: content.category ?? card.title ?? "",
        featuresText: Array.isArray(content.links)
          ? content.links
            .map((link: any) =>
              typeof link === "string"
                ? link
                : `${link?.text ?? ""}|${link?.href ?? ""}`
            )
            .filter(Boolean)
            .join("\n")
          : "",
      };
    default:
      return base;
  }
}

