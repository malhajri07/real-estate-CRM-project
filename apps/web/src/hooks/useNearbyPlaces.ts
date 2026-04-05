/**
 * useNearbyPlaces.ts — Fetches nearby POIs via /api/nearby-places
 *
 * Uses propertyId for instant precomputed cache lookup.
 * Falls back to lat/lon coordinate search.
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";

export interface NearbyPlace {
  id: number;
  name: string;
  category: string;
  categoryAr: string;
  lat: number;
  lon: number;
  distance: number;
  distanceFormatted: string;
}

interface CategoryResult {
  key: string;
  labelAr: string;
  labelEn: string;
  place: NearbyPlace | null;
}

export function useNearbyPlaces(
  lat: number | null,
  lon: number | null,
  propertyId?: string,
) {
  const query = useQuery<CategoryResult[]>({
    queryKey: ["nearby-places", propertyId || `${lat},${lon}`],
    queryFn: () => {
      if (propertyId) {
        return apiGet<CategoryResult[]>(`/api/nearby-places?propertyId=${propertyId}`);
      }
      return apiGet<CategoryResult[]>(`/api/nearby-places?lat=${lat}&lon=${lon}`);
    },
    enabled: !!(propertyId || (lat !== null && lon !== null)),
    staleTime: 30 * 60 * 1000, // 30 min
    retry: 1,
  });

  return {
    closestByCategory: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
