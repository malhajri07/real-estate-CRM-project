/**
 * Search Properties Page - Map & Table Experience
 *
 * Provides a lightweight property discovery flow for end users with:
 * - Shared header search that filters map markers and tabular results
 * - Simple favourites toggling using in-memory state
 * - Map and table view toggles for spatial or tabular exploration
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  LayoutList,
  Map as MapIcon,
  Building2,
  Bed,
  Bath,
  Eye,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Leaflet constants
const LEAFLET_JS_ID = "leaflet-js";
const LEAFLET_CSS_ID = "leaflet-css";
const DEFAULT_MAP_CENTER: [number, number] = [24.7136, 46.6753];
const DEFAULT_MAP_ZOOM = 6;
const USER_LOCATION_ZOOM = 12;

interface ApiListing {
  id: string;
  title?: string | null;
  address?: string | null;
  city?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: number | null;
  squareFeet?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  listings?: Array<{ id: string; price: number | null | undefined }>;
}

interface ListingsResponse {
  items: ApiListing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface PropertySummary {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  latitude: number | null;
  longitude: number | null;
}

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(/[^\d.,-]/g, "").replace(/,/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const sqmFromSquareFeet = (squareFeet: number | null) =>
  squareFeet && squareFeet > 0 ? Math.round(squareFeet * 0.092903) : null;

const formatCurrency = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(value);
};

const parseFilterNumber = (value: string) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const asText = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]|'/g, (match) => {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return match;
    }
  });

// Utility function to load Leaflet dynamically
const ensureLeaflet = async () => {
  if (typeof window === "undefined") return null;

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
};

export default function SearchProperties() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userLocationMarkerRef = useRef<any>(null);
  const [, setLocation] = useLocation();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleChange = (event: MediaQueryListEvent) => {
      setIsFilterSidebarOpen(event.matches);
    };

    setIsFilterSidebarOpen(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const listingsQuery = useQuery<ListingsResponse>({
    queryKey: ["public-property-search", debouncedQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      params.set("pageSize", "100");
      const url = `/api/listings?${params.toString()}`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return data as ListingsResponse;
    },
    placeholderData: (previousData) => previousData,
  });

  const properties = useMemo<PropertySummary[]>(() => {
    if (!listingsQuery.data?.items) return [];

    return listingsQuery.data.items.map((item: ApiListing) => {
      const fallbackListing = item.listings?.find((listing: any) =>
        typeof listing?.price === "number" && !Number.isNaN(listing.price)
      );

      const price = asNumber(item.price) ?? asNumber(fallbackListing?.price);
      const area = asNumber(item.areaSqm) ?? sqmFromSquareFeet(asNumber(item.squareFeet));
      const titleText = asText(item.title).trim();
      const addressText = asText(item.address).trim();
      const cityText = asText(item.city).trim();

      return {
        id: item.id,
        title: titleText.length ? titleText : "عقار بدون عنوان",
        address: addressText,
        city: cityText,
        price,
        bedrooms: asNumber(item.bedrooms),
        bathrooms: asNumber(item.bathrooms),
        areaSqm: area,
        latitude: asNumber(item.latitude),
        longitude: asNumber(item.longitude),
      };
    });
  }, [listingsQuery.data]);

  const cityOptions = useMemo(() => {
    const normalized = new Set<string>();
    const result: string[] = [];

    properties.forEach((property) => {
      const city = property.city.trim();
      if (!city) return;
      const key = city.toLowerCase();
      if (normalized.has(key)) return;
      normalized.add(key);
      result.push(property.city.trim());
    });

    return result.sort((a, b) => a.localeCompare(b, "ar"));
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const cityFilterValue = selectedCity !== "all" ? selectedCity.trim().toLowerCase() : null;
    const minPriceValue = parseFilterNumber(minPrice);
    const maxPriceValue = parseFilterNumber(maxPrice);
    const minBedroomsValue = parseFilterNumber(minBedrooms);
    const minBathroomsValue = parseFilterNumber(minBathrooms);
    const minAreaValue = parseFilterNumber(minArea);
    const maxAreaValue = parseFilterNumber(maxArea);

    return properties.filter((property) => {
      const searchHaystack = [property.title, property.city, property.address]
        .filter((value) => value)
        .map((value) => value.toLowerCase());

      const matchesQuery =
        normalizedQuery.length === 0 ||
        searchHaystack.some((text) => text.includes(normalizedQuery));

      if (!matchesQuery) return false;

      const isFavourite = favoriteIds.includes(property.id);
      if (showFavoritesOnly && !isFavourite) return false;

      if (cityFilterValue) {
        const propertyCity = property.city.trim().toLowerCase();
        if (!propertyCity || propertyCity !== cityFilterValue) {
          return false;
        }
      }

      const priceValue = property.price;
      if (minPriceValue !== null && (priceValue === null || priceValue < minPriceValue)) {
        return false;
      }
      if (maxPriceValue !== null && (priceValue === null || priceValue > maxPriceValue)) {
        return false;
      }

      const bedroomsValue = property.bedrooms;
      if (minBedroomsValue !== null && (bedroomsValue === null || bedroomsValue < minBedroomsValue)) {
        return false;
      }

      const bathroomsValue = property.bathrooms;
      if (minBathroomsValue !== null && (bathroomsValue === null || bathroomsValue < minBathroomsValue)) {
        return false;
      }

      const areaValue = property.areaSqm;
      if (minAreaValue !== null && (areaValue === null || areaValue < minAreaValue)) {
        return false;
      }
      if (maxAreaValue !== null && (areaValue === null || areaValue > maxAreaValue)) {
        return false;
      }

      return true;
    });
  }, [
    properties,
    query,
    favoriteIds,
    showFavoritesOnly,
    selectedCity,
    minPrice,
    maxPrice,
    minBedrooms,
    minBathrooms,
    minArea,
    maxArea,
  ]);

  const toggleFavorite = (propertyId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const navigateToProperty = (propertyId: string) => {
    if (!propertyId) return;
    setLocation(`/properties/${propertyId}`);
  };

  const getPlaceholderLabel = (title: string, city: string) => {
    const source = title?.trim() || city?.trim() || "عقار";
    return source.slice(0, 2);
  };

  const resetFilters = () => {
    setSelectedCity("all");
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("");
    setMinBathrooms("");
    setMinArea("");
    setMaxArea("");
  };

  // Attempt to detect user location once when the component mounts.
  useEffect(() => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          setUserLocation([latitude, longitude]);
        }
      },
      () => {
        // Silently ignore errors; we keep the default center.
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60_000,
      },
    );
  }, []);

  // Initialize Leaflet map lazily when map view is active
  useEffect(() => {
    if (viewMode !== "map" || mapLoadFailed) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const L = await ensureLeaflet();
        if (cancelled || !mapContainerRef.current || !L) return;

        const center = userLocation ?? DEFAULT_MAP_CENTER;
        const zoom = userLocation ? USER_LOCATION_ZOOM : DEFAULT_MAP_ZOOM;

        if (!mapInstanceRef.current) {
          const container = mapContainerRef.current;
          if (container) {
            container.tabIndex = 0;
            container.setAttribute("aria-label", "خريطة العقارات العامة");
            container.style.outline = "none";
          }

          const map = L.map(container, {
            zoomControl: true,
            scrollWheelZoom: true,
            closePopupOnClick: true,
            attributionControl: true,
            keyboard: true,
            keyboardPanDelta: 80,
          }).setView(center, zoom);

          const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            className: "grayscale-map-tiles",
          }).addTo(map);

          const tileElement = tileLayer.getContainer();
          if (tileElement) {
            tileElement.style.filter = "grayscale(100%)";
          }

          map.keyboard.enable();
          map.dragging.enable();
          mapInstanceRef.current = map;
        } else {
          mapInstanceRef.current.invalidateSize();
        }
      } catch (error) {
        console.error("Error loading Leaflet:", error);
        setMapLoadFailed(true);
        setViewMode("table");
      }
    };

    void initMap();

    return () => {
      cancelled = true;
    };
  }, [viewMode, mapLoadFailed, userLocation]);

  // Tear down Leaflet instance when leaving the map view so it can be
  // recreated cleanly on the next toggle. This avoids the map
  // disappearing after switching to the table view and back because the
  // underlying DOM node gets unmounted.
  useEffect(() => {
    if (viewMode === "map") return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markersRef.current = [];
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }
  }, [viewMode]);

  // Sync map markers whenever the filtered dataset changes
  useEffect(() => {
    if (viewMode !== "map") return;

    const map = mapInstanceRef.current;
    const L = (window as any)?.L;

    if (!map || !L) return;

    markersRef.current.forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    const points: [number, number][] = [];

    const closeAllTooltips = () => {
      markersRef.current.forEach((marker) => marker.closeTooltip());
    };

    map.on("click", closeAllTooltips);

    filteredProperties.forEach((property) => {
      if (property.latitude === null || property.longitude === null) return;

      const priceLabel = formatCurrency(property.price);
      const iconHtml = `
        <div class="flex -translate-x-1/2 -translate-y-full transform">
          <div class="relative inline-flex items-center rounded-full border border-white/60 bg-emerald-600/95 px-3 py-1 text-[11px] font-semibold text-white shadow-lg shadow-emerald-500/30 backdrop-blur">
            <span>${escapeHtml(priceLabel)}</span>
            <span class="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-[1px] rounded-full border border-white/70 bg-emerald-600/90"></span>
          </div>
        </div>
      `.trim();

      const marker = L.marker([property.latitude, property.longitude], {
        icon: L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      }).addTo(map);

      const title = escapeHtml(property.title);
      const city = escapeHtml(property.city.trim().length > 0 ? property.city : "غير محدد");
      const address = escapeHtml(
        property.address.trim().length > 0 ? property.address : "العنوان غير متوفر"
      );
      const areaText =
        property.areaSqm !== null
          ? `${property.areaSqm.toLocaleString("ar-SA")} م²`
          : "المساحة غير محددة";

      const tooltipHtml = `
        <div class="w-56 rounded-2xl border border-border/50 bg-white/95 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur">
          <p class="text-sm font-semibold text-foreground">${title}</p>
          <p class="mt-1 text-xs text-muted-foreground">${city} • ${address}</p>
          <div class="mt-3 flex items-center justify-between text-xs">
            <span class="font-semibold text-emerald-600">${escapeHtml(priceLabel)}</span>
            <span class="text-muted-foreground">${escapeHtml(areaText)}</span>
          </div>
        </div>
      `.trim();

      marker.bindTooltip(tooltipHtml, {
        direction: "top",
        offset: [0, -18],
        className: "map-price-tooltip bg-transparent border-none shadow-none",
        opacity: 1,
        sticky: true,
      });

      marker.on("mouseover", () => marker.openTooltip());
      marker.on("mouseout", () => marker.closeTooltip());
      marker.on("focus", () => marker.openTooltip());
      marker.on("blur", () => marker.closeTooltip());
      marker.on("click", () => marker.openTooltip());

      markersRef.current.push(marker);
      points.push([property.latitude, property.longitude]);
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([24.7136, 46.6753], 6);
    }

    return () => {
      map.off("click", closeAllTooltips);
    };
  }, [filteredProperties, viewMode]);

  // Center on the detected user location and render a marker when available.
  useEffect(() => {
    if (viewMode !== "map") return;

    const map = mapInstanceRef.current;
    const L = (window as any)?.L;

    if (!map || !L) return;

    if (!userLocation) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      return;
    }

    const [lat, lng] = userLocation;
    map.flyTo([lat, lng], USER_LOCATION_ZOOM, { animate: true, duration: 0.8 });

    if (!userLocationMarkerRef.current) {
      userLocationMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 8,
        color: "#2563EB",
        weight: 2,
        fillColor: "#3B82F6",
        fillOpacity: 0.7,
      }).addTo(map);
    } else {
      userLocationMarkerRef.current.setLatLng([lat, lng]);
    }
  }, [userLocation, viewMode]);

  // Cleanup map instance when the component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (viewMode !== "map" || typeof window === "undefined") {
      return;
    }
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
  }, [viewMode, isFilterSidebarOpen, filteredProperties.length]);

  const resultCount = filteredProperties.length;
  const isLoading = listingsQuery.isLoading;
  const isRefreshing = listingsQuery.isFetching && !listingsQuery.isLoading;
  const hasError = listingsQuery.isError;
  const showEmptyState = !isLoading && !isRefreshing && !hasError && resultCount === 0;

  const emptyMessage = showFavoritesOnly
    ? "أضف عقارات إلى المفضلة أو عطّل الفلتر لعرض جميع النتائج."
    : "";

  const statusMessage = hasError
    ? "تعذر تحميل العقارات حاليًا. حاول مرة أخرى لاحقًا."
    : isLoading
      ? "جار تحميل العقارات..."
      : isRefreshing
        ? "جار تحديث النتائج..."
        : resultCount
          ? `وجدنا ${resultCount} عقارًا${showFavoritesOnly ? " في مفضلتك" : ""}`
          : emptyMessage;

  const hiddenStatusMessages = new Set([
    "استكشف العقارات المتاحة",
    "لم يتم العثور على عقارات مطابقة لبحثك.",
  ]);

  const displayStatusMessage = hiddenStatusMessages.has(statusMessage.trim())
    ? ""
    : statusMessage;

  const headerControls = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={isFilterSidebarOpen ? "default" : "outline"}
        size="icon"
        onClick={() => setIsFilterSidebarOpen((prev) => !prev)}
        aria-pressed={isFilterSidebarOpen}
        aria-label={isFilterSidebarOpen ? "إخفاء الفلاتر" : "عرض الفلاتر"}
      >
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={viewMode === "map" ? "default" : "outline"}
        size="icon"
        onClick={() => setViewMode("map")}
        aria-pressed={viewMode === "map"}
        aria-label="عرض الخريطة"
      >
        <MapIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={viewMode === "table" ? "default" : "outline"}
        size="icon"
        onClick={() => setViewMode("table")}
        aria-pressed={viewMode === "table"}
        aria-label="عرض الجدول"
      >
        <LayoutList className="h-4 w-4" />
      </Button>
      <Button
        type="button"
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
    <aside className="w-full lg:w-80 shrink-0">
      <Card className="lg:sticky lg:top-24 shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">فلاتر البحث</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              إعادة تعيين
            </Button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="city-filter">المدينة</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger
                  id="city-filter"
                  className="border border-border/60 bg-white text-right"
                >
                  <SelectValue placeholder="كل المدن" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">كل المدن</SelectItem>
                  {cityOptions.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نطاق السعر (ريال)</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  id="price-min"
                  type="number"
                  inputMode="numeric"
                  placeholder="الأدنى"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  className="border border-border/60 bg-white"
                />
                <Input
                  id="price-max"
                  type="number"
                  inputMode="numeric"
                  placeholder="الأعلى"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="border border-border/60 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms-filter">الحد الأدنى للغرف</Label>
              <Select
                value={minBedrooms || "any"}
                onValueChange={(value) => setMinBedrooms(value === "any" ? "" : value)}
              >
                <SelectTrigger
                  id="bedrooms-filter"
                  className="border border-border/60 bg-white text-right"
                >
                  <SelectValue placeholder="أي" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="any">أي</SelectItem>
                  {["1", "2", "3", "4", "5", "6"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}+
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms-filter">الحد الأدنى للحمامات</Label>
              <Select
                value={minBathrooms || "any"}
                onValueChange={(value) => setMinBathrooms(value === "any" ? "" : value)}
              >
                <SelectTrigger
                  id="bathrooms-filter"
                  className="border border-border/60 bg-white text-right"
                >
                  <SelectValue placeholder="أي" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="any">أي</SelectItem>
                  {["1", "2", "3", "4", "5"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}+
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المساحة (م²)</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  id="area-min"
                  type="number"
                  inputMode="numeric"
                  placeholder="الأدنى"
                  value={minArea}
                  onChange={(event) => setMinArea(event.target.value)}
                  className="border border-border/60 bg-white"
                />
                <Input
                  id="area-max"
                  type="number"
                  inputMode="numeric"
                  placeholder="الأعلى"
                  value={maxArea}
                  onChange={(event) => setMaxArea(event.target.value)}
                  className="border border-border/60 bg-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSearch={setQuery}
        searchPlaceholder="ابحث عن مدينة، حي أو وصف للعقار"
        showActions={false}
        extraContent={headerControls}
      />

      <main className="mx-auto flex w-full max-w-10xl flex-col gap-6 px-4 pb-10 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3 text-right">
          <div className="space-y-1">
            {displayStatusMessage && (
              <p className="text-sm text-muted-foreground">{displayStatusMessage}</p>
            )}
            {mapLoadFailed && (
              <p className="text-xs text-amber-600">فشل تحميل خريطة العقارات، تم عرض النتائج في جدول بديل.</p>
            )}
          </div>
        </div>

        <div className={`flex flex-col gap-6 ${isFilterSidebarOpen ? "lg:flex-row" : ""}`}>
          {isFilterSidebarOpen && filtersSidebar}

          <div className="w-full flex-1">
            {viewMode === "map" ? (
              <Card className="relative overflow-hidden border border-border shadow-lg">
                <div
                  ref={mapContainerRef}
                  className="h-[calc(100vh-10rem)] min-h-[520px] w-full"
                />

                {mapLoadFailed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 px-6 text-center text-sm text-muted-foreground backdrop-blur-sm">
                    تعذر تحميل خريطة التصفح. تم التحويل تلقائيًا إلى عرض الجدول.
                  </div>
                )}

                {(isLoading || isRefreshing) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                    <span className="text-sm text-muted-foreground">
                      {isLoading ? "جار تحميل الخريطة..." : "جار تحديث الخريطة..."}
                    </span>
                  </div>
                )}

                {showEmptyState && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 px-6 text-center text-sm text-muted-foreground backdrop-blur-sm">
                    {emptyMessage}
                  </div>
                )}

                {hasError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 px-6 text-center text-sm text-destructive backdrop-blur-sm">
                    تعذر تحميل بيانات الخريطة، يرجى المحاولة مرة أخرى لاحقًا.
                  </div>
                )}
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  {filteredProperties.length > 0 ? (
                    <div className="p-6">
                      <div className="table-container">
                        <table className="professional-table">
                          <thead className="professional-table-header">
                            <tr>
                              <th>العقار</th>
                              <th>الموقع</th>
                              <th>السعر</th>
                              <th>المساحة</th>
                              <th>الغرف</th>
                              <th>الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProperties.map((property) => {
                              const isFavourite = favoriteIds.includes(property.id);
                              const cityLabel = property.city.trim().length > 0 ? property.city : "غير محدد";
                              const addressLabel = property.address.trim().length > 0 ? property.address : "العنوان غير متوفر";

                              return (
                                <tr
                                  key={property.id}
                                  className="professional-table-row cursor-pointer"
                                  onClick={() => navigateToProperty(property.id)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      navigateToProperty(property.id);
                                    }
                                  }}
                                >
                                  <td className="professional-table-cell-name">
                                    <div className="name flex items-center gap-3">
                                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                        {property.latitude !== null && property.longitude !== null ? (
                                          <Building2 className="h-4 w-4" />
                                        ) : (
                                          getPlaceholderLabel(property.title, property.city)
                                        )}
                                      </span>
                                      <span className="text-sm font-semibold text-slate-900">{property.title}</span>
                                    </div>
                                    <div className="contact">
                                      <div className="contact-item">
                                        <MapPin size={12} />
                                        <span>{cityLabel}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="professional-table-cell">
                                    <div className="info-cell">
                                      <div className="primary">{cityLabel}</div>
                                      <div className="secondary">{addressLabel}</div>
                                    </div>
                                  </td>
                                  <td className="professional-table-cell">
                                    <div className="info-cell">
                                      <div className="primary text-emerald-600 font-semibold">
                                        {formatCurrency(property.price)}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="professional-table-cell">
                                    <div className="info-cell">
                                      <div className="primary">
                                        {property.areaSqm !== null
                                          ? `${property.areaSqm.toLocaleString("en-US")} م²`
                                          : "—"}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="professional-table-cell">
                                    <div className="info-cell">
                                      <div className="primary flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                          <Bed size={12} />
                                          {property.bedrooms ?? "—"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Bath size={12} />
                                          {property.bathrooms ?? "—"}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="professional-table-actions">
                                    <div
                                      className="action-group"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <button
                                        className={`action-btn ${
                                          isFavourite
                                            ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            : "text-slate-600 hover:text-rose-500 hover:bg-rose-50"
                                        }`}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          toggleFavorite(property.id);
                                        }}
                                        aria-pressed={isFavourite}
                                        aria-label={isFavourite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                                      >
                                        <Heart className={isFavourite ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                                      </button>
                                      <button
                                        className="action-btn action-btn-view"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          navigateToProperty(property.id);
                                        }}
                                        title="عرض التفاصيل"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : displayStatusMessage ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                      {displayStatusMessage}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
