/**
 * useMapProperties.ts - Map Properties Hook
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → hooks/ → useMapProperties.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Custom hook for map property data. Handles:
 * - Fetching property data
 * - Property data transformation
 * - Property filtering
 * 
 * Related Files:
 * - apps/web/src/pages/map/index.tsx - Map page
 * - apps/web/src/pages/map/hooks/useMapFilters.ts - Filters hook
 */

/**
 * useMapProperties Hook
 * 
 * Handles fetching and transforming property data
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { logger } from "@/lib/logger";
import type { ApiListing, ListingsResponse, PropertySummary } from "../types";
import { asNumber, sqmFromSquareFeet } from "../utils/formatters";

export function useMapProperties() {
  // Load ALL listing data from the backend. We fetch all records and do client-side filtering/pagination.
  const listingsQuery = useQuery<ListingsResponse>({
    queryKey: ["public-property-search-all"],
    queryFn: async () => {
      // Fetch all records from database using pageSize=all
      const response = await apiRequest("GET", `/api/listings?page=1&pageSize=all`);
      const payload = (await response.json()) as ListingsResponse;
      return payload;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten and sanitize the raw API payload into the `PropertySummary` shape
  // consumed by both the map and table views.
  const properties = useMemo<PropertySummary[]>(() => {
    if (!listingsQuery.data?.items) return [];

    return listingsQuery.data.items.map((item: ApiListing) => {
      const fallbackListing = item.listings?.find(
        (listing) => typeof listing?.price === "number" && Number.isFinite(listing.price as number)
      );

      const price = asNumber(item.price) ?? asNumber(fallbackListing?.price ?? null);
      const area = asNumber(item.areaSqm) ?? sqmFromSquareFeet(asNumber(item.squareFeet));

      return {
        id: item.id,
        title: (item.title ?? "").toString().trim() || "عقار بدون عنوان",
        address: (item.address ?? "").toString().trim(),
        city: (item.city ?? "").toString().trim(),
        cityId: asNumber(item.cityId),
        region: (item.region ?? "").toString().trim(),
        regionId: asNumber(item.regionId),
        district: (item.district ?? "").toString().trim(),
        districtId: item.districtId ? String(item.districtId) : null,
        price,
        bedrooms: asNumber(item.bedrooms),
        bathrooms: asNumber(item.bathrooms),
        areaSqm: area,
        latitude: asNumber(item.latitude),
        longitude: asNumber(item.longitude),
        propertyType: (item.type ?? "").toString().trim(),
        transactionType: (item.transactionType ?? "").toString().trim(),
        status: (item.status ?? "").toString().trim(),
        photoUrls: (() => {
          // Try photoUrls first
          if (Array.isArray((item as any).photoUrls) && (item as any).photoUrls.length > 0) {
            return (item as any).photoUrls;
          }
          // Try imageGallery
          if (Array.isArray((item as any).imageGallery) && (item as any).imageGallery.length > 0) {
            return (item as any).imageGallery;
          }
          // Try photos field - could be array or JSON string
          if ((item as any).photos) {
            try {
              let parsed = (item as any).photos;
              // If it's a string, try to parse it
              if (typeof parsed === "string") {
                parsed = JSON.parse(parsed);
              }
              // If it's an array with items, return it
              if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
              }
            } catch (e) {
              // Ignore parsing errors
              logger.warn("Failed to parse photos", {
                context: "useMapProperties",
                data: { propertyId: item.id, error: e instanceof Error ? e.message : String(e) }
              });
            }
          }
          return undefined;
        })(),
      } satisfies PropertySummary;
    });
  }, [listingsQuery.data]);

  return {
    listingsQuery,
    properties,
  };
}

