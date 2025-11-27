/**
 * builders.ts - CMS Landing Page Payload Builders
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → cms-landing/ → utils/ → builders.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Payload building utilities for CMS landing page. Converts:
 * - Form state to API payload structures
 * - Section and card data to API format
 * 
 * Related Files:
 * - apps/web/src/pages/admin/cms-landing/index.tsx - CMS landing editor
 * - apps/api/routes/cms-landing.ts - CMS landing API routes
 */

/**
 * Payload building utilities for CMS Landing Page
 * 
 * Converts form state to API payload structures
 */

import type { LandingSection, SectionFormState, CardFormState } from "../types";

/**
 * Builds section payload from form state
 */
export function buildSectionPayload(section: LandingSection, form: SectionFormState) {
  const baseDraft = {
    layoutVariant: section.layoutVariant,
    visibility: form.visible,
  } as Record<string, any>;

  let draftJson: Record<string, any> = baseDraft;

  switch (section.slug) {
    case "hero":
      draftJson = {
        ...baseDraft,
        badge: form.badge ?? "",
        title: form.title ?? "",
        subtitle: form.subtitle ?? "",
        body: form.body ?? "",
        cta: {
          label: form.primaryCtaLabel ?? "",
          href: form.primaryCtaHref ?? "",
        },
        secondaryCta: {
          label: form.secondaryCtaLabel ?? "",
          href: form.secondaryCtaHref ?? "",
        },
        dashboardTitle: form.dashboardTitle ?? form.title ?? "",
      };
      break;
    case "features":
    case "solutions":
    case "pricing":
    case "contact":
      draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        subtitle: form.subtitle ?? "",
        description: form.description ?? "",
        body: form.description ?? "",
      };
      break;
    case "footer":
      draftJson = {
        ...baseDraft,
        body: form.body ?? "",
        copyright: form.copyright ?? "",
      };
      break;
    case "cta":
      draftJson = {
        ...baseDraft,
        body: form.body ?? "",
        cta: {
          label: form.primaryCtaLabel ?? "",
          href: form.primaryCtaHref ?? "",
        },
      };
      break;
    default:
      draftJson = { ...baseDraft, title: form.title ?? "", subtitle: form.subtitle ?? "" };
      break;
  }

  return {
    title: form.title ?? "",
    subtitle: form.subtitle ?? "",
    visible: form.visible,
    draftJson,
  };
}

/**
 * Builds card payload from form state based on section type
 */
export function buildCardPayload(
  sectionSlug: string,
  form: CardFormState,
  section: LandingSection
) {
  const baseDraft = {
    layoutVariant: section.layoutVariant,
    visibility: form.visible,
  } as Record<string, any>;

  let payload: Record<string, any> = {
    visible: form.visible,
  };

  switch (sectionSlug) {
    case "hero": {
      const draftJson = {
        ...baseDraft,
        value: form.value ?? "",
        label: form.label ?? form.title ?? "",
        color: form.color ?? "blue",
      };
      payload = {
        ...payload,
        title: form.value ?? "",
        body: form.label ?? "",
        draftJson,
      };
      break;
    }
    case "features": {
      const draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        body: form.body ?? "",
        icon: form.icon ?? "",
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
      break;
    }
    case "solutions": {
      const features = (form.featuresText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => ({ text }));
      const draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        body: form.body ?? "",
        icon: form.icon ?? "",
        features,
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
      break;
    }
    case "stats": {
      const draftJson = {
        ...baseDraft,
        value: form.value ?? "",
        label: form.label ?? "",
        suffix: form.suffix ?? "",
      };
      payload = {
        ...payload,
        title: form.label ?? "",
        body: form.value ?? "",
        draftJson,
      };
      break;
    }
    case "pricing": {
      const features = (form.featuresText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => ({ text }));
      const priceNumber = Number(form.price);
      const draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        body: form.body ?? "",
        price: Number.isFinite(priceNumber) ? priceNumber : 0,
        period: form.period ?? "monthly",
        isPopular: Boolean(form.isPopular),
        cta: {
          label: form.ctaLabel ?? "",
          href: form.ctaHref ?? "",
        },
        features,
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
      break;
    }
    case "contact": {
      const draftJson = {
        ...baseDraft,
        type: form.type ?? "",
        title: form.title ?? "",
        body: form.body ?? "",
        icon: form.icon ?? "",
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
      break;
    }
    case "navigation": {
      const draftJson = {
        ...baseDraft,
        label: form.title ?? "",
        href: form.link ?? "",
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        draftJson,
      };
      break;
    }
    case "footer": {
      const links = (form.featuresText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((entry) => {
          const [text, href] = entry.split("|").map((value) => value?.trim() ?? "");
          return { text, href };
        })
        .filter((item) => item.text);
      const draftJson = {
        ...baseDraft,
        category: form.category ?? form.title ?? "",
        links,
      };
      payload = {
        ...payload,
        title: form.category ?? form.title ?? "",
        draftJson,
      };
      break;
    }
    default: {
      const draftJson = {
        ...baseDraft,
        title: form.title ?? "",
        body: form.body ?? "",
      };
      payload = {
        ...payload,
        title: form.title ?? "",
        body: form.body ?? "",
        draftJson,
      };
    }
  }

  return payload;
}

