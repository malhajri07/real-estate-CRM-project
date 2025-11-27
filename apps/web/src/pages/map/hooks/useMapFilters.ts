/**
 * useMapFilters.ts - Map Filters Hook
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → hooks/ → useMapFilters.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Custom hook for map filter management. Handles:
 * - Filter state management
 * - Filtering logic
 * - Filter application
 * 
 * Related Files:
 * - apps/web/src/pages/map/index.tsx - Map page
 * - apps/web/src/pages/map/hooks/useMapProperties.ts - Properties hook
 */

/**
 * useMapFilters Hook
 * 
 * Handles filter state management and filtering logic
 */

import { useMemo } from "react";
import type { FilterState, PropertySummary, CityOption, CityQuickFilterOption } from "../types";
import { parseFilterNumber } from "../utils/formatters";

interface UseMapFiltersProps {
  properties: PropertySummary[];
  filters: FilterState;
  favoriteIds: string[];
  cityOptions: CityOption[];
}

export function useMapFilters({
  properties,
  filters,
  favoriteIds,
  cityOptions,
}: UseMapFiltersProps) {
  // Build unique property/transaction type pickers so filters stay relevant to the current dataset.
  // If a city is selected, only show property types available in that city (hierarchical filtering)
  const propertyTypeOptions = useMemo(() => {
    const set = new Set<string>();
    const cityId = filters.city !== "all" ? Number(filters.city) : null;
    const cityOption = filters.city !== "all" ? cityOptions.find(opt => opt.id === filters.city) : null;
    
    properties.forEach((property) => {
      // If city filter is active, only include properties from that city
      if (filters.city !== "all") {
        // Check by cityId first
        if (cityId !== null && Number.isFinite(cityId) && property.cityId !== null && property.cityId === cityId) {
          // Match by cityId
        } else if (cityOption && property.city?.toLowerCase().trim() === cityOption.label.toLowerCase().trim()) {
          // Match by city name
        } else {
          // Property doesn't match selected city, skip it
          return;
        }
      }
      
      // Add property type if property matches city filter
      if (property.propertyType) set.add(property.propertyType);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [properties, filters.city, cityOptions]);

  const transactionTypeOptions = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((property) => {
      if (property.transactionType) set.add(property.transactionType);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [properties]);

  // Applies all client-side filters on top of the paginated payload. Most of the
  // filters are simple equality checks, so we short-circuit early to keep it fast.
  const filteredProperties = useMemo(() => {
    const normalizedQuery = filters.search.trim().toLowerCase();
    const minPriceValue = parseFilterNumber(filters.minPrice);
    const maxPriceValue = parseFilterNumber(filters.maxPrice);
    const minBedroomsValue = parseFilterNumber(filters.minBedrooms);
    const minBathroomsValue = parseFilterNumber(filters.minBathrooms);
    const minAreaValue = parseFilterNumber(filters.minArea);
    const maxAreaValue = parseFilterNumber(filters.maxArea);

    return properties.filter((property) => {
      if (filters.favoritesOnly && !favoriteIds.includes(property.id)) {
        return false;
      }

      if (normalizedQuery) {
        const haystack = [property.title, property.city, property.region, property.district, property.address]
          .filter((value): value is string => Boolean(value))
          .map((value) => value.toLowerCase());
        const matches = haystack.some((value) => value.includes(normalizedQuery));
        if (!matches) return false;
      }

      if (filters.region !== "all") {
        const regionId = Number(filters.region);
        if (!Number.isFinite(regionId) || property.regionId !== regionId) {
          return false;
        }
      }

      if (filters.city !== "all") {
        const cityId = Number(filters.city);
        // Check by cityId if both are available
        if (Number.isFinite(cityId) && property.cityId !== null && property.cityId === cityId) {
          // Match found by cityId
        } else {
          // Fallback: check by city name if cityId doesn't match or is missing
          // Find the city option to get its name
          const cityOption = cityOptions.find(opt => opt.id === filters.city);
          if (cityOption) {
            // Compare by city name (case-insensitive)
            if (property.city?.toLowerCase().trim() !== cityOption.label.toLowerCase().trim()) {
              return false;
            }
          } else {
            // If city option not found, no match
            return false;
          }
        }
      }

      if (filters.district !== "all" && property.districtId !== filters.district) {
        return false;
      }

      if (filters.propertyType !== "all" && property.propertyType && property.propertyType.toLowerCase() !== filters.propertyType.toLowerCase()) {
        return false;
      }

      if (
        filters.transactionType !== "all" &&
        property.transactionType &&
        property.transactionType.toLowerCase() !== filters.transactionType.toLowerCase()
      ) {
        return false;
      }

      if (minPriceValue !== null && (property.price === null || property.price < minPriceValue)) {
        return false;
      }

      if (maxPriceValue !== null && (property.price === null || property.price > maxPriceValue)) {
        return false;
      }

      if (minBedroomsValue !== null && (property.bedrooms === null || property.bedrooms < minBedroomsValue)) {
        return false;
      }

      if (minBathroomsValue !== null && (property.bathrooms === null || property.bathrooms < minBathroomsValue)) {
        return false;
      }

      if (minAreaValue !== null && (property.areaSqm === null || property.areaSqm < minAreaValue)) {
        return false;
      }

      if (maxAreaValue !== null && (property.areaSqm === null || property.areaSqm > maxAreaValue)) {
        return false;
      }

      return true;
    });
  }, [properties, filters, favoriteIds, cityOptions]);

  // Surface the top cities present in the base properties list as quick-action chips.
  // We use the base properties array (not filteredProperties) so the city filter buttons
  // always show all available cities, allowing users to filter by any city.
  const topCityFilters = useMemo<CityQuickFilterOption[]>(() => {
    if (!properties.length) return [];

    const counts = new Map<string, CityQuickFilterOption>();
    const cityMatchCache = new Map<string, string | null>();

    const resolveCityFilter = (cityName: string, cityId: number | null): { mode: "city" | "search"; value: string } => {
      if (typeof cityId === "number" && Number.isFinite(cityId)) {
        return { mode: "city", value: String(cityId) };
      }

      const cached = cityMatchCache.get(cityName);
      if (cached !== undefined) {
        return cached ? { mode: "city", value: cached } : { mode: "search", value: cityName };
      }

      const matchedOption = cityOptions.find((option) => option.label === cityName);
      if (matchedOption) {
        cityMatchCache.set(cityName, matchedOption.id);
        return { mode: "city", value: matchedOption.id };
      }

      cityMatchCache.set(cityName, null);
      return { mode: "search", value: cityName };
    };

    properties.forEach((property) => {
      const cityName = property.city?.trim();
      if (!cityName) return;

      const { mode, value } = resolveCityFilter(cityName, property.cityId);
      const key = `${mode}:${value}`;
      const existing = counts.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, {
          key,
          label: cityName,
          count: 1,
          mode,
          value,
        });
      }
    });

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [properties, cityOptions]);

  // Count properties for each type (used in property type filters)
  // If a city is selected, only count properties in that city (hierarchical filtering)
  const propertyTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const cityId = filters.city !== "all" ? Number(filters.city) : null;
    const cityOption = filters.city !== "all" ? cityOptions.find(opt => opt.id === filters.city) : null;
    
    properties.forEach((property) => {
      // If city filter is active, only count properties from that city
      if (filters.city !== "all") {
        // Check by cityId first
        if (cityId !== null && Number.isFinite(cityId) && property.cityId !== null && property.cityId === cityId) {
          // Match by cityId
        } else if (cityOption && property.city?.toLowerCase().trim() === cityOption.label.toLowerCase().trim()) {
          // Match by city name
        } else {
          // Property doesn't match selected city, skip it
          return;
        }
      }
      
      // Count property type if property matches city filter
      if (property.propertyType) {
        counts.set(property.propertyType, (counts.get(property.propertyType) || 0) + 1);
      }
    });
    return counts;
  }, [properties, filters.city, cityOptions]);

  return {
    filteredProperties,
    propertyTypeOptions,
    transactionTypeOptions,
    topCityFilters,
    propertyTypeCounts,
  };
}

