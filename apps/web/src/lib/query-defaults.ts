/**
 * query-defaults.ts — Shared React Query cache configuration
 *
 * Use STATIC for data that rarely changes (locations, categories, types).
 * Use DYNAMIC for frequently updated data (leads, deals, appointments).
 */

/** 10 min stale, 30 min garbage collection — for locations, property types, categories */
export const STATIC_QUERY_OPTIONS = {
  staleTime: 10 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const;

/** 30 sec stale — for leads, deals, appointments, activities */
export const DYNAMIC_QUERY_OPTIONS = {
  staleTime: 30 * 1000,
} as const;

/** 5 min stale — for dashboard metrics, reports */
export const METRICS_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000,
} as const;
