/**
 * CMS Utility Functions
 * 
 * Helper functions for CMS content management, validation, and transformation.
 */

import type { LandingPageContent, PricingPlan } from './cms';

/**
 * Validates CMS content structure
 */
export function validateCMSContent(content: unknown): content is LandingPageContent {
  if (!content || typeof content !== 'object') return false;
  
  const c = content as Record<string, unknown>;
  return (
    typeof c.id === 'number' &&
    typeof c.heroTitle === 'string' &&
    Array.isArray(c.features) &&
    Array.isArray(c.solutions) &&
    Array.isArray(c.stats) &&
    Array.isArray(c.contactInfo) &&
    Array.isArray(c.footerLinks) &&
    Array.isArray(c.navigation)
  );
}

/**
 * Validates pricing plans array
 */
export function validatePricingPlans(plans: unknown): plans is PricingPlan[] {
  if (!Array.isArray(plans)) return false;
  return plans.every(plan => 
    typeof plan === 'object' &&
    plan !== null &&
    typeof (plan as PricingPlan).id === 'string' &&
    typeof (plan as PricingPlan).name === 'string'
  );
}

/**
 * Checks if CMS content is empty
 */
export function isEmptyContent(content: LandingPageContent): boolean {
  return (
    !content.heroTitle &&
    !content.featuresTitle &&
    !content.solutionsTitle &&
    !content.statsTitle &&
    !content.pricingTitle &&
    !content.contactTitle &&
    !content.footerDescription &&
    (!content.features || content.features.length === 0) &&
    (!content.solutions || content.solutions.length === 0)
  );
}

/**
 * Merges CMS content with defaults (for graceful degradation)
 */
export function mergeWithDefaults(
  content: Partial<LandingPageContent>,
  defaults: LandingPageContent
): LandingPageContent {
  return {
    ...defaults,
    ...content,
    features: content.features ?? defaults.features,
    solutions: content.solutions ?? defaults.solutions,
    stats: content.stats ?? defaults.stats,
    contactInfo: content.contactInfo ?? defaults.contactInfo,
    footerLinks: content.footerLinks ?? defaults.footerLinks,
    navigation: content.navigation ?? defaults.navigation,
    heroDashboardMetrics: content.heroDashboardMetrics ?? defaults.heroDashboardMetrics,
  };
}

/**
 * Creates cache key for CMS content
 */
export function createCacheKey(endpoint: string, params?: Record<string, string | number>): string {
  const baseKey = `cms:${endpoint}`;
  if (!params) return baseKey;
  
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
  
  return `${baseKey}?${paramString}`;
}

/**
 * Checks if cached content is still valid
 */
export function isCacheValid(timestamp: number, maxAge: number = 10000): boolean {
  return Date.now() - timestamp < maxAge;
}

/**
 * Normalizes CMS API response
 */
export function normalizeCMSResponse<T>(response: unknown): T | null {
  if (!response || typeof response !== 'object') return null;
  
  try {
    return response as T;
  } catch {
    return null;
  }
}

/**
 * Extracts error message from CMS API error
 */
export function extractCMSError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown CMS error';
}

