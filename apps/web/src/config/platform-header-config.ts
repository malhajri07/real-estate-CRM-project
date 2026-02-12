/**
 * platform-header-config.ts - Platform Header Configuration
 *
 * Centralized route → header mapping for consistent titles and search placeholders.
 * Used by PlatformShell to pass title/searchPlaceholder to Header.
 *
 * Related Files:
 * - apps/web/src/components/layout/PlatformShell.tsx
 * - apps/web/src/components/layout/header.tsx
 * - apps/web/src/config/platform-sidebar.ts - Route paths
 */

export type HeaderConfig = {
  titleKey: string;
  searchPlaceholderKey?: string;
  showSearch?: boolean;
};

/**
 * Path → config mapping. Includes both full paths and aliases (e.g. /leads).
 */
const ROUTE_CONFIG: Record<string, HeaderConfig> = {
  '/home/platform': { titleKey: 'nav.dashboard', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/': { titleKey: 'nav.dashboard', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/leads': { titleKey: 'nav.leads', searchPlaceholderKey: 'leads.search_placeholder', showSearch: true },
  '/leads': { titleKey: 'nav.leads', searchPlaceholderKey: 'leads.search_placeholder', showSearch: true },
  '/home/platform/properties': { titleKey: 'nav.properties', searchPlaceholderKey: 'properties.search_placeholder', showSearch: true },
  '/properties': { titleKey: 'nav.properties', searchPlaceholderKey: 'properties.search_placeholder', showSearch: true },
  '/home/platform/customers': { titleKey: 'nav.customers', searchPlaceholderKey: 'leads.search_placeholder', showSearch: true },
  '/customers': { titleKey: 'nav.customers', searchPlaceholderKey: 'leads.search_placeholder', showSearch: true },
  '/home/platform/pipeline': { titleKey: 'nav.pipeline', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/pipeline': { titleKey: 'nav.pipeline', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/clients': { titleKey: 'nav.clients', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/clients': { titleKey: 'nav.clients', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/reports': { titleKey: 'nav.reports', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/reports': { titleKey: 'nav.reports', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/notifications': { titleKey: 'nav.notifications', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/notifications': { titleKey: 'nav.notifications', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/settings': { titleKey: 'nav.workspace_settings', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/settings': { titleKey: 'nav.workspace_settings', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/agencies': { titleKey: 'nav.agencies', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/agencies': { titleKey: 'nav.agencies', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/pool': { titleKey: 'nav.pool', searchPlaceholderKey: 'pool.search_placeholder', showSearch: true },
  '/pool': { titleKey: 'nav.pool', searchPlaceholderKey: 'pool.search_placeholder', showSearch: true },
  '/home/platform/forum': { titleKey: 'nav.forum', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/forum': { titleKey: 'nav.forum', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/customer-requests': { titleKey: 'nav.customer_requests', searchPlaceholderKey: 'header.search_customer_requests', showSearch: true },
  '/customer-requests': { titleKey: 'nav.customer_requests', searchPlaceholderKey: 'header.search_customer_requests', showSearch: true },
  '/home/platform/admin-requests': { titleKey: 'nav.admin_requests', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/admin/requests': { titleKey: 'nav.admin_requests', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/favorites': { titleKey: 'nav.favorites', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/favorites': { titleKey: 'nav.favorites', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/compare': { titleKey: 'nav.compare', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/compare': { titleKey: 'nav.compare', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/post-listing': { titleKey: 'nav.post_listing', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/post-listing': { titleKey: 'nav.post_listing', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/saved-searches': { titleKey: 'nav.saved_searches', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/saved-searches': { titleKey: 'nav.saved_searches', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/activities': { titleKey: 'nav.activities', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/activities': { titleKey: 'nav.activities', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/calendar': { titleKey: 'nav.calendar', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/calendar': { titleKey: 'nav.calendar', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/unverified-listings': { titleKey: 'nav.unverified_listings', searchPlaceholderKey: 'header.search_unverified_listings', showSearch: true },
  '/home/platform/moderation': { titleKey: 'nav.moderation', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/moderation': { titleKey: 'nav.moderation', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/cms': { titleKey: 'nav.cms', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/cms': { titleKey: 'nav.cms', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/cms-admin': { titleKey: 'nav.cms', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/home/platform/marketing-requests': { titleKey: 'nav.marketing_requests', searchPlaceholderKey: 'nav.search', showSearch: true },
  '/marketing-requests': { titleKey: 'nav.marketing_requests', searchPlaceholderKey: 'nav.search', showSearch: true },
};

/**
 * Path prefix → config for dynamic routes (e.g. /agency/:id, /properties/:id)
 */
const PREFIX_ROUTE_CONFIG: Array<{ prefix: string; config: HeaderConfig }> = [
  { prefix: '/home/platform/agency/', config: { titleKey: 'nav.agency_profile', searchPlaceholderKey: 'nav.search', showSearch: true } },
  { prefix: '/home/platform/agent/', config: { titleKey: 'nav.agent_profile', searchPlaceholderKey: 'nav.search', showSearch: true } },
  { prefix: '/home/platform/properties/', config: { titleKey: 'nav.property_detail', searchPlaceholderKey: 'properties.search_placeholder', showSearch: true } },
  { prefix: '/home/platform/listing/', config: { titleKey: 'nav.listing_public', searchPlaceholderKey: 'nav.search', showSearch: true } },
];

const DEFAULT_CONFIG: HeaderConfig = {
  titleKey: 'nav.dashboard',
  searchPlaceholderKey: 'nav.search',
  showSearch: true,
};

/**
 * Resolve header config by current path.
 * Handles both exact matches and dynamic route prefixes.
 */
export function getHeaderConfigForPath(path: string): HeaderConfig {
  const normalized = path.replace(/\/$/, '') || '/home/platform';

  if (ROUTE_CONFIG[normalized]) {
    return ROUTE_CONFIG[normalized];
  }

  const prefixMatch = PREFIX_ROUTE_CONFIG.find(({ prefix }) => normalized.startsWith(prefix));
  if (prefixMatch) {
    return prefixMatch.config;
  }

  return DEFAULT_CONFIG;
}
