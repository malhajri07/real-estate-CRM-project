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
 * 
 * Related Files:
 * - apps/web/src/pages/map/components/ - Map page components
 * - apps/web/src/pages/map/hooks/ - Map page hooks
 * - apps/web/src/pages/map/utils/ - Map page utilities
 */

/**
 * MapPage Component
 * 
 * Main page component for property map exploration.
 * Orchestrates hooks and components to provide a unified map/table view.
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Heart,
  SlidersHorizontal,
  RefreshCcw,
  Map as MapIcon,
  LayoutGrid,
} from "lucide-react";

import Header from "@/components/layout/header";
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
      <div className="flex flex-wrap gap-1.5 pt-1">
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
                "h-6 rounded-full border px-2 text-[11px] transition-colors",
                isActive
                  ? "bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700"
                  : "border-border/60 bg-white/90 text-foreground hover:bg-gray-50"
              )}
              onClick={() => handleQuickCityFilter(city)}
            >
              <span className={cn("font-bold", isActive ? "text-white" : "text-foreground")}>{city.label}</span>
              <span className={cn("text-[10px]", isActive ? "text-white/90" : "text-muted-foreground")}>({city.count})</span>
            </Button>
          );
        })}
      </div>
    );
  };

  const renderQuickPropertyTypeFilters = () => {
    if (listingsQuery.isLoading || !propertyTypeOptions.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5 pt-2">
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
                "h-6 rounded-full border px-2 text-[11px] transition-colors",
                isActive
                  ? "bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700"
                  : "border-border/60 bg-white/90 text-foreground hover:bg-gray-50"
              )}
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  propertyType: isActive ? "all" : type,
                }));
                setCurrentPageState(1);
              }}
            >
              <span className={cn("font-normal", isActive ? "text-white" : "text-foreground")}>{type}</span>
              <span className={cn("text-[10px]", isActive ? "text-white/90" : "text-muted-foreground")}>({count})</span>
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/60">
      <Header title="استكشف العقارات" showSearch={false} />
      <main className="mx-auto flex w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full border-border/70 bg-white/90 px-3 text-xs font-medium"
                onClick={handleFilterToggle}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                الفلتر
              </Button>

              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-white/90 p-0.5 shadow-sm">
                <Button
                  type="button"
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => setViewMode("map")}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  خريطة العقارات
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  عرض العقارت
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant={filters.favoritesOnly ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5 rounded-full border-border/70 bg-white/90 px-3 text-xs font-medium"
                onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
              >
                <Heart className="h-3.5 w-3.5" />
                العقارات المفضلة
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium"
                onClick={handleReset}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                إعادة تعيين الكل
              </Button>
            </div>
          </div>

          <section className="space-y-6">
            {viewMode === "table" ? (
              <Card className="rounded-3xl border border-border/60 bg-white shadow-xl">
                <CardHeader className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
                  <div className="w-full space-y-2">
                    <div>
                      <CardTitle className="text-xl">قائمة العقارات</CardTitle>
                    </div>
                    {renderQuickCityFilters()}
                    {renderQuickPropertyTypeFilters()}
                  </div>
                  {!listingsQuery.isLoading && (
                    <div className="text-sm text-muted-foreground">
                      إجمالي النتائج المتاحة: {filteredProperties.length}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  {listingsQuery.isLoading ? (
                    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                      جار تحميل بيانات العقارات...
                    </div>
                  ) : listingsQuery.isError ? (
                    <div className="rounded-3xl border border-destructive/40 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
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
                        <div className="flex items-center justify-between border-t border-border/60 pt-4">
                          <div className="text-sm text-muted-foreground">
                            عرض {((currentPageState - 1) * 25) + 1} إلى {Math.min(currentPageState * 25, totalItemsState)} من {totalItemsState} نتيجة
                          </div>

                          {totalPagesState > 1 && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPageState(prev => Math.max(1, prev - 1))}
                                disabled={currentPageState === 1}
                                className="h-8 px-3 text-xs"
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
                                      className={`h-8 w-8 p-0 text-xs ${isActive ? 'bg-brand-600 text-white' : ''}`}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}

                                {totalPagesState > 5 && (
                                  <>
                                    <span className="text-xs text-muted-foreground">...</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCurrentPageState(totalPagesState)}
                                      className="h-8 w-8 p-0 text-xs"
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
                                className="h-8 px-3 text-xs"
                              >
                                التالي
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-3xl border border-border/60 bg-white/95 shadow-2xl w-full">
                <CardHeader className="flex flex-col gap-2 pb-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">خريطة العقارات</CardTitle>
                    <CardDescription>استكشف العقارات على خريطة تفاعلية بتجربة مماثلة لخريطة عقار.</CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {listingsQuery.isLoading
                      ? "جار تحميل العقارات..."
                      : `${filteredProperties.filter((property) => property.latitude && property.longitude).length} عقار على الخريطة`
                    }
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-0">
                  {listingsQuery.isLoading ? (
                    <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
                      جار تحميل بيانات العقارات...
                    </div>
                  ) : listingsQuery.isError ? (
                    <div className="flex h-96 items-center justify-center text-sm text-red-600">
                      حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى لاحقًا.
                    </div>
                  ) : (
                    <div className="w-full">
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
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
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
          "fixed inset-y-0 left-0 z-50 w-full max-w-sm transform border-r border-border/60 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:rounded-r-3xl",
          isFavoritesDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-label="المفضلات"
      >
        <div className="flex items-center justify-between border-b border-border/60 bg-background px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-foreground">المفضلة</p>
            <p className="text-sm font-semibold text-foreground">{favoriteIds.length} عقار محفوظ</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted"
            onClick={() => setIsFavoritesDrawerOpen(false)}
          >
            إغلاق
          </Button>
        </div>

        <div className="flex h-[calc(100%-5rem)] flex-col overflow-hidden">
          {favoriteProperties.length ? (
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {favoriteProperties.map((property) => (
                <div
                  key={property.id}
                  className="space-y-3 rounded-2xl border border-border/60 bg-background p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{property.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {property.city ? `${property.city}${property.region ? `، ${property.region}` : ""}` : property.region}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full border border-border/60 text-foreground hover:bg-muted"
                      onClick={() => handleFavoritesToggle(property.id)}
                    >
                      <Heart className="h-3.5 w-3.5 fill-current text-current" />
                      <span className="sr-only">إزالة من المفضلة</span>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-foreground">
                    <span className="font-semibold">
                      {formatCurrency(property.price)}
                    </span>
                    <span className="text-muted-foreground">{property.areaSqm ? `${property.areaSqm} م²` : "—"}</span>
                    <span className="text-muted-foreground">{property.bedrooms ?? "—"} غرف</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 rounded-full border-border/60 text-foreground hover:bg-muted"
                      onClick={() => {
                        setHighlightedPropertyId(property.id);
                        setIsFavoritesDrawerOpen(false);
                        setViewMode("map");
                      }}
                    >
                      عرض على الخريطة
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
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
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-emerald-700">
              <Heart className="h-10 w-10 text-emerald-400" />
              <p>لم تقم بإضافة أي عقار إلى المفضلة بعد.</p>
              <p className="text-xs text-emerald-500">استخدم زر القلب لحفظ العقارات التي تود الرجوع إليها لاحقًا.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="pb-6">
            <SheetTitle>تصفية البحث</SheetTitle>
            <SheetDescription>قم بتخصيص النتائج حسب تفضيلاتك في أي وقت.</SheetDescription>
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
            <Button type="button" className="w-full rounded-2xl" onClick={() => setIsFilterOpen(false)}>
              تم
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

