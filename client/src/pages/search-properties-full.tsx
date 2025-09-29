/**
 * client/src/pages/search-properties.tsx - Property Search Experience
 *
 * This page renders the end-user property search flow. It combines:
 * - Search controls with filtering and sorting capabilities
 * - Real-time property listing results backed by TanStack Query
 * - Optional map view powered by Leaflet for spatial exploration
 *
 * Layout goals:
 * - Reuse PlatformShell spacing so the page matches the dashboard chrome
 * - Provide a responsive two-column layout on desktop (results + map)
 * - Keep RTL-friendly ordering (results stay primary on the right)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search,
  Filter,
  Map,
  MapPin,
  LayoutList,
  Heart,
  Bed,
  Bath,
  Square,
  Calendar,
  Building2,
  ArrowRight,
} from "lucide-react";
import PlatformShell from "@/components/layout/PlatformShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoCarousel } from "@/components/ui/photo-carousel";
import { apiRequest } from "@/lib/queryClient";
import type { Property } from "@shared/types";

/**
 * API payload shape differs slightly from the shared `Property` type.
 * Photos/features may come as JSON strings and auxiliary listing fields
 * are optional, so we widen the type a bit for the UI layer.
 */
type ApiProperty = Omit<Property, "photos" | "features"> & {
  photos?: string | string[] | null;
  features?: string | string[] | null;
  propertyType?: string | null;
  propertyCategory?: string | null;
  listingType?: string | null;
  squareFeet?: number | null;
  viewCount?: number | null;
};

interface ListingsQueryResult {
  items: ApiProperty[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

interface MapProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  propertyType?: string | null;
  propertyCategory?: string | null;
  latitude: number;
  longitude: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: number | null;
  status?: string | null;
}

interface SearchFilters {
  query: string;
  propertyType: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  sortBy: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  propertyType: "",
  city: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  bathrooms: "",
  sortBy: "newest",
};

const PROPERTY_TYPES = [
  { value: "", label: "جميع الأنواع" },
  { value: "apartment", label: "شقة" },
  { value: "villa", label: "فيلا" },
  { value: "house", label: "منزل" },
  { value: "office", label: "مكتب" },
  { value: "shop", label: "محل تجاري" },
];

const CITY_OPTIONS = [
  { value: "", label: "جميع المدن" },
  { value: "الرياض", label: "الرياض" },
  { value: "جدة", label: "جدة" },
  { value: "الدمام", label: "الدمام" },
  { value: "مكة المكرمة", label: "مكة المكرمة" },
  { value: "المدينة المنورة", label: "المدينة المنورة" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "price_asc", label: "السعر: من الأقل للأعلى" },
  { value: "price_desc", label: "السعر: من الأعلى للأقل" },
  { value: "area_asc", label: "المساحة: من الأصغر للأكبر" },
  { value: "area_desc", label: "المساحة: من الأكبر للأصغر" },
  { value: "popular", label: "الأكثر مشاهدة" },
];

const LEAFLET_JS_ID = "leaflet-js";
const LEAFLET_CSS_ID = "leaflet-css";
const POPUP_CLASS_NAME = "property-map-popup";

// Lazy-load Leaflet assets only when the map is used.
async function ensureLeaflet(): Promise<any> {
  if ((window as any).L) {
    return (window as any).L;
  }

  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const link = document.createElement("link");
    link.id = LEAFLET_CSS_ID;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  const existingScript = document.getElementById(LEAFLET_JS_ID) as HTMLScriptElement | null;
  if (existingScript && (window as any).L) {
    return (window as any).L;
  }

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve((window as any).L));
      existingScript.addEventListener("error", reject);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = LEAFLET_JS_ID;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function normalizePhotos(value: ApiProperty["photos"]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((url): url is string => typeof url === "string" && url.length > 0);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((url): url is string => typeof url === "string" && url.length > 0);
      }
    } catch {
      // Not JSON - treat as single URL or comma-separated list
      const parts = value.split(",").map((part) => part.trim());
      if (parts.length > 1) {
        return parts.filter(Boolean);
      }
      if (value.startsWith("http")) {
        return [value];
      }
    }
  }
  return [];
}

