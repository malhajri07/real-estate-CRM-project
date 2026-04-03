/**
 * useFilters.ts - Filter State Management Hook
 *
 * Location: apps/web/src/ -> Hooks/ -> useFilters.ts
 *
 * Manages a set of key-value filters for search pages, tables, and lists.
 * Provides helpers for setting, removing, clearing, counting, and
 * serializing/deserializing filters to/from URL search params.
 *
 * @example
 * const filters = useFilters<{ status: string[]; city: string[]; priceMin: number }>({
 *   defaultValues: { status: [], city: [], priceMin: 0 },
 * });
 */

import { useState, useCallback, useMemo } from "react";

/** Serializable filter value types */
export type FilterValue = string | number | boolean | string[] | null;

export interface FilterChip {
  /** Filter key */
  key: string;
  /** Human-readable label */
  label: string;
  /** Display value */
  displayValue: string;
}

export interface UseFiltersOptions<T extends Record<string, FilterValue>> {
  /** Initial/default values for each filter key */
  defaultValues: T;
  /**
   * Optional map of filter key -> human-readable label.
   * Used when generating filter chips.
   */
  labels?: Partial<Record<keyof T, string>>;
  /** Called whenever filters change */
  onChange?: (filters: T) => void;
}

export interface UseFiltersReturn<T extends Record<string, FilterValue>> {
  /** Current filter values */
  filters: T;
  /** Set a single filter value */
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Remove (reset to default) a single filter */
  removeFilter: <K extends keyof T>(key: K) => void;
  /** Reset all filters to default values */
  clearAll: () => void;
  /** Number of active (non-default) filters */
  activeCount: number;
  /** Whether any filter differs from its default */
  hasActiveFilters: boolean;
  /** Array of active filter chips for display */
  chips: FilterChip[];
  /** Toggle an item in an array filter */
  toggleArrayItem: <K extends keyof T>(key: K, item: string) => void;
  /** Serialize filters to a URLSearchParams string */
  toSearchParams: () => string;
  /** Load filters from a URLSearchParams string */
  fromSearchParams: (params: string) => void;
}

/** Check if a value is "empty" (matches default or is empty array/null). */
function isDefaultValue(value: FilterValue, defaultValue: FilterValue): boolean {
  if (value === defaultValue) return true;
  if (value === null || value === undefined) return true;
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    return value.length === 0 && defaultValue.length === 0;
  }
  if (Array.isArray(value) && value.length === 0) return true;
  if (value === "" && (defaultValue === "" || defaultValue === null)) return true;
  return false;
}

/** Format a filter value for display in a chip. */
function formatChipValue(value: FilterValue): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

/**
 * Hook for managing filter state with chip generation and URL sync.
 */
export function useFilters<T extends Record<string, FilterValue>>({
  defaultValues,
  labels = {},
  onChange,
}: UseFiltersOptions<T>): UseFiltersReturn<T> {
  const [filters, setFilters] = useState<T>({ ...defaultValues });

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const removeFilter = useCallback(
    <K extends keyof T>(key: K) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: defaultValues[key] };
        onChange?.(next);
        return next;
      });
    },
    [defaultValues, onChange],
  );

  const clearAll = useCallback(() => {
    const reset = { ...defaultValues };
    setFilters(reset);
    onChange?.(reset);
  }, [defaultValues, onChange]);

  const toggleArrayItem = useCallback(
    <K extends keyof T>(key: K, item: string) => {
      setFilters((prev) => {
        const current = prev[key];
        if (!Array.isArray(current)) return prev;
        const exists = current.includes(item);
        const updated = exists
          ? current.filter((i: string) => i !== item)
          : [...current, item];
        const next = { ...prev, [key]: updated as T[K] };
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const activeCount = useMemo(
    () =>
      Object.keys(filters).filter(
        (key) => !isDefaultValue(filters[key] as FilterValue, defaultValues[key] as FilterValue),
      ).length,
    [filters, defaultValues],
  );

  const hasActiveFilters = activeCount > 0;

  const chips: FilterChip[] = useMemo(() => {
    const result: FilterChip[] = [];
    for (const key of Object.keys(filters)) {
      const value = filters[key] as FilterValue;
      const defaultValue = defaultValues[key] as FilterValue;
      if (!isDefaultValue(value, defaultValue)) {
        result.push({
          key,
          label: (labels as Record<string, string>)[key] ?? key,
          displayValue: formatChipValue(value),
        });
      }
    }
    return result;
  }, [filters, defaultValues, labels]);

  const toSearchParams = useCallback((): string => {
    const params = new URLSearchParams();
    for (const key of Object.keys(filters)) {
      const value = filters[key] as FilterValue;
      const defaultValue = defaultValues[key] as FilterValue;
      if (!isDefaultValue(value, defaultValue)) {
        if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else if (value !== null && value !== undefined) {
          params.set(key, String(value));
        }
      }
    }
    return params.toString();
  }, [filters, defaultValues]);

  const fromSearchParams = useCallback(
    (paramsStr: string) => {
      const params = new URLSearchParams(paramsStr);
      const next = { ...defaultValues };
      for (const key of Object.keys(defaultValues)) {
        const raw = params.get(key);
        if (raw === null) continue;
        const defaultValue = defaultValues[key];
        if (Array.isArray(defaultValue)) {
          (next as Record<string, FilterValue>)[key] = raw.split(",").filter(Boolean);
        } else if (typeof defaultValue === "number") {
          const num = Number(raw);
          (next as Record<string, FilterValue>)[key] = Number.isFinite(num) ? num : defaultValue;
        } else if (typeof defaultValue === "boolean") {
          (next as Record<string, FilterValue>)[key] = raw === "true";
        } else {
          (next as Record<string, FilterValue>)[key] = raw;
        }
      }
      setFilters(next);
      onChange?.(next);
    },
    [defaultValues, onChange],
  );

  return {
    filters,
    setFilter,
    removeFilter,
    clearAll,
    activeCount,
    hasActiveFilters,
    chips,
    toggleArrayItem,
    toSearchParams,
    fromSearchParams,
  };
}
