/**
 * useMapLocations.ts - Map Locations Hook
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → hooks/ → useMapLocations.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Custom hook for map location data. Handles:
 * - Fetching location data (regions, cities, districts)
 * - Location data transformation
 * - Location options for filters
 * 
 * Related Files:
 * - apps/web/src/pages/map/index.tsx - Map page
 * - apps/api/routes/locations.ts - Locations API routes
 */

/**
 * useMapLocations Hook
 * 
 * Handles fetching and transforming location data (regions, cities, districts)
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RegionPayload, CityPayload, DistrictPayload, Option, CityOption, DistrictOption } from "../types";

/**
 * Hook for fetching regions with boundaries (for map polygon display)
 */
export function useMapRegionsWithBoundaries() {
  return useQuery<RegionPayload[]>({
    queryKey: ["locations", "regions", "withBoundary"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations/regions?includeBoundary=true");
      return (await response.json()) as RegionPayload[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useMapLocations(selectedRegion: string) {
  // Fetch regions
  const regionsQuery = useQuery<RegionPayload[]>({
    queryKey: ["locations", "regions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations/regions");
      return (await response.json()) as RegionPayload[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Fetch cities (filtered by region if selected)
  const citiesQuery = useQuery<CityPayload[]>({
    queryKey: ["locations", "cities", selectedRegion],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedRegion !== "all") {
        params.set("regionId", selectedRegion);
      }
      const query = params.toString();
      const response = await apiRequest(
        "GET",
        `/api/locations/cities${query ? `?${query}` : ""}`
      );
      return (await response.json()) as CityPayload[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Convert regions to options
  const regionOptions = useMemo<Option[]>(() => {
    if (!regionsQuery.data) return [];
    return regionsQuery.data
      .map((region) => ({
        id: String(region.id),
        label: (region.nameAr ?? region.nameEn ?? `منطقة ${region.id}`).toString().trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [regionsQuery.data]);

  // Convert cities to options
  const cityOptions = useMemo<CityOption[]>(() => {
    const source = citiesQuery.data ?? [];
    return source
      .map((city) => ({
        id: String(city.id),
        label: (city.nameAr ?? city.nameEn ?? `مدينة ${city.id}`).toString().trim(),
        regionId: city.regionId !== null ? String(city.regionId) : null,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [citiesQuery.data]);

  return {
    regionsQuery,
    citiesQuery,
    regionOptions,
    cityOptions,
  };
}

/**
 * Hook for fetching districts with boundaries for a specific city
 */
export function useMapDistricts(cityId: number | null) {
  const districtsQuery = useQuery<DistrictPayload[]>({
    queryKey: ["locations", "districts", cityId],
    queryFn: async () => {
      if (typeof cityId !== "number" || Number.isNaN(cityId)) {
        return [];
      }
      const response = await apiRequest(
        "GET",
        `/api/locations/districts?cityId=${cityId}&includeBoundary=true`
      );
      return (await response.json()) as DistrictPayload[];
    },
    enabled: typeof cityId === "number" && Number.isFinite(cityId),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Convert districts to options
  const districtOptions = useMemo<DistrictOption[]>(() => {
    const source = districtsQuery.data ?? [];
    return source
      .map((district) => ({
        id: String(district.id),
        label: (district.nameAr ?? district.nameEn ?? `حي ${district.id}`).toString().trim(),
        cityId: district.cityId !== null ? String(district.cityId) : null,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [districtsQuery.data]);

  return {
    districtsQuery,
    districtOptions,
  };
}

