/**
 * useMapView Hook
 * 
 * Handles view state management (map/table mode, pagination, favorites, highlights)
 */

import { useState, useEffect, useMemo } from "react";
import type { PropertySummary, FilterState } from "../types";

interface UseMapViewProps {
  filteredProperties: PropertySummary[];
  filters: FilterState;
  pageSize?: number;
}

export function useMapView({
  filteredProperties,
  filters,
  pageSize = 25,
}: UseMapViewProps) {
  // View state
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFavoritesDrawerOpen, setIsFavoritesDrawerOpen] = useState(false);
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Defer anything that relies on the `window` object until we know we are on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Calculate pagination totals based on filtered results, not API response.
  // This ensures pagination reflects the current filters (city, region, etc.)
  useEffect(() => {
    const filteredCount = filteredProperties.length;
    const calculatedTotalPages = filteredCount > 0 ? Math.max(1, Math.ceil(filteredCount / pageSize)) : 0;
    setTotalItems(filteredCount);
    setTotalPages(calculatedTotalPages);
  }, [filteredProperties.length, pageSize]);

  // Reset to page 1 if current page exceeds available pages after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Paginate the filtered results client-side so pagination reflects current filters
  const paginatedFilteredProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProperties.slice(startIndex, endIndex);
  }, [filteredProperties, currentPage, pageSize]);

  // Resolve the full property object for the active highlight so both views stay in sync
  const highlightedProperty = useMemo(
    () => filteredProperties.find((property) => property.id === highlightedPropertyId) ?? null,
    [filteredProperties, highlightedPropertyId]
  );

  return {
    // View mode
    viewMode,
    setViewMode,
    
    // UI state
    isFilterOpen,
    setIsFilterOpen,
    isFavoritesDrawerOpen,
    setIsFavoritesDrawerOpen,
    
  // Highlighting
  highlightedPropertyId,
  setHighlightedPropertyId,
  highlightedProperty,
  
  // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    paginatedFilteredProperties,
    
    // Client-side rendering
    isClient,
  };
}

