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
import { Badge } from "@/components/ui/badge";
import { Heart, LayoutList, Map as MapIcon, Building2 } from "lucide-react";
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
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

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
      const response = await apiRequest("GET", `/api/listings?${params.toString()}`);
      return (await response.json()) as ListingsResponse;
    },
    keepPreviousData: true,
  });

  const properties = useMemo<PropertySummary[]>(() => {
    if (!listingsQuery.data?.items) return [];

    return listingsQuery.data.items.map((item) => {
      const fallbackListing = item.listings?.find((listing) =>
        typeof listing?.price === "number" && !Number.isNaN(listing.price)
      );

      const price = asNumber(item.price) ?? asNumber(fallbackListing?.price);
      const area = asNumber(item.areaSqm) ?? sqmFromSquareFeet(asNumber(item.squareFeet));

      return {
        id: item.id,
        title: item.title?.trim().length ? item.title : "عقار بدون عنوان",
        address: item.address ?? "",
        city: item.city ?? "",
        price,
        bedrooms: asNumber(item.bedrooms),
        bathrooms: asNumber(item.bathrooms),
        areaSqm: area,
        latitude: asNumber(item.latitude),
        longitude: asNumber(item.longitude),
      };
    });
  }, [listingsQuery.data]);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return properties.filter((property) => {
      const searchHaystack = [property.title, property.city, property.address]
        .filter((value) => value)
        .map((value) => value.toLowerCase());

      const matchesQuery =
        normalizedQuery.length === 0 ||
        searchHaystack.some((text) => text.includes(normalizedQuery));

      const isFavourite = favoriteIds.includes(property.id);
      return matchesQuery && (!showFavoritesOnly || isFavourite);
    });
  }, [properties, query, favoriteIds, showFavoritesOnly]);

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
    if (viewMode !== "map") return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const L = await ensureLeaflet();
        if (cancelled || !mapContainerRef.current || !L) return;

        const center = userLocation ?? DEFAULT_MAP_CENTER;
        const zoom = userLocation ? USER_LOCATION_ZOOM : DEFAULT_MAP_ZOOM;

        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            zoomControl: true,
            scrollWheelZoom: true,
            closePopupOnClick: true,
            attributionControl: true,
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

          mapInstanceRef.current = map;
        } else {
          mapInstanceRef.current.invalidateSize();
        }
      } catch (error) {
        console.error("Error loading Leaflet:", error);
      }
    };

    void initMap();

    return () => {
      cancelled = true;
    };
  }, [viewMode]);

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

  const resultCount = filteredProperties.length;
  const isLoading = listingsQuery.isLoading;
  const isRefreshing = listingsQuery.isFetching && !listingsQuery.isLoading;
  const hasError = listingsQuery.isError;
  const showEmptyState = !isLoading && !isRefreshing && !hasError && resultCount === 0;

  const emptyMessage = showFavoritesOnly
    ? "لا توجد عقارات مفضلة مطابقة لبحثك الحالي."
    : "لم يتم العثور على عقارات مطابقة لبحثك.";

  const statusMessage = hasError
    ? "تعذر تحميل العقارات حاليًا. حاول مرة أخرى لاحقًا."
    : isLoading
      ? "جار تحميل العقارات..."
      : isRefreshing
        ? "جار تحديث النتائج..."
        : resultCount
          ? `وجدنا ${resultCount} عقارًا${showFavoritesOnly ? " في مفضلتك" : ""}`
          : emptyMessage;

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSearch={setQuery}
        searchPlaceholder="ابحث عن مدينة، حي أو وصف للعقار"
        showActions={false}
      />

      <main className="mx-auto flex w-full max-w-10xl flex-col gap-6 px-4 pb-10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">
              استكشف العقارات المتاحة
            </h1>
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={viewMode === "map" ? "default" : "outline"}
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-4 w-4" />
              <span>عرض الخريطة</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
            >
              <LayoutList className="h-4 w-4" />
              <span>عرض الجدول</span>
            </Button>
            <Button
              type="button"
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
            >
              <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
              <span>المفضلة فقط</span>
            </Button>
          </div>
        </div>

        {viewMode === "map" ? (
          <Card className="relative overflow-hidden border border-border shadow-lg">
            <div
              ref={mapContainerRef}
              className="h-[calc(100vh-10rem)] min-h-[520px] w-full"
            />

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
            <CardContent className="space-y-4 p-6 md:p-8">
              {filteredProperties.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProperties.map((property) => {
                    const isFavourite = favoriteIds.includes(property.id);

                    return (
                      <div
                        key={property.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigateToProperty(property.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigateToProperty(property.id);
                          }
                        }}
                        className="group relative flex h-full flex-col gap-4 rounded-2xl border border-border/40 bg-white/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      >
                        <header className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-200 shadow-inner ring-1 ring-border/60">
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                {property.latitude !== null && property.longitude !== null ? (
                                  <Building2 className="h-4 w-4" />
                                ) : (
                                  getPlaceholderLabel(property.title, property.city)
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-semibold text-foreground line-clamp-2">
                                {property.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="font-medium text-emerald-600">
                                  {property.city.trim().length > 0 ? property.city : "—"}
                                </span>
                                <span className="text-muted-foreground/40">•</span>
                                <span className="line-clamp-1">
                                  {property.address.trim().length > 0
                                    ? property.address
                                    : "العنوان غير متوفر"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleFavorite(property.id);
                            }}
                            onKeyDown={(event) => {
                              event.stopPropagation();
                            }}
                            aria-pressed={isFavourite}
                            aria-label={isFavourite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                            className="transition-colors hover:bg-transparent"
                          >
                            <Heart
                              className={`h-5 w-5 transition-colors ${
                                isFavourite
                                  ? "text-rose-500"
                                  : "text-muted-foreground hover:text-rose-400"
                              } ${isFavourite ? "fill-current" : ""}`}
                            />
                          </Button>
                        </header>

                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                          <Badge variant="outline" className="rounded-full border-border/60 bg-white/80 px-3 py-1 font-medium">
                            🛏️ {property.bedrooms ?? "—"} غرف
                          </Badge>
                          <Badge variant="outline" className="rounded-full border-border/60 bg-white/80 px-3 py-1 font-medium">
                            🛁 {property.bathrooms ?? "—"} دورات
                          </Badge>
                          <Badge variant="outline" className="rounded-full border-border/60 bg-white/80 px-3 py-1 font-medium">
                            {property.areaSqm !== null
                              ? `${property.areaSqm.toLocaleString("en-US")} m²`
                              : "المساحة غير متوفرة"}
                          </Badge>
                        </div>

                        <footer className="mt-auto flex items-center justify-between text-sm">
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(property.price)}
                          </span>
                          <span className="text-[12px] text-muted-foreground">
                            اضغط لعرض التفاصيل
                          </span>
                        </footer>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  {statusMessage}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
