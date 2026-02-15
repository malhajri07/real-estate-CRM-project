/**
 * map/index.tsx - Property Map Page
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → index.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Main page component for property map exploration. Provides:
 * - Interactive property map
 * - Property listing with filters
 * - Map and list view toggle
 * - Property search and filtering
 * 
 * Route: /map
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Heart,
  SlidersHorizontal,
  RefreshCcw,
  Map as MapIcon,
  LayoutGrid,
  Search
} from "lucide-react";
import { motion } from "framer-motion";

import PublicHeader from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatCurrency } from "./utils/formatters";
import { normalizeBoundaryToPolygon } from "./utils/map-helpers";
import { DEFAULT_FILTERS } from "./utils/constants";
import type { FilterState, CityQuickFilterOption, DistrictPolygonShape } from "./types";
import {
  PropertiesMapErrorBoundary,
  FilterContent,
  PropertiesMap,
  PropertiesList,
} from "./components";
import {
  useMapLocations,
  useMapDistricts,
  useMapProperties,
  useMapFilters,
  useMapView,
} from "./hooks";

export default function MapPage() {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Fetch location data
  const { regionsQuery, citiesQuery, regionOptions, cityOptions } = useMapLocations(filters.region);

  // Fetch property data
  const { listingsQuery, properties } = useMapProperties();

  // Manage favorites separately (needed before filters)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const toggleFavorite = (propertyId: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  // Apply filters (needs favoriteIds)
  const {
    filteredProperties,
    propertyTypeOptions,
    transactionTypeOptions,
    topCityFilters,
    propertyTypeCounts,
  } = useMapFilters({
    properties,
    filters,
    favoriteIds,
    cityOptions,
  });

  // Get view state management (needs filteredProperties)
  const {
    viewMode,
    setViewMode,
    isFilterOpen,
    setIsFilterOpen,
    isFavoritesDrawerOpen,
    setIsFavoritesDrawerOpen,
    highlightedPropertyId,
    setHighlightedPropertyId,
    highlightedProperty,
    currentPage: currentPageState,
    setCurrentPage: setCurrentPageState,
    totalPages: totalPagesState,
    totalItems: totalItemsState,
    paginatedFilteredProperties: paginatedProperties,
    isClient,
  } = useMapView({
    filteredProperties,
    filters,
    pageSize: 25,
  });

  // Determine which city to use for district boundaries
  const boundaryCityId = useMemo(() => {
    if (filters.city !== "all") {
      const parsed = Number(filters.city);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof highlightedProperty?.cityId === "number" && Number.isFinite(highlightedProperty.cityId)) {
      return highlightedProperty.cityId;
    }
    return null;
  }, [filters.city, highlightedProperty?.cityId]);

  // Fetch districts for the selected city
  const { districtsQuery, districtOptions } = useMapDistricts(boundaryCityId);

  // Filter city options by selected region
  const filteredCityOptions = useMemo(() => {
    if (filters.region === "all") return cityOptions;
    return cityOptions.filter((city) => city.regionId === filters.region);
  }, [cityOptions, filters.region]);

  // Filter district options by selected city
  const filteredDistrictOptions = useMemo(() => {
    if (filters.city === "all") return districtOptions;
    return districtOptions.filter((district) => district.cityId === filters.city);
  }, [districtOptions, filters.city]);

  // Sync city selection when region changes
  useEffect(() => {
    if (!citiesQuery.data) return;
    if (filters.city === "all") return;
    const hasSelectedCity = citiesQuery.data.some((city) => String(city.id) === filters.city);
    if (!hasSelectedCity) {
      setFilters((prev) => ({ ...prev, city: "all", district: "all" }));
    }
  }, [citiesQuery.data, filters.city]);

  // Sync district selection when city changes
  useEffect(() => {
    if (filters.district === "all") return;
    if (!districtsQuery.data) return;
    const hasSelectedDistrict = districtsQuery.data.some((district) => String(district.id) === filters.district);
    if (!hasSelectedDistrict) {
      setFilters((prev) => ({ ...prev, district: "all" }));
    }
  }, [districtsQuery.data, filters.district]);

  // Build district polygon for map display
  const selectedDistrictId = filters.district !== "all" ? filters.district : highlightedProperty?.districtId ?? null;
  const districtPolygon = useMemo<DistrictPolygonShape | null>(() => {
    if (!selectedDistrictId || !districtsQuery.data) return null;
    const district = districtsQuery.data.find((candidate) => String(candidate.id) === selectedDistrictId);
    if (!district?.boundary) return null;
    const paths = normalizeBoundaryToPolygon(district.boundary);
    if (!paths.length) return null;
    return {
      paths,
      isFilterMatch: filters.district !== "all",
    };
  }, [districtsQuery.data, selectedDistrictId, filters.district]);

  // Get favorite properties
  const favoriteProperties = useMemo(
    () => properties.filter((property) => favoriteIds.includes(property.id)),
    [properties, favoriteIds]
  );

  // Auto-close favorites drawer when empty
  useEffect(() => {
    if (!favoriteIds.length) {
      setIsFavoritesDrawerOpen(false);
    }
  }, [favoriteIds, setIsFavoritesDrawerOpen]);

  // Remove highlight if property falls out of filtered results
  useEffect(() => {
    if (highlightedPropertyId && !filteredProperties.some((property) => property.id === highlightedPropertyId)) {
      setHighlightedPropertyId(null);
    }
  }, [filteredProperties, highlightedPropertyId, setHighlightedPropertyId]);

  // Default to first mappable property
  useEffect(() => {
    if (highlightedPropertyId) return;
    const firstWithCoordinates = filteredProperties.find(
      (property) => typeof property.latitude === "number" && typeof property.longitude === "number"
    );
    if (firstWithCoordinates) {
      setHighlightedPropertyId(firstWithCoordinates.id);
    }
  }, [filteredProperties, highlightedPropertyId, setHighlightedPropertyId]);

  // Handlers
  const handleFavoritesToggle = (propertyId: string) => {
    const wasFavorite = favoriteIds.includes(propertyId);
    toggleFavorite(propertyId);
    if (!wasFavorite) {
      setIsFavoritesDrawerOpen(true);
    }
  };

  const handleNavigate = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };

  const handleFilterToggle = () => {
    setIsFilterOpen(true);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleQuickCityFilter = (filter: CityQuickFilterOption) => {
    setViewMode("table");
    setCurrentPageState(1);
    setFilters((prev) => {
      if (filter.mode === "city") {
        const nextCity = prev.city === filter.value ? "all" : filter.value;
        return {
          ...prev,
          city: nextCity,
          district: "all",
          propertyType: "all",
          search: nextCity === "all" ? prev.search : "",
        };
      }
      const normalizedSearch = prev.search.trim();
      const isActiveSearch = normalizedSearch === filter.value;
      return {
        ...prev,
        search: isActiveSearch ? "" : filter.value,
        city: "all",
        district: "all",
        propertyType: "all",
      };
    });
  };

  // Render helpers
  const renderQuickCityFilters = () => {
    if (listingsQuery.isLoading || !topCityFilters.length) return null;
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {topCityFilters.map((city) => {
          const isActive =
            city.mode === "city" ? filters.city === city.value : filters.search.trim() === city.value;
          return (
            <Button
              key={city.key}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-8 rounded-full border px-3 text-xs transition-colors",
                isActive
                  ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700"
                  : "border-slate-200 bg-white/50 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
              )}
              onClick={() => handleQuickCityFilter(city)}
            >
              <span className={cn("font-bold", isActive ? "text-white" : "text-slate-900")}>{city.label}</span>
              <span className={cn("text-[10px] mr-1", isActive ? "text-white/90" : "text-slate-500")}>({city.count})</span>
            </Button>
          );
        })}
      </div>
    );
  };

  const renderQuickPropertyTypeFilters = () => {
    if (listingsQuery.isLoading || !propertyTypeOptions.length) return null;
    return (
      <div className="flex flex-wrap gap-2 pt-2">
        {propertyTypeOptions.map((type) => {
          const isActive = filters.propertyType === type;
          const count = propertyTypeCounts.get(type) || 0;
          return (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-8 rounded-full border px-3 text-xs transition-colors",
                isActive
                  ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700"
                  : "border-slate-200 bg-white/50 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
              )}
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  propertyType: isActive ? "all" : type,
                }));
                setCurrentPageState(1);
              }}
            >
              <span className={cn("font-normal", isActive ? "text-white" : "text-slate-900")}>{type}</span>
              <span className={cn("text-[10px] mr-1", isActive ? "text-white/90" : "text-slate-500")}>({count})</span>
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
      <PublicHeader />

      <main className="relative pt-10 pb-20 px-4 md:px-6 w-full max-w-7xl mx-auto">
        {/* Background Blobs */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col gap-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4"
          >
             
             {/* Controls Bar */}
             <div className="flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  onClick={handleFilterToggle}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>الفلتر</span>
                </Button>

                <div className="h-6 w-px bg-slate-200 mx-1" />

                <div className="flex items-center bg-slate-100/50 rounded-xl p-1">
                  <Button
                    type="button"
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-lg px-3 text-xs transition-all",
                      viewMode === "map" 
                        ? "bg-white text-emerald-600 shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                    onClick={() => setViewMode("map")}
                  >
                    <MapIcon className="h-3.5 w-3.5 ml-1.5" />
                    الخريطة
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-lg px-3 text-xs transition-all",
                      viewMode === "table" 
                        ? "bg-white text-emerald-600 shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                    onClick={() => setViewMode("table")}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 ml-1.5" />
                    القائمة
                  </Button>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1" />

                <Button
                  type="button"
                  variant={filters.favoritesOnly ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 gap-2 rounded-xl transition-all",
                    filters.favoritesOnly 
                      ? "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700" 
                      : "text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                  )}
                  onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
                >
                  <Heart className={cn("h-4 w-4", filters.favoritesOnly && "fill-current")} />
                  <span>المفضلة</span>
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  onClick={handleReset}
                  title="إعادة تعيين"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
             </div>
          </motion.div>

          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {viewMode === "table" ? (
              <div className="glass rounded-[32px] border border-white/50 bg-white/60 shadow-xl overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col gap-4 border-b border-slate-100/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                       <LayoutGrid className="w-5 h-5 text-emerald-600" />
                       قائمة العقارات
                    </h2>
                    {!listingsQuery.isLoading && (
                      <span className="text-sm font-medium text-slate-500 bg-slate-100/50 px-3 py-1 rounded-full">
                        {filteredProperties.length} عقار متاح
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {renderQuickCityFilters()}
                    {renderQuickPropertyTypeFilters()}
                  </div>
                </div>

                <div className="p-6 md:p-8 pt-0">
                  {listingsQuery.isLoading ? (
                    <div className="flex h-64 items-center justify-center flex-col gap-4 text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <p>جار تحميل بيانات العقارات...</p>
                    </div>
                  ) : listingsQuery.isError ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center text-red-600">
                      حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى لاحقًا.
                    </div>
                  ) : (
                    <>
                      <PropertiesList
                        properties={paginatedProperties}
                        favoriteIds={favoriteIds}
                        highlightedId={highlightedPropertyId}
                        onHighlight={(property) => setHighlightedPropertyId(property?.id ?? null)}
                        onToggleFavorite={handleFavoritesToggle}
                        onNavigate={handleNavigate}
                      />

                      {/* Pagination Controls */}
                      {totalItemsState > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-100 mt-6 pt-6">
                          <div className="text-sm text-slate-500">
                            عرض {((currentPageState - 1) * 25) + 1} إلى {Math.min(currentPageState * 25, totalItemsState)} من {totalItemsState} نتيجة
                          </div>

                          {totalPagesState > 1 && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPageState(prev => Math.max(1, prev - 1))}
                                disabled={currentPageState === 1}
                                className="h-9 px-4 rounded-xl text-xs border-slate-200 hover:bg-slate-50"
                              >
                                السابق
                              </Button>

                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPagesState) }, (_, i) => {
                                  const pageNum = i + 1;
                                  const isActive = pageNum === currentPageState;

                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={isActive ? "default" : "ghost"}
                                      size="sm"
                                      onClick={() => setCurrentPageState(pageNum)}
                                      className={cn(
                                        "h-9 w-9 p-0 rounded-xl text-xs transition-all",
                                        isActive ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'hover:bg-slate-100'
                                      )}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}

                                {totalPagesState > 5 && (
                                  <>
                                    <span className="text-xs text-slate-400">...</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCurrentPageState(totalPagesState)}
                                      className="h-9 w-9 p-0 rounded-xl text-xs hover:bg-slate-100"
                                    >
                                      {totalPagesState}
                                    </Button>
                                  </>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPageState(prev => Math.min(totalPagesState, prev + 1))}
                                disabled={currentPageState === totalPagesState}
                                className="h-9 px-4 rounded-xl text-xs border-slate-200 hover:bg-slate-50"
                              >
                                التالي
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass rounded-[32px] border border-white/50 bg-white/60 shadow-xl overflow-hidden w-full">
                <div className="p-6 border-b border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                       <MapIcon className="w-5 h-5 text-emerald-600" />
                       خريطة العقارات
                    </h2>
                    <p className="text-sm text-slate-500">استكشف العقارات على خريطة تفاعلية</p>
                  </div>
                  <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    {listingsQuery.isLoading
                      ? "جار تحميل العقارات..."
                      : `${filteredProperties.filter((property) => property.latitude && property.longitude).length} عقار على الخريطة`
                    }
                  </div>
                </div>
                <div className="h-[600px] w-full bg-slate-50 relative">
                  {listingsQuery.isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-slate-500 bg-white/50 backdrop-blur-sm z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <p>جار تحميل الخريطة...</p>
                    </div>
                  ) : listingsQuery.isError ? (
                    <div className="absolute inset-0 flex items-center justify-center text-red-600 bg-red-50/50">
                      <p>حدث خطأ أثناء تحميل البيانات</p>
                    </div>
                  ) : (
                    <PropertiesMapErrorBoundary>
                      <PropertiesMap
                        properties={filteredProperties}
                        highlightedId={highlightedPropertyId}
                        onSelect={(property) => {
                          setHighlightedPropertyId(property.id);
                        }}
                        onNavigate={handleNavigate}
                        isClient={isClient}
                        districtPolygon={districtPolygon}
                      />
                    </PropertiesMapErrorBoundary>
                  )}
                </div>
              </div>
            )}
          </motion.section>
        </div>
      </main>

      {/* Favorites Drawer */}
      <div
        onClick={() => setIsFavoritesDrawerOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm transition-opacity duration-300",
          isFavoritesDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-full max-w-sm transform border-r border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out md:rounded-r-3xl",
          isFavoritesDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-label="المفضلات"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white/50 px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-emerald-600">المفضلة</p>
            <p className="text-sm font-bold text-slate-900">{favoriteIds.length} عقار محفوظ</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:bg-slate-100 rounded-full h-8 w-8 p-0"
            onClick={() => setIsFavoritesDrawerOpen(false)}
          >
            ✕
          </Button>
        </div>

        <div className="flex h-[calc(100%-5rem)] flex-col overflow-hidden">
          {favoriteProperties.length ? (
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-200">
              {favoriteProperties.map((property) => (
                <div
                  key={property.id}
                  className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-emerald-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{property.title}</p>
                      <p className="text-xs text-slate-500">
                        {property.city ? `${property.city}${property.region ? `، ${property.region}` : ""}` : property.region}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                      onClick={() => handleFavoritesToggle(property.id)}
                    >
                      <Heart className="h-3.5 w-3.5 fill-current" />
                      <span className="sr-only">إزالة من المفضلة</span>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span className="text-emerald-600 font-bold text-sm">
                      {formatCurrency(property.price)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400">|</span>
                      {property.areaSqm ? `${property.areaSqm} م²` : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                       <span className="text-slate-400">|</span>
                       {property.bedrooms ?? "—"} غرف
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                      onClick={() => {
                        setHighlightedPropertyId(property.id);
                        setIsFavoritesDrawerOpen(false);
                        setViewMode("map");
                      }}
                    >
                      <MapIcon className="w-3 h-3 ml-1.5" />
                      على الخريطة
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-4"
                      onClick={() => {
                        navigate(`/properties/${property.id}`);
                        setIsFavoritesDrawerOpen(false);
                      }}
                    >
                      التفاصيل
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-500">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                <Heart className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-medium text-slate-900">قائمة المفضلة فارغة</p>
              <p className="text-xs max-w-[200px] leading-relaxed">استخدم زر القلب لحفظ العقارات التي تود الرجوع إليها لاحقًا.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md border-l border-white/20 bg-white/95 backdrop-blur-xl">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-xl font-bold text-slate-900">تصفية البحث</SheetTitle>
            <SheetDescription className="text-slate-500">قم بتخصيص النتائج حسب تفضيلاتك في أي وقت.</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 pb-10">
            <FilterContent
              filters={filters}
              regionOptions={regionOptions}
              cityOptions={filteredCityOptions}
              districtOptions={filteredDistrictOptions}
              propertyTypeOptions={propertyTypeOptions}
              transactionTypeOptions={transactionTypeOptions}
              onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              onRegionChange={(value) => {
                setFilters((prev) => ({ ...prev, region: value, city: "all", district: "all", propertyType: "all" }));
              }}
              onCityChange={(value) => setFilters((prev) => ({ ...prev, city: value, district: "all", propertyType: "all" }))}
              onDistrictChange={(value) => setFilters((prev) => ({ ...prev, district: value }))}
              onPropertyTypeChange={(value) => setFilters((prev) => ({ ...prev, propertyType: value }))}
              onTransactionTypeChange={(value) => setFilters((prev) => ({ ...prev, transactionType: value }))}
              onNumericChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
              onFavoritesToggle={(value) => setFilters((prev) => ({ ...prev, favoritesOnly: value }))}
              onReset={() => {
                handleReset();
                setIsFilterOpen(false);
              }}
              disableDistrictSelect={filters.city === "all"}
              isRegionLoading={regionsQuery.isLoading}
              isCityLoading={citiesQuery.isLoading}
              isDistrictLoading={filters.city !== "all" && districtsQuery.isLoading}
            />
            <Button 
              type="button" 
              className="w-full rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 font-bold" 
              onClick={() => setIsFilterOpen(false)}
            >
              عرض النتائج ({filteredProperties.length})
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