function formatCurrency(price: number): string {
  if (Number.isNaN(price)) return "—";
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDisplayDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildMapPopup(property: MapProperty): string {
  const price = formatCurrency(Number(property.price || 0));
  const typeLabel = property.propertyType || property.propertyCategory || "";
  const stats: string[] = [];
  if (property.bedrooms) stats.push(`🛏️ ${property.bedrooms}`);
  if (property.bathrooms) stats.push(`🚿 ${property.bathrooms}`);
  if (property.areaSqm) stats.push(`📐 ${property.areaSqm} م²`);

  return `
    <div class="${POPUP_CLASS_NAME}__content">
      <h3 class="${POPUP_CLASS_NAME}__title">${property.title}</h3>
      <p class="${POPUP_CLASS_NAME}__address">${property.address ?? ""}</p>
      <div class="${POPUP_CLASS_NAME}__meta">
        <span class="${POPUP_CLASS_NAME}__price">${price}</span>
        ${typeLabel ? `<span class="${POPUP_CLASS_NAME}__badge">${typeLabel}</span>` : ""}
      </div>
      ${stats.length > 0 ? `<div class="${POPUP_CLASS_NAME}__stats">${stats
        .map((stat) => `<span>${stat}</span>`)
        .join("" )}</div>` : ""}
    </div>
  `;
}

export default function SearchProperties() {
  const [, setLocation] = useLocation();

  const isDashboardPort = typeof window !== "undefined"
    ? (window as any).SERVER_PORT === "3000" || window.location.port === "3000"
    : false;

  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
   const markersRef = useRef<Map<string, any>>(new (Map as any)());

  const listingsQuery = useQuery<ListingsQueryResult>({
    queryKey: ["properties", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.query) params.set("q", filters.query);
      if (filters.propertyType) params.set("propertyType", filters.propertyType);
      if (filters.city) params.set("city", filters.city);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.bedrooms) params.set("minBedrooms", filters.bedrooms);
      if (filters.bathrooms) params.set("minBathrooms", filters.bathrooms);
      if (filters.sortBy) params.set("sort", filters.sortBy);
      params.set("pageSize", "30");

      const response = await apiRequest("GET", `/api/listings?${params.toString()}`);
      const json = (await response.json()) as ListingsQueryResult;
      return json;
    },
     placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });

  const mapQuery = useQuery<MapProperty[]>({
    queryKey: ["map-properties", filters.city, filters.propertyType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.city) params.set("city", filters.city);
      if (filters.propertyType) params.set("propertyType", filters.propertyType);

      const response = await apiRequest("GET", `/api/listings/map?${params.toString()}`);
      return (await response.json()) as MapProperty[];
    },
    staleTime: 30000,
    enabled: showMap,
  });

  const properties = (listingsQuery.data as ListingsQueryResult)?.items ?? [];

  const visibleProperties = useMemo(() => {
    if (!showFavoritesOnly) {
      return properties;
    }
    return properties.filter((item: ApiProperty) => favoriteIds.includes(item.id));
  }, [properties, showFavoritesOnly, favoriteIds]);

  const focusedProperty = useMemo(() => {
    if (!visibleProperties.length) return undefined;
    return visibleProperties.find((item: ApiProperty) => item.id === focusedPropertyId) ?? visibleProperties[0];
  }, [visibleProperties, focusedPropertyId]);

  // Adjust focused card whenever the data set changes.
  useEffect(() => {
    if (!visibleProperties.length) {
      setFocusedPropertyId(null);
      return;
    }
    if (!focusedPropertyId || !visibleProperties.some((item: ApiProperty) => item.id === focusedPropertyId)) {
      setFocusedPropertyId(visibleProperties[0].id);
    }
  }, [visibleProperties, focusedPropertyId]);

  // Load Leaflet only when the map is toggled on.
  useEffect(() => {
    if (!showMap) return;

    let cancelled = false;

    const initLeaflet = async () => {
      try {
        const L = await ensureLeaflet();
        if (cancelled || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const container = mapContainerRef.current;
          if (container) {
            container.tabIndex = 0;
            container.setAttribute("aria-label", "خريطة العقارات");
            container.style.outline = "none";
          }

          const map = L.map(container, {
            zoomControl: false,
            scrollWheelZoom: true,
            closePopupOnClick: true,
            attributionControl: false,
            keyboard: true,
            keyboardPanDelta: 80,
          }).setView([24.7136, 46.6753], 6);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);

          L.control.zoom({ position: "topright" }).addTo(map);
          map.keyboard.enable();
          map.dragging.enable();
          mapInstanceRef.current = map;
        }
      } catch (error) {
        console.error("Error loading Leaflet:", error);
      }
    };

    void initLeaflet();

    return () => {
      cancelled = true;
    };
  }, [showMap]);

  // Sync markers whenever map data changes.
  useEffect(() => {
    if (!showMap) return;
    const map = mapInstanceRef.current;
    const markerData = mapQuery.data;
    const L = (window as any).L;

    if (!map || !markerData || !L) return;

     markersRef.current.forEach((marker: any) => {
       map.removeLayer(marker);
     });
     markersRef.current.clear();

    const latLngs: [number, number][] = [];

     markerData.forEach((property: MapProperty) => {
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }
      latLngs.push([lat, lng]);

      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(buildMapPopup(property), { className: POPUP_CLASS_NAME, direction: "top" });
      marker.on("click", () => {
        setFocusedPropertyId(property.id);
        setHoveredPropertyId(property.id);
      });
      markersRef.current.set(property.id, marker);
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [32, 32], animate: true });
    }
  }, [mapQuery.data, showMap]);

  // Keep map marker in sync with the currently focused property.
  useEffect(() => {
    if (!showMap) return;
    if (!focusedPropertyId || hoveredPropertyId === focusedPropertyId) return;
    setHoveredPropertyId(focusedPropertyId);
  }, [focusedPropertyId, hoveredPropertyId, showMap]);

  // Highlight marker when a card is hovered/focused.
  useEffect(() => {
    if (!showMap) return;
    const map = mapInstanceRef.current;
    const marker = hoveredPropertyId ? markersRef.current.get(hoveredPropertyId) : null;
    if (marker && map) {
      marker.openPopup();
      map.panTo(marker.getLatLng(), { animate: true, duration: 0.4 });
    }
  }, [hoveredPropertyId, showMap]);

  // Ensure Leaflet map resizes correctly when layout changes.
  useEffect(() => {
    if (!showMap || typeof window === "undefined") return;
    const map = mapInstanceRef.current;
    if (!map) return;

    const resizeMap = () => {
      map.invalidateSize();
    };

    const timeoutId = window.setTimeout(resizeMap, 120);
    window.addEventListener("resize", resizeMap);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", resizeMap);
    };
  }, [showMap, showFilters, visibleProperties.length]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const toggleFavorite = (propertyId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleViewDetails = (propertyId: string) => {
    setLocation(`/properties/${propertyId}`);
  };

  const filtersActive = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => key !== "sortBy" && value !== "");
  }, [filters]);

  const filterControls = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="relative">
        <Button
          variant={showFilters ? "default" : "outline"}
          size="icon"
          onClick={() => setShowFilters((prev) => !prev)}
          aria-pressed={showFilters}
          aria-label="عرض الفلاتر"
        >
          <Filter className="h-4 w-4" />
        </Button>
        {filtersActive && (
          <span className="absolute -top-1 -left-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        )}
      </div>
      <Button
        variant={showMap ? "default" : "outline"}
        size="icon"
        onClick={() => setShowMap((prev) => !prev)}
        aria-pressed={showMap}
        aria-label={showMap ? "إخفاء الخريطة" : "عرض الخريطة"}
      >
        <Map className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "outline"}
        size="icon"
        onClick={() => setViewMode((mode) => (mode === "table" ? "cards" : "table"))}
        aria-pressed={viewMode === "table"}
        aria-label="التبديل بين عرض الجدول والبطاقات"
      >
        <LayoutList className="h-4 w-4" />
      </Button>
      <Button
        variant={showFavoritesOnly ? "default" : "outline"}
        size="icon"
        onClick={() => setShowFavoritesOnly((prev) => !prev)}
        aria-pressed={showFavoritesOnly}
        aria-label={showFavoritesOnly ? "عرض كل العقارات" : "المفضلة فقط"}
      >
        <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
      </Button>
    </div>
  );

  const filtersSidebar = (
    <aside className="w-full xl:w-80 shrink-0">
      <Card className="xl:sticky xl:top-24 shadow-sm">
        <CardHeader className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">تخصيص البحث</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={!filtersActive}>
            مسح الفلاتر
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع العقار</label>
            <Select value={filters.propertyType} onValueChange={(value) => handleFilterChange("propertyType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الأنواع" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">المدينة</label>
            <Select value={filters.city} onValueChange={(value) => handleFilterChange("city", value)}>
              <SelectTrigger>
                <SelectValue placeholder="جميع المدن" />
              </SelectTrigger>
              <SelectContent>
                {CITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">السعر الأدنى</label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={filters.minPrice}
              onChange={(event) => handleFilterChange("minPrice", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">السعر الأعلى</label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="1000000"
              value={filters.maxPrice}
              onChange={(event) => handleFilterChange("maxPrice", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">عدد الغرف</label>
            <Select
              value={filters.bedrooms || "any"}
              onValueChange={(value) => handleFilterChange("bedrooms", value === "any" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="أي عدد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">أي عدد</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">عدد الحمامات</label>
            <Select
              value={filters.bathrooms || "any"}
              onValueChange={(value) => handleFilterChange("bathrooms", value === "any" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="أي عدد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">أي عدد</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ترتيب النتائج</label>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </aside>
  );

  if (listingsQuery.error) {
    const errorContent = (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-xl font-semibold text-destructive">حدث خطأ أثناء تحميل العقارات</p>
          <p className="text-muted-foreground">يرجى تحديث الصفحة أو المحاولة لاحقًا.</p>
          <Button variant="outline" onClick={() => listingsQuery.refetch()}>
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );

    if (isDashboardPort) {
      return (
        <PlatformShell
          title="البحث في العقارات"
          searchPlaceholder="ابحث عن العقارات أو العملاء"
          headerExtraContent={filterControls}
        >
          {errorContent}
        </PlatformShell>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl space-y-6">
            {errorContent}
          </div>
        </div>
      </div>
    );
  }

  const body = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 text-right">
        <div
          className={`flex flex-wrap items-center gap-3 ${isDashboardPort ? "justify-end" : "justify-between"}`}
        >
          <div className="space-y-1">
            <p className="text-muted-foreground">
              استخدم الفلاتر المتقدمة للعثور على العقار المناسب لك واستعرض النتائج بالطريقة التي تفضلها.
            </p>
          </div>
          {!isDashboardPort && filterControls}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مدينة، حي، أو كلمة مفتاحية..."
                value={filters.query}
                onChange={(event) => handleFilterChange("query", event.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={`flex flex-col gap-6 ${showFilters ? "xl:flex-row" : ""}`}>
        {showFilters && filtersSidebar}

        <div className="flex-1">
          <div className={`grid gap-6 ${showMap ? "xl:grid-cols-[1.6fr_1fr]" : ""}`}>
            <div className="space-y-4 xl:order-2">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center justify-between gap-2 text-lg">
                    <span>النتائج</span>
                    <Badge variant="secondary">
                      {visibleProperties.length ? `${visibleProperties.length} عقار` : "لا توجد عقارات"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listingsQuery.isLoading ? (
                    <PropertyListSkeleton />
                  ) : visibleProperties.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
                      {showFavoritesOnly && (
                        <p className="text-sm text-muted-foreground">
                          أضف عقارات إلى المفضلة أو عطّل الفلتر لعرض جميع النتائج.
                        </p>
                      )}
                    </div>
                  ) : viewMode === "table" ? (
                    <PropertyTable
                      properties={visibleProperties}
                      favoriteIds={favoriteIds}
                      focusedPropertyId={focusedProperty?.id ?? null}
                      onToggleFavorite={toggleFavorite}
                      onHover={(propertyId, state) => {
                        setHoveredPropertyId(state ? propertyId : null);
                      }}
                      onFocus={(propertyId) => setFocusedPropertyId(propertyId)}
                      onViewDetails={handleViewDetails}
                    />
                  ) : (
                    <div className="space-y-4">
                      {visibleProperties.map((property: ApiProperty) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          isFocused={property.id === focusedProperty?.id}
                          isFavorite={favoriteIds.includes(property.id)}
                          onToggleFavorite={() => toggleFavorite(property.id)}
                          onHover={(state) => {
                            setHoveredPropertyId(state ? property.id : null);
                          }}
                          onFocus={() => setFocusedPropertyId(property.id)}
                          onViewDetails={() => handleViewDetails(property.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {showMap && (
              <Card className="xl:order-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <MapPin className="h-5 w-5 text-primary" />
                    خريطة العقارات
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {mapQuery.isLoading
                      ? "جاري تحميل العقارات على الخريطة..."
                      : mapQuery.data && mapQuery.data.length > 0
                      ? `${mapQuery.data.length} عقار متاح على الخريطة`
                      : "لا توجد عقارات متاحة على الخريطة"}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {mapQuery.isLoading ? (
                      <div className="flex h-96 items-center justify-center rounded-lg border bg-muted">
                        <div className="space-y-2 text-center">
                          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                          <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
                        </div>
                      </div>
                    ) : mapQuery.data && mapQuery.data.length > 0 ? (
                      <div className="h-96 w-full overflow-hidden rounded-lg border">
                        <div ref={mapContainerRef} className="h-full w-full" />
                      </div>
                    ) : (
                      <div className="flex h-96 items-center justify-center rounded-lg border bg-muted">
                        <div className="space-y-2 text-center">
                          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">لا توجد عقارات متاحة على الخريطة</p>
                          <p className="text-sm text-muted-foreground">قم بتغيير إعدادات الفلتر للحصول على نتائج أخرى.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isDashboardPort) {
    return (
      <PlatformShell
        title="البحث في العقارات"
        searchPlaceholder="ابحث عن العقارات أو العملاء"
        headerExtraContent={filterControls}
      >
        {body}
      </PlatformShell>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {body}
      </div>
    </div>
  );
}

interface PropertyCardProps {
  property: ApiProperty;
  isFocused: boolean;
  isFavorite: boolean;
  onHover: (state: boolean) => void;
  onFocus: () => void;
  onViewDetails: () => void;
  onToggleFavorite: () => void;
}

function PropertyCard({ property, isFocused, isFavorite, onHover, onFocus, onViewDetails, onToggleFavorite }: PropertyCardProps) {
  const photos = normalizePhotos(property.photos);
  const price = formatCurrency(Number(property.price || 0));
  const createdAtLabel = property.createdAt ? formatDisplayDate(property.createdAt) : "";
  const listingType = typeof property.listingType === "string" ? property.listingType.toLowerCase() : null;
  const listingLabel = listingType
    ? ["rent", "rental", "lease"].includes(listingType)
      ? "للإيجار"
      : "للبيع"
    : null;

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-lg ${isFocused ? "ring-2 ring-primary/60" : "ring-1 ring-transparent"}`}
      tabIndex={0}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocusCapture={onFocus}
      onClick={onFocus}
    >
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-[220px_auto]">
          <div className="overflow-hidden rounded-lg border bg-muted">
            <PhotoCarousel
              photos={photos}
              alt={property.title}
              className="h-full w-full"
              showIndicators={false}
              autoHeight
            />
          </div>

          <div className="flex flex-col justify-between gap-4 text-right">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-gray-900">{property.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{property.city}</span>
                    {property.address && <span className="text-slate-400">•</span>}
                    {property.address && <span>{property.address}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={isFavorite ? "text-rose-500" : "text-muted-foreground"}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleFavorite();
                    }}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                  >
                    <Heart className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                  </Button>
                  {property.propertyType && (
                    <Badge variant="outline">{property.propertyType}</Badge>
                  )}
                  {listingLabel && <Badge variant="secondary">{listingLabel}</Badge>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-2xl font-bold text-emerald-600">{price}</div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {property.description || "لا توجد تفاصيل إضافية"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {typeof property.bedrooms === "number" && (
                  <span className="flex items-center gap-2"><Bed className="h-4 w-4" /> {property.bedrooms} غرف</span>
                )}
                {typeof property.bathrooms === "number" && (
                  <span className="flex items-center gap-2"><Bath className="h-4 w-4" /> {property.bathrooms} حمامات</span>
                )}
                {property.areaSqm && (
                  <span className="flex items-center gap-2"><Square className="h-4 w-4" /> {property.areaSqm} م²</span>
                )}
                {property.squareFeet && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground/80">
                    ≈ {(property.squareFeet / 10.7639).toFixed(0)} م²
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {createdAtLabel && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    تم التحديث {createdAtLabel}
                  </span>
                )}
                {typeof property.viewCount === "number" && (
                  <span className="text-muted-foreground/80">{property.viewCount} مشاهدة</span>
                )}
              </div>
              <Button size="sm" className="gap-2" onMouseEnter={() => onHover(true)} onFocus={onFocus} onClick={onViewDetails}>
                عرض التفاصيل
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PropertyTableProps {
  properties: ApiProperty[];
  favoriteIds: string[];
  focusedPropertyId: string | null;
  onToggleFavorite: (propertyId: string) => void;
  onHover: (propertyId: string, state: boolean) => void;
  onFocus: (propertyId: string) => void;
  onViewDetails: (propertyId: string) => void;
}

function PropertyTable({ properties, favoriteIds, focusedPropertyId, onToggleFavorite, onHover, onFocus, onViewDetails }: PropertyTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border text-right">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-sm font-medium text-muted-foreground">العقار</th>
            <th className="px-4 py-3 text-sm font-medium text-muted-foreground">السعر</th>
            <th className="px-4 py-3 text-sm font-medium text-muted-foreground">الغرف</th>
            <th className="px-4 py-3 text-sm font-medium text-muted-foreground">الحمامات</th>
            <th className="px-4 py-3 text-sm font-medium text-muted-foreground">المساحة (م²)</th>
            <th className="px-4 py-3 text-sm font-medium text-muted-foreground">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/80 bg-white/40">
          {properties.map((property) => {
            const isFavorite = favoriteIds.includes(property.id);
            const price = formatCurrency(Number(property.price || 0));
            const area = property.areaSqm ?? (property.squareFeet ? Math.round(property.squareFeet / 10.7639) : null);
            const isFocused = property.id === focusedPropertyId;

            return (
              <tr
                key={property.id}
                className={`cursor-pointer transition-colors hover:bg-muted/40 focus-within:bg-muted/40 ${isFocused ? "bg-primary/5" : ""}`}
                onMouseEnter={() => onHover(property.id, true)}
                onMouseLeave={() => onHover(property.id, false)}
                onFocus={() => {
                  onFocus(property.id);
                  onHover(property.id, true);
                }}
                onBlur={() => onHover(property.id, false)}
                onClick={() => onFocus(property.id)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onFocus(property.id);
                  }
                }}
              >
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{property.title}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={isFavorite ? "text-rose-500" : "text-muted-foreground"}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleFavorite(property.id);
                        }}
                        aria-pressed={isFavorite}
                        aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                      >
                        <Heart className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {property.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {property.city}
                        </span>
                      )}
                      {property.address && <span className="text-muted-foreground/60">•</span>}
                      {property.address && <span>{property.address}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-sm text-foreground">{price}</td>
                <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                  {typeof property.bedrooms === "number" ? property.bedrooms : "—"}
                </td>
                <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                  {typeof property.bathrooms === "number" ? property.bathrooms : "—"}
                </td>
                <td className="px-4 py-3 align-top text-sm text-muted-foreground">{area ?? "—"}</td>
                <td className="px-4 py-3 align-top text-sm text-foreground">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewDetails(property.id);
                      }}
                    >
                      عرض التفاصيل
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PropertyListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-[220px_auto]">
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-4 w-72" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
