/**
 * types.ts - CMS Landing Page Type Definitions
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → cms-landing/ → types.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Type definitions for CMS Landing Page management. Defines:
 * - Landing section types
 * - Landing card types
 * - Form state types
 * 
 * Related Files:
 * - apps/web/src/pages/admin/cms-landing/index.tsx - CMS landing editor uses these types
 */

/**
 * Type definitions for CMS Landing Page management
 */

export type SectionStatus = "draft" | "published" | "archived";

export interface LandingCard {
  id: string;
  sectionId: string;
  orderIndex: number;
  title?: string;
  body?: string;
  mediaUrl?: string;
  icon?: string;
  ctaLabel?: string;
  ctaHref?: string;
  visible: boolean;
  status: SectionStatus;
  version: number;
  draftJson?: Record<string, any>;
  publishedJson?: Record<string, any>;
  updatedBy?: string;
  updatedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
  content?: Record<string, any>;
}

export interface LandingSection {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  layoutVariant: string;
  theme?: Record<string, any>;
  orderIndex: number;
  visible: boolean;
  status: SectionStatus;
  version: number;
  draftJson?: Record<string, any>;
  publishedJson?: Record<string, any>;
  updatedBy?: string;
  updatedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
  cards?: LandingCard[];
  content?: Record<string, any>;
}

export type SectionFormState = {
  title: string;
  subtitle?: string;
  visible: boolean;
  badge?: string;
  body?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  dashboardTitle?: string;
  copyright?: string;
  logoUrl?: string;
  siteName?: string;
};

export type CardFormState = {
  title?: string;
  body?: string;
  icon?: string;
  value?: string;
  label?: string;
  color?: string;
  suffix?: string;
  price?: string;
  period?: "monthly" | "yearly";
  ctaLabel?: string;
  ctaHref?: string;
  isPopular?: boolean;
  featuresText?: string;
  type?: string;
  link?: string;
  category?: string;
  visible: boolean;
};

