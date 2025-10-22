/**
 * Search Properties Page - Map & Table Experience
 *
 * Provides a lightweight property discovery flow for end users with:
 * - Shared header search that filters map markers and tabular results
 * - Simple favourites toggling using in-memory state
 * - Map and table view toggles for spatial or tabular exploration
 */

/**
 * SearchProperties page overview
 * ------------------------------
 * This page wires together the public search experience: it fetches property data,
 * loads Leaflet on demand, renders the interactive map (with region/district overlays),
 * keeps the table view in sync, and exposes filtering/favorites UX. The major building
 * blocks are:
 * - Lazy loading Leaflet assets and holding map/overlay instances inside refs.
 * - Fetching listings plus Saudi geography, then transforming raw boundaries into
 *   Leaflet polygons the map can display.
 * - Tracking zoom state to swap overlays (regions when zoomed out, districts when
 *   zoomed in) and highlighting the active district on click.
 * - React state for filters, search debounce, favorites, user geolocation, etc.
 * - UI layout that supports both map and table modes without layout shift. The user
 *   explicitly requested a comment describing “everything in this page”, so this block
 *   serves that purpose while staying concise.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  RefreshCcw,
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
  region?: string | null;
  district?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: number | null;
  squareFeet?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  type?: string | null;
  category?: string | null;
  status?: string | null;
  transactionType?: string | null;
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
  region: string;
  district: string;
  regionId: number | null;
  cityId: number | null;
  districtId: number | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  latitude: number | null;
  longitude: number | null;
  propertyType: string;
  transactionType: string;
  status: string;
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

type LatLngTuple = [number, number];

// Zoom breakpoints: regions appear up to `REGION_ZOOM_THRESHOLD`, districts take over from `DISTRICT_ZOOM_THRESHOLD` onwards.
const REGION_ZOOM_THRESHOLD = 7;
const DISTRICT_ZOOM_THRESHOLD = 11;

const mapRegionStyle = {
  color: "#1f2937",
  weight: 1.2,
  opacity: 0.7,
  fillOpacity: 0.05,
  smoothFactor: 1,
};

const mapCityStyle = {
  color: "#2563eb",
  weight: 1.6,
  opacity: 0.65,
  fillOpacity: 0.08,
  dashArray: "4 4",
  smoothFactor: 1,
};

const DISTRICT_COLOR_PALETTE = [
  { stroke: "#047857", fill: "#bbf7d0" },
  { stroke: "#0f766e", fill: "#99f6e4" },
  { stroke: "#059669", fill: "#d1fae5" },
  { stroke: "#0e7490", fill: "#a5f3fc" },
  { stroke: "#0d9488", fill: "#befae7" },
  { stroke: "#0c4a6e", fill: "#bae6fd" },
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const pickDistrictColors = (districtId: string, cityId: number) => {
  const key = `${cityId}-${districtId}`;
  const paletteIndex = hashString(key) % DISTRICT_COLOR_PALETTE.length;
  return DISTRICT_COLOR_PALETTE[paletteIndex];
};

// Convert the GeoJSON-like boundary blobs we store into arrays Leaflet can consume.
const toLeafletPolygons = (boundary: unknown): LatLngTuple[][] => {
  const polygons: LatLngTuple[][] = [];

  const pushRing = (ring: unknown) => {
    if (!Array.isArray(ring)) return;
    const coords: LatLngTuple[] = [];
    for (const point of ring as unknown[]) {
      if (!Array.isArray(point) || point.length < 2) continue;
      const [lat, lng] = point as number[];
      if (typeof lat !== "number" || typeof lng !== "number") continue;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      coords.push([lat, lng]);
    }
    if (coords.length >= 3) {
      polygons.push(coords);
    }
  };

  const visit = (node: unknown) => {
    if (!Array.isArray(node)) return;
    if (node.length === 0) return;

    const first = node[0];
    if (Array.isArray(first) && typeof first[0] === "number") {
      pushRing(node);
      return;
    }

    for (const child of node) {
      if (Array.isArray(child)) {
        visit(child);
      }
    }
  };

  visit(boundary);
  return polygons;
};

// Ray casting helper so we can infer which region contains a given lat/lng.
const pointInPolygon = (point: LatLngTuple, polygon: LatLngTuple[]): boolean => {
  if (polygon.length < 3) return false;
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];

    const denominator = lngJ - lngI;
    const intersect =
      (lngI > lng) !== (lngJ > lng) &&
      lat < ((latJ - latI) * (lng - lngI)) / (denominator === 0 ? Number.EPSILON : denominator) + latI;

    if (intersect) inside = !inside;
  }

  return inside;
};

// Used to pick the closest city to the map center when determining active overlays.
const haversineDistanceKm = (a: LatLngTuple, b: LatLngTuple) => {
  const R = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const h = sinLat * sinLat + sinLon * sinLon * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
  return R * c;
};

// District data can approximate a city outline; we compute a convex hull when we have enough points.
const computeConvexHull = (points: LatLngTuple[]): LatLngTuple[] | null => {
  if (points.length < 3) {
    return null;
  }

  const unique = Array.from(
    new Map(points.map((p) => [`${p[0].toFixed(6)}:${p[1].toFixed(6)}`, p])).values()
  );

  if (unique.length < 3) {
    return null;
  }

  unique.sort((a, b) => {
    if (a[1] === b[1]) return a[0] - b[0];
    return a[1] - b[1];
  });

  const cross = (o: LatLngTuple, a: LatLngTuple, b: LatLngTuple) => {
    const x1 = a[1] - o[1];
    const y1 = a[0] - o[0];
    const x2 = b[1] - o[1];
    const y2 = b[0] - o[0];
    return x1 * y2 - y1 * x2;
  };

  const lower: LatLngTuple[] = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: LatLngTuple[] = [];
  for (let i = unique.length - 1; i >= 0; i -= 1) {
    const point = unique[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  upper.pop();
  lower.pop();

  const hull = [...lower, ...upper];
  return hull.length >= 3 ? hull : null;
};

interface RegionShape {
  id: number;
  nameAr: string;
  nameEn: string;
  polygons: LatLngTuple[][];
}

interface CitySummary {
  id: number;
  regionId: number;
  nameAr: string;
  nameEn: string;
  center: LatLngTuple | null;
}

interface CityShape extends CitySummary {
  hull: LatLngTuple[] | null;
}

interface DistrictShape {
  id: string;
  regionId: number;
  cityId: number;
  nameAr: string;
  nameEn: string;
  polygons: LatLngTuple[][];
  strokeColor: string;
  fillColor: string;
}

// Utility function to load Leaflet dynamically so the initial bundle stays lean.
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
  // Leaflet and overlay instances live in refs so React re-renders do not thrash the map.
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userLocationMarkerRef = useRef<any>(null);
  const regionLayerRef = useRef<any>(null);
  const cityLayerRef = useRef<any>(null);
  const districtLayerRef = useRef<any>(null);
  const regionShapesRef = useRef<Map<number, RegionShape>>(new Map());
  const cityCacheRef = useRef<Map<number, CityShape[]>>(new Map());
  const cityByIdRef = useRef<Map<number, CityShape>>(new Map());
  const districtCacheRef = useRef<Map<number, DistrictShape[]>>(new Map());
  const cityFetchTrackerRef = useRef<Set<number>>(new Set());
  const districtFetchTrackerRef = useRef<Set<number>>(new Set());
  const activeRegionIdRef = useRef<number | null>(null);
  const activeCityIdRef = useRef<number | null>(null);
  const activeDistrictIdRef = useRef<string | null>(null);
  const mapHasUserInteractionRef = useRef(false);
  const manualInteractionHandlerRef = useRef<(() => void) | null>(null);
  const [, setLocation] = useLocation();

  // UI state buckets: search/filter inputs, favorites toggles, active overlay bookkeeping, and simple version counters.
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  // Region/city/district filter selections plus their option lists, derived from the locations API.
  const [regionOptions, setRegionOptions] = useState<Array<{ id: number; label: string }>>([]);
  const [cityOptions, setCityOptions] = useState<Array<{ id: number; label: string; regionId: number }>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{ id: string; label: string; cityId: number }>>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("all");
  const [selectedCityId, setSelectedCityId] = useState<string>("all");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("all");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [activeRegionId, setActiveRegionId] = useState<number | null>(null);
  const [activeCityId, setActiveCityId] = useState<number | null>(null);
  const [activeDistrictId, setActiveDistrictId] = useState<string | null>(null);
  const [cityGeometryVersion, setCityGeometryVersion] = useState(0);
  const [districtGeometryVersion, setDistrictGeometryVersion] = useState(0);
  const [mapReadyVersion, setMapReadyVersion] = useState(0);

  useEffect(() => {
    if (viewMode === "map") {
      mapHasUserInteractionRef.current = false;
    }
  }, [viewMode]);

  // Event helpers keep Select components tidy while synchronising both the id and display label.
  const handleRegionSelect = useCallback(
    (value: string) => {
      mapHasUserInteractionRef.current = false;
      if (value === "all") {
        setSelectedRegionId("all");
        setSelectedCityId("all");
        setSelectedDistrictId("all");
        setCityOptions([]);
        setDistrictOptions([]);
        return;
      }

      setSelectedRegionId(value);
      // Reset downstream selections whenever the region changes.
      setSelectedCityId("all");
      setSelectedDistrictId("all");
      setDistrictOptions([]);
    },
    []
  );

  const handleCitySelect = useCallback(
    (value: string) => {
      mapHasUserInteractionRef.current = false;
      if (value === "all") {
        setSelectedCityId("all");
        setSelectedDistrictId("all");
        setDistrictOptions([]);
        return;
      }

      setSelectedCityId(value);
      setSelectedDistrictId("all");
    },
    []
  );

  const handleDistrictSelect = useCallback((value: string) => {
    mapHasUserInteractionRef.current = false;
    setSelectedDistrictId(value);
  }, []);

  const handlePropertyTypeSelect = useCallback((value: string) => {
    setSelectedPropertyType(value);
  }, []);

  const handleTransactionTypeSelect = useCallback((value: string) => {
    setSelectedTransactionType(value);
  }, []);

  const getMapCenter = useCallback((): LatLngTuple | null => {
    const map = mapInstanceRef.current;
    if (!map) return null;
    const center = map.getCenter();
    return [center.lat, center.lng];
  }, []);

  const updateLayerVisibility = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const zoom = map.getZoom();

    const regionLayer = regionLayerRef.current;
    if (regionLayer) {
      const hasLayer = map.hasLayer(regionLayer);
      if (zoom >= DISTRICT_ZOOM_THRESHOLD) {
        if (hasLayer) {
          map.removeLayer(regionLayer);
        }
      } else if (!hasLayer) {
        regionLayer.addTo(map);
      }
    }

    if (cityLayerRef.current) {
      const hasLayer = map.hasLayer(cityLayerRef.current);
      const hasFeatures = cityLayerRef.current.getLayers().length > 0;
      if (zoom >= REGION_ZOOM_THRESHOLD && hasFeatures) {
        if (!hasLayer) {
          cityLayerRef.current.addTo(map);
        }
      } else if (hasLayer) {
        map.removeLayer(cityLayerRef.current);
      }
    }

    if (districtLayerRef.current) {
      const hasLayer = map.hasLayer(districtLayerRef.current);
      const hasFeatures = districtLayerRef.current.getLayers().length > 0;
      if (zoom >= DISTRICT_ZOOM_THRESHOLD && hasFeatures) {
        if (!hasLayer) {
          districtLayerRef.current.addTo(map);
        }
      } else if (hasLayer) {
        map.removeLayer(districtLayerRef.current);
      }
    }
  }, []);

  const findRegionIdForPoint = useCallback((point: LatLngTuple): number | null => {
    const shapes = regionShapesRef.current;
    for (const [regionId, shape] of Array.from(shapes.entries())) {
      if (shape.polygons.some((polygon: LatLngTuple[]) => pointInPolygon(point, polygon))) {
        return regionId;
      }
    }
    return null;
  }, []);

  const findClosestCityId = useCallback((regionId: number, point: LatLngTuple): number | null => {
    const cities = cityCacheRef.current.get(regionId);
    if (!cities || cities.length === 0) {
      return null;
    }

    let closestCity: CityShape | null = null;
    let smallestDistance = Number.POSITIVE_INFINITY;

    for (const city of cities) {
      if (!city.center) continue;
      const distance = haversineDistanceKm(point, city.center);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestCity = city;
      }
    }

    return closestCity ? closestCity.id : null;
  }, []);

  // Memoized fetcher to cache all cities for a region the first time we zoom into it.
  const ensureCitiesForRegion = useCallback(
    async (regionId: number) => {
      if (cityCacheRef.current.has(regionId) || cityFetchTrackerRef.current.has(regionId)) {
        return;
      }

      cityFetchTrackerRef.current.add(regionId);
      try {
        const response = await apiRequest("GET", `/api/locations/cities?regionId=${regionId}`);
        const data = await response.json();

        const mapped: CityShape[] = (Array.isArray(data) ? data : []).map((city: any) => {
          const centerValue = city?.center;
          const centerTuple: LatLngTuple | null =
            centerValue &&
            typeof centerValue.latitude === "number" &&
            typeof centerValue.longitude === "number"
              ? [centerValue.latitude, centerValue.longitude]
              : null;

          const shape: CityShape = {
            id: Number(city.id ?? city.cityId ?? city.city_id ?? 0),
            regionId: Number(city.regionId ?? city.region_id ?? regionId),
            nameAr: city.nameAr ?? city.name_ar ?? "",
            nameEn: city.nameEn ?? city.name_en ?? "",
            center: centerTuple,
            hull: null,
          };

          cityByIdRef.current.set(shape.id, shape);
          return shape;
        });

        cityCacheRef.current.set(regionId, mapped);
      } catch (error) {
        console.error("Failed to load cities for region", regionId, error);
      } finally {
        cityFetchTrackerRef.current.delete(regionId);
      }
    },
    []
  );

  // Similar cache for districts (with precomputed colors/hulls) keyed by city.
  const ensureDistrictsForCity = useCallback(
    async (cityId: number, regionId: number) => {
      if (districtCacheRef.current.has(cityId) || districtFetchTrackerRef.current.has(cityId)) {
        return;
      }

      districtFetchTrackerRef.current.add(cityId);
      try {
        const response = await apiRequest(
          "GET",
          `/api/locations/districts?cityId=${cityId}&includeBoundary=true`
        );
        const data = await response.json();

        const shapes: DistrictShape[] = (Array.isArray(data) ? data : [])
          .map((district: any) => {
            const polygons = toLeafletPolygons(district?.boundary);
            if (polygons.length === 0) return null;
            const idValue = String(
              district.id ?? district.districtId ?? district.district_id ?? cityId
            );
            const colors = pickDistrictColors(idValue, Number(district.cityId ?? cityId));
            return {
              id: idValue,
              regionId: Number(district.regionId ?? district.region_id ?? regionId),
              cityId: Number(district.cityId ?? district.city_id ?? cityId),
              nameAr: district.nameAr ?? district.name_ar ?? "",
              nameEn: district.nameEn ?? district.name_en ?? "",
              polygons,
              strokeColor: colors.stroke,
              fillColor: colors.fill,
            } as DistrictShape;
          })
          .filter((value): value is DistrictShape => Boolean(value));

        districtCacheRef.current.set(cityId, shapes);

        const allPoints: LatLngTuple[] = [];
        shapes.forEach((shape) => {
          shape.polygons.forEach((ring: LatLngTuple[]) => {
            allPoints.push(...ring);
          });
        });

        const hull = computeConvexHull(allPoints);
        if (hull && hull.length >= 3) {
          const existingCity = cityByIdRef.current.get(cityId);
          if (existingCity) {
            const nextCity: CityShape = { ...existingCity, hull };
            cityByIdRef.current.set(cityId, nextCity);
            const cachedCities = cityCacheRef.current.get(regionId);
            if (cachedCities) {
              const index = cachedCities.findIndex((item) => item.id === cityId);
              if (index >= 0) {
                cachedCities[index] = nextCity;
              }
            }
          }
        }

        setCityGeometryVersion((prev) => prev + 1);
        setDistrictGeometryVersion((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to load districts for city", cityId, error);
      } finally {
        districtFetchTrackerRef.current.delete(cityId);
      }
    },
    [setCityGeometryVersion, setDistrictGeometryVersion]
  );

  // Draw region polygons (if available); we re-run whenever the cache is refreshed.
  const renderRegionPolygons = useCallback(() => {
    const map = mapInstanceRef.current;
    const L = (window as any)?.L;
    const regionLayer = regionLayerRef.current;
    if (!map || !L || !regionLayer) return;

      regionLayer.clearLayers();
      for (const region of Array.from(regionShapesRef.current.values())) {
        region.polygons.forEach((ring: LatLngTuple[]) => {
          const polygon = L.polygon(ring, mapRegionStyle);
          polygon.bindTooltip(region.nameAr || region.nameEn, {
            direction: "center",
            className:
              "map-region-label border-none bg-white/70 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur",
            permanent: false,
            sticky: false,
          });
          polygon.on("mouseover", () => {
            polygon.setStyle({
              ...mapRegionStyle,
              weight: 4.8,
              opacity: 1,
              fillOpacity: 0.12,
            });
            polygon.bringToFront();
          });
          polygon.on("mouseout", () => {
            polygon.setStyle({ ...mapRegionStyle });
          });
          regionLayer.addLayer(polygon);
        });
      }

    updateLayerVisibility();
  }, [updateLayerVisibility]);

  const renderCityHull = useCallback(
    (cityId: number | null) => {
      const map = mapInstanceRef.current;
      const L = (window as any)?.L;
      const layer = cityLayerRef.current;
      if (!map || !L || !layer) return;

      layer.clearLayers();
      if (!cityId) {
        updateLayerVisibility();
        return;
      }

      const city = cityByIdRef.current.get(cityId);
      if (!city) {
        updateLayerVisibility();
        return;
      }

      if (city.hull && city.hull.length >= 3) {
        const isActiveCity = activeCityIdRef.current === cityId;
        const baseStyle = {
          ...mapCityStyle,
          fillOpacity: isActiveCity ? 0.18 : 0.12,
          weight: isActiveCity ? 2.8 : mapCityStyle.weight,
        };

        const polygon = L.polygon(city.hull, baseStyle);
        polygon.bindTooltip(city.nameAr || city.nameEn, {
          direction: "center",
          className:
            "map-city-label border-none bg-white/75 px-2 py-1 text-[11px] font-medium text-sky-700 shadow-sm backdrop-blur",
          permanent: false,
          sticky: false,
        });

        polygon.on("mouseover", () => {
          polygon.setStyle({
            ...baseStyle,
            weight: 3.6,
            opacity: 0.9,
            fillOpacity: 0.22,
          });
          polygon.bringToFront();
        });

        polygon.on("mouseout", () => {
          const isStillActive = activeCityIdRef.current === cityId;
          polygon.setStyle({
            ...mapCityStyle,
            fillOpacity: isStillActive ? 0.18 : 0.12,
            weight: isStillActive ? 2.8 : mapCityStyle.weight,
          });
        });

        layer.addLayer(polygon);
      } else if (city.center) {
        const circle = L.circle(city.center, {
          color: mapCityStyle.color,
          weight: 1.6,
          opacity: 0.8,
          fillColor: mapCityStyle.color,
          fillOpacity: 0.15,
          radius: 4000,
        });

        circle.bindTooltip(city.nameAr || city.nameEn, {
          direction: "center",
          className:
            "map-city-label border-none bg-white/75 px-2 py-1 text-[11px] font-medium text-sky-700 shadow-sm backdrop-blur",
          permanent: false,
          sticky: false,
        });

        layer.addLayer(circle);
      }

      updateLayerVisibility();
    },
    [updateLayerVisibility]
  );

  // Draw district polygons for the active city. Handles hover/active styling and click focus.
  const renderDistrictPolygons = useCallback(
    (cityId: number | null) => {
      const map = mapInstanceRef.current;
      const L = (window as any)?.L;
      const layer = districtLayerRef.current;
      if (!map || !L || !layer) return;

      layer.clearLayers();
      if (!cityId) {
        updateLayerVisibility();
        return;
      }

      const districts = districtCacheRef.current.get(cityId);
      if (!districts || districts.length === 0) {
        updateLayerVisibility();
        return;
      }

      districts.forEach((district) => {
        const isActive =
          activeDistrictIdRef.current === district.id || activeDistrictId === district.id;

        district.polygons.forEach((ring: LatLngTuple[]) => {
          const defaultStyle = {
            color: district.strokeColor,
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.22,
            fillColor: district.fillColor,
            smoothFactor: 1.2,
            dashArray: undefined,
          };

          const activeStyle = {
            ...defaultStyle,
            weight: 2.6,
            opacity: 1,
            fillOpacity: 0.3,
            dashArray: "6 3",
          };

          const hoverStyle = {
            ...defaultStyle,
            weight: 4.2,
            opacity: 1,
            fillOpacity: 0.28,
          };

          const activeHoverStyle = {
            ...activeStyle,
            weight: 5,
            fillOpacity: 0.36,
          };

          const polygon = L.polygon(ring, isActive ? activeStyle : defaultStyle);
          polygon.bindTooltip(district.nameAr || district.nameEn, {
            direction: "center",
            className:
              "map-district-label border-none bg-white/85 px-2 py-1 text-[11px] font-medium text-emerald-700 shadow-sm backdrop-blur",
            sticky: true,
          });

          polygon.on("click", () => {
            activeDistrictIdRef.current = district.id;
            setActiveDistrictId(district.id);
            polygon.bringToFront();
            polygon.setStyle(activeHoverStyle);
            map.fitBounds(polygon.getBounds(), { padding: [40, 40] });
          });

          polygon.on("mouseover", () => {
            const active = activeDistrictIdRef.current === district.id;
            polygon.setStyle(active ? activeHoverStyle : hoverStyle);
          });

          polygon.on("mouseout", () => {
            const active = activeDistrictIdRef.current === district.id;
            polygon.setStyle(active ? activeStyle : defaultStyle);
          });

          layer.addLayer(polygon);
        });
      });

      updateLayerVisibility();
    },
    [activeDistrictId, updateLayerVisibility]
  );

  const refreshActiveRegion = useCallback(() => {
    const center = getMapCenter();
    if (!center) return;

    const regionId = findRegionIdForPoint(center);
    if (regionId !== null) {
      if (regionId !== activeRegionIdRef.current) {
        activeRegionIdRef.current = regionId;
        setActiveRegionId(regionId);
      }
    } else if (activeRegionIdRef.current !== null) {
      activeRegionIdRef.current = null;
      setActiveRegionId(null);
    }
  }, [findRegionIdForPoint, getMapCenter]);

  const refreshActiveCity = useCallback(
    (regionId: number | null) => {
      const center = getMapCenter();
      if (!center || regionId === null) {
        if (activeCityIdRef.current !== null) {
          activeCityIdRef.current = null;
          setActiveCityId(null);
        }
        return;
      }

      const cityId = findClosestCityId(regionId, center);
      if (cityId !== null) {
        if (cityId !== activeCityIdRef.current) {
          activeCityIdRef.current = cityId;
          setActiveCityId(cityId);
        }
      } else if (activeCityIdRef.current !== null) {
        activeCityIdRef.current = null;
        setActiveCityId(null);
      }
    },
    [findClosestCityId, getMapCenter]
  );

  useEffect(() => {
    activeDistrictIdRef.current = null;
    if (activeDistrictId !== null) {
      setActiveDistrictId(null);
    }
  }, [activeCityId]);

  // Keep the filter sidebar open by default on desktop and toggleable on smaller screens.
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

  // Debounce the free-text search so we only hit the listings endpoint after typing pauses.
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
      const regionText = asText(item.region).trim();
      const districtText = asText(item.district).trim();
      const regionIdValue = asNumber((item as any).regionId);
      const cityIdValue = asNumber((item as any).cityId);
      const districtIdValue = asNumber((item as any).districtId);
      const propertyTypeText = asText(item.type).trim();
      const transactionTypeText = asText(item.category ?? item.transactionType).trim();
      const statusText = asText(item.status).trim();

      return {
        id: item.id,
        title: titleText.length ? titleText : "عقار بدون عنوان",
        address: addressText,
        city: cityText,
        region: regionText,
        district: districtText,
        regionId: Number.isFinite(regionIdValue) ? regionIdValue : null,
        cityId: Number.isFinite(cityIdValue) ? cityIdValue : null,
        districtId: Number.isFinite(districtIdValue) ? districtIdValue : null,
        price,
        bedrooms: asNumber(item.bedrooms),
        bathrooms: asNumber(item.bathrooms),
        areaSqm: area,
        latitude: asNumber(item.latitude),
        longitude: asNumber(item.longitude),
        propertyType: propertyTypeText,
        transactionType: transactionTypeText,
        status: statusText,
      };
    });
  }, [listingsQuery.data]);

  // Build option lists from listing metadata so filters only expose available values.
  const propertyTypeOptions = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((property) => {
      const candidate = property.propertyType.trim();
      if (candidate) {
        set.add(candidate);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [properties]);

  const transactionTypeOptions = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((property) => {
      const candidate = property.transactionType.trim();
      if (candidate) {
        set.add(candidate);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [properties]);

  // Fetch the list of regions once; the sidebar uses this to drive subsequent city/district calls.
  useEffect(() => {
    let cancelled = false;

    const loadRegions = async () => {
      try {
        const response = await apiRequest("GET", "/api/locations/regions");
        const payload = await response.json();
        if (cancelled) return;

        const mapped = (Array.isArray(payload) ? payload : [])
          .map((region: any) => {
            const id = Number(region.id ?? region.regionId ?? region.region_id);
            const label = asText(region.nameAr ?? region.nameEn ?? "").trim();
            return id && label ? { id, label } : null;
          })
          .filter((region): region is { id: number; label: string } => Boolean(region));

        mapped.sort((a, b) => a.label.localeCompare(b.label, "ar"));
        setRegionOptions(mapped);
      } catch (error) {
        console.error("Failed to load regions for filter sidebar:", error);
      }
    };

    void loadRegions();

    return () => {
      cancelled = true;
    };
  }, []);

  // When a region is selected, populate city options; clearing the region wipes downstream filters.
  useEffect(() => {
    if (selectedRegionId === "all") {
      setCityOptions([]);
      setDistrictOptions([]);
      return;
    }

    const regionId = Number(selectedRegionId);
    if (!Number.isFinite(regionId)) {
      return;
    }

    let cancelled = false;

    const loadCities = async () => {
      try {
        const response = await apiRequest("GET", `/api/locations/cities?regionId=${regionId}`);
        const payload = await response.json();
        if (cancelled) return;

        const mapped = (Array.isArray(payload) ? payload : [])
          .map((city: any) => {
            const id = Number(city.id ?? city.cityId ?? city.city_id);
            const label = asText(city.nameAr ?? city.nameEn ?? "").trim();
            return id && label ? { id, label, regionId } : null;
          })
          .filter((city): city is { id: number; label: string; regionId: number } => Boolean(city));

        mapped.sort((a, b) => a.label.localeCompare(b.label, "ar"));
        setCityOptions(mapped);

        // If the previously selected city no longer exists under this region, reset the selection.
        if (!mapped.some((city) => city.id.toString() === selectedCityId)) {
          setSelectedCityId("all");
          setSelectedDistrictId("all");
          setDistrictOptions([]);
        }
      } catch (error) {
        console.error("Failed to load cities for filter sidebar:", error);
      }
    };

    void loadCities();

    return () => {
      cancelled = true;
    };
  }, [selectedRegionId, selectedCityId]);

  // When a city is selected, hydrate the district dropdown; clearing the city resets districts.
  useEffect(() => {
    if (selectedCityId === "all") {
      setDistrictOptions([]);
      return;
    }

    const cityId = Number(selectedCityId);
    if (!Number.isFinite(cityId)) {
      return;
    }

    let cancelled = false;

    const loadDistricts = async () => {
      try {
        const response = await apiRequest("GET", `/api/locations/districts?cityId=${cityId}`);
        const payload = await response.json();
        if (cancelled) return;

        const mapped = (Array.isArray(payload) ? payload : [])
          .map((district: any) => {
            const id = String(district.id ?? district.districtId ?? district.district_id ?? "");
            const label = asText(district.nameAr ?? district.nameEn ?? "").trim();
            return id && label ? { id, label, cityId } : null;
          })
          .filter((district): district is { id: string; label: string; cityId: number } => Boolean(district));

        mapped.sort((a, b) => a.label.localeCompare(b.label, "ar"));
        setDistrictOptions(mapped);

        if (!mapped.some((district) => district.id === selectedDistrictId)) {
          setSelectedDistrictId("all");
        }
      } catch (error) {
        console.error("Failed to load districts for filter sidebar:", error);
      }
    };

    void loadDistricts();

    return () => {
      cancelled = true;
    };
  }, [selectedCityId, selectedDistrictId]);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const regionFilterId = selectedRegionId !== "all" ? Number(selectedRegionId) : null;
    const cityFilterId = selectedCityId !== "all" ? Number(selectedCityId) : null;
    const districtFilterId = selectedDistrictId !== "all" ? selectedDistrictId : null;
    const propertyTypeFilterValue = selectedPropertyType !== "all" ? selectedPropertyType.trim().toLowerCase() : null;
    const transactionFilterValue = selectedTransactionType !== "all" ? selectedTransactionType.trim().toLowerCase() : null;
    const minPriceValue = parseFilterNumber(minPrice);
    const maxPriceValue = parseFilterNumber(maxPrice);
    const minBedroomsValue = parseFilterNumber(minBedrooms);
    const minBathroomsValue = parseFilterNumber(minBathrooms);
    const minAreaValue = parseFilterNumber(minArea);
    const maxAreaValue = parseFilterNumber(maxArea);

    return properties.filter((property) => {
      const searchHaystack = [property.title, property.city, property.address, property.region, property.district]
        .filter((value) => value)
        .map((value) => value.toLowerCase());

      const matchesQuery =
        normalizedQuery.length === 0 ||
        searchHaystack.some((text) => text.includes(normalizedQuery));

      if (!matchesQuery) return false;

      const isFavourite = favoriteIds.includes(property.id);
      if (showFavoritesOnly && !isFavourite) return false;

      if (regionFilterId !== null) {
        if (property.regionId === null || property.regionId !== regionFilterId) {
          return false;
        }
      }

      if (cityFilterId !== null) {
        if (property.cityId === null || property.cityId !== cityFilterId) {
          return false;
        }
      }

      if (districtFilterId !== null) {
        if (!property.districtId || property.districtId.toString() !== districtFilterId) {
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

      if (propertyTypeFilterValue) {
        const propertyType = property.propertyType.trim().toLowerCase();
        if (!propertyType || propertyType !== propertyTypeFilterValue) {
          return false;
        }
      }

      if (transactionFilterValue) {
        const propertyTransaction = property.transactionType.trim().toLowerCase();
        if (!propertyTransaction || propertyTransaction !== transactionFilterValue) {
          return false;
        }
      }

      return true;
    });
  }, [
    properties,
    query,
    favoriteIds,
    showFavoritesOnly,
    selectedRegionId,
    selectedCityId,
    selectedDistrictId,
    selectedPropertyType,
    selectedTransactionType,
    minPrice,
    maxPrice,
    minBedrooms,
    minBathrooms,
    minArea,
    maxArea,
  ]);

  const recenterMap = useCallback(
    (options?: { force?: boolean }) => {
      const map = mapInstanceRef.current;
      const L = (window as any)?.L;
      if (!map || !L) return;

      const points: LatLngTuple[] = [];
      filteredProperties.forEach((property) => {
        if (property.latitude !== null && property.longitude !== null) {
          points.push([property.latitude, property.longitude]);
        }
      });

      const force = options?.force ?? false;
      if (mapHasUserInteractionRef.current && !force && points.length > 0) {
        return;
      }

      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40] });
      } else {
        map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
      }
    },
    [filteredProperties]
  );

  const handleResetMapView = useCallback(() => {
    if (viewMode !== "map") return;
    mapHasUserInteractionRef.current = false;
    recenterMap({ force: true });
  }, [recenterMap, viewMode]);

  const toggleFavorite = (propertyId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const navigateToProperty = (propertyId: string) => {
    if (!propertyId) return;
    setLocation(`/home/platform/properties/${propertyId}`);
  };

  const getPlaceholderLabel = (title: string, city: string) => {
    const source = title?.trim() || city?.trim() || "عقار";
    return source.slice(0, 2);
  };

  const resetFilters = () => {
    mapHasUserInteractionRef.current = false;
    setSelectedRegionId("all");
    setSelectedCityId("all");
    setSelectedDistrictId("all");
    setSelectedPropertyType("all");
    setSelectedTransactionType("all");
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
    mapHasUserInteractionRef.current = false;

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

          if (!regionLayerRef.current) {
            regionLayerRef.current = L.layerGroup().addTo(map);
          } else {
            regionLayerRef.current.addTo(map);
          }

          if (!cityLayerRef.current) {
            cityLayerRef.current = L.layerGroup();
          }

          if (!districtLayerRef.current) {
            districtLayerRef.current = L.layerGroup();
          }

          mapInstanceRef.current = map;
          setMapReadyVersion((prev) => prev + 1);
          updateLayerVisibility();
        } else {
          mapInstanceRef.current.invalidateSize();
          setMapReadyVersion((prev) => prev + 1);
          updateLayerVisibility();
        }

        const map = mapInstanceRef.current;
        if (map) {
          const markManualInteraction = () => {
            mapHasUserInteractionRef.current = true;
          };

          if (manualInteractionHandlerRef.current) {
            map.off("dragstart", manualInteractionHandlerRef.current);
            map.off("zoomstart", manualInteractionHandlerRef.current);
          }

          manualInteractionHandlerRef.current = markManualInteraction;
          map.on("dragstart", markManualInteraction);
          map.on("zoomstart", markManualInteraction);
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
  }, [
    viewMode,
    mapLoadFailed,
    updateLayerVisibility,
    userLocation,
  ]);

  useEffect(() => {
    if (viewMode !== "map") return;

    const map = mapInstanceRef.current;
    if (!map) return;

    let isCancelled = false;

    const loadRegions = async () => {
      try {
        const response = await apiRequest("GET", "/api/locations/regions?includeBoundary=true");
        const data = await response.json();
        if (isCancelled) return;

        regionShapesRef.current.clear();

        (Array.isArray(data) ? data : []).forEach((region: any) => {
          const polygons = toLeafletPolygons(region?.boundary);
          if (!polygons.length) return;

          const shape: RegionShape = {
            id: Number(region.id ?? region.regionId ?? region.region_id ?? 0),
            nameAr: region.nameAr ?? region.name_ar ?? "",
            nameEn: region.nameEn ?? region.name_en ?? "",
            polygons,
          };
          regionShapesRef.current.set(shape.id, shape);
        });

        renderRegionPolygons();
        updateLayerVisibility();
        refreshActiveRegion();

        const regionId = activeRegionIdRef.current;
        if (regionId !== null) {
          await ensureCitiesForRegion(regionId);
          if (!isCancelled) {
            refreshActiveCity(regionId);
          }
        }
      } catch (error) {
        console.error("Failed to load region boundaries", error);
      }
    };

    void loadRegions();

    return () => {
      isCancelled = true;
    };
  }, [
    viewMode,
    mapReadyVersion,
    ensureCitiesForRegion,
    refreshActiveCity,
    refreshActiveRegion,
    renderRegionPolygons,
    updateLayerVisibility,
  ]);

  useEffect(() => {
    if (viewMode !== "map") return;

    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMove = () => {
      refreshActiveRegion();
      const regionId = activeRegionIdRef.current;
      if (regionId !== null && cityCacheRef.current.has(regionId)) {
        refreshActiveCity(regionId);
      }
      updateLayerVisibility();
    };

    const handleZoom = () => {
      const regionId = activeRegionIdRef.current;
      if (regionId !== null && cityCacheRef.current.has(regionId)) {
        refreshActiveCity(regionId);
      }
      updateLayerVisibility();
    };

    map.on("moveend", handleMove);
    map.on("zoomend", handleZoom);

    handleMove();

    return () => {
      map.off("moveend", handleMove);
      map.off("zoomend", handleZoom);
    };
  }, [viewMode, mapReadyVersion, refreshActiveRegion, refreshActiveCity, updateLayerVisibility]);

  // Tear down Leaflet instance when leaving the map view so it can be
  // recreated cleanly on the next toggle. This avoids the map
  // disappearing after switching to the table view and back because the
  // underlying DOM node gets unmounted.
  useEffect(() => {
    if (viewMode === "map") return;
    if (mapInstanceRef.current) {
      if (manualInteractionHandlerRef.current) {
        mapInstanceRef.current.off("dragstart", manualInteractionHandlerRef.current);
        mapInstanceRef.current.off("zoomstart", manualInteractionHandlerRef.current);
      }
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    manualInteractionHandlerRef.current = null;
    mapHasUserInteractionRef.current = false;
    markersRef.current = [];
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }
    if (regionLayerRef.current) {
      regionLayerRef.current.clearLayers();
      regionLayerRef.current = null;
    }
    if (cityLayerRef.current) {
      cityLayerRef.current.clearLayers();
      cityLayerRef.current = null;
    }
    if (districtLayerRef.current) {
      districtLayerRef.current.clearLayers();
      districtLayerRef.current = null;
    }
    activeRegionIdRef.current = null;
    activeCityIdRef.current = null;
    activeDistrictIdRef.current = null;
    setActiveRegionId(null);
    setActiveCityId(null);
    setActiveDistrictId(null);
  }, [viewMode]);

  // Sync map markers whenever the filtered dataset changes
  // Whenever the filtered dataset or map view changes, redraw price markers and fit bounds.
  useEffect(() => {
    if (viewMode !== "map") return;

    const map = mapInstanceRef.current;
    const L = (window as any)?.L;

    if (!map || !L) return;

    markersRef.current.forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

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
    });

    recenterMap();

    return () => {
      map.off("click", closeAllTooltips);
    };
  }, [filteredProperties, mapReadyVersion, recenterMap, viewMode]);

  // Ensure the region/city cache stays populated and the active region reflects the current viewport.
  useEffect(() => {
    if (viewMode !== "map") return;

    if (activeRegionId === null) {
      renderCityHull(null);
      renderDistrictPolygons(null);
      return;
    }

    let isCancelled = false;

    const loadCities = async () => {
      await ensureCitiesForRegion(activeRegionId);
      if (isCancelled) return;
      refreshActiveCity(activeRegionId);
    };

    void loadCities();

    return () => {
      isCancelled = true;
    };
  }, [activeRegionId, ensureCitiesForRegion, refreshActiveCity, renderCityHull, renderDistrictPolygons, viewMode]);

  // Once a city is active, make sure its districts are drawn (or skeletal placeholders if unavailable yet).
  useEffect(() => {
    if (viewMode !== "map") return;

    if (activeCityId === null) {
      renderCityHull(null);
      renderDistrictPolygons(null);
      return;
    }

    const regionId = activeRegionIdRef.current;
    if (regionId === null) {
      renderCityHull(null);
      renderDistrictPolygons(null);
      return;
    }

    let cancelled = false;

    const paintCityAndDistricts = () => {
      if (!cancelled) {
        renderCityHull(activeCityId);
        renderDistrictPolygons(activeCityId);
      }
    };

    if (districtCacheRef.current.has(activeCityId)) {
      paintCityAndDistricts();
    } else {
      ensureDistrictsForCity(activeCityId, regionId)
        .catch((error) => {
          console.error("Failed to ensure districts for city", activeCityId, error);
        })
        .finally(paintCityAndDistricts);
    }

    return () => {
      cancelled = true;
    };
  }, [
    activeCityId,
    ensureDistrictsForCity,
    renderCityHull,
    renderDistrictPolygons,
    viewMode,
    districtGeometryVersion,
    cityGeometryVersion,
  ]);

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
        if (manualInteractionHandlerRef.current) {
          mapInstanceRef.current.off("dragstart", manualInteractionHandlerRef.current);
          mapInstanceRef.current.off("zoomstart", manualInteractionHandlerRef.current);
        }
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      manualInteractionHandlerRef.current = null;
      mapHasUserInteractionRef.current = false;
    };
  }, []);

  // Keep Leaflet sized correctly when the viewport or sidebar changes (prevents CLS on layout shifts).
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
    : "لم يتم العثور على عقارات مطابقة لبحثك الحالي. حرّك الخريطة أو عدّل الفلاتر.";

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
        variant="outline"
        size="icon"
        onClick={handleResetMapView}
        disabled={viewMode !== "map"}
        aria-label="إعادة ضبط عرض الخريطة"
      >
        <RefreshCcw className="h-4 w-4" />
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
              <Label htmlFor="region-filter">المنطقة</Label>
              <Select value={selectedRegionId} onValueChange={handleRegionSelect}>
                <SelectTrigger
                  id="region-filter"
                  className="border border-border/60 bg-white text-right"
                >
                  <SelectValue placeholder="كل المناطق" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">كل المناطق</SelectItem>
                  {regionOptions.map((region) => (
                    <SelectItem key={region.id} value={region.id.toString()}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city-filter">المدينة</Label>
              <Select value={selectedCityId} onValueChange={handleCitySelect}>
                <SelectTrigger
                  id="city-filter"
                  className="border border-border/60 bg-white text-right"
                  disabled={selectedRegionId === "all" || cityOptions.length === 0}
                >
                  <SelectValue placeholder="كل المدن" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">كل المدن</SelectItem>
                  {cityOptions.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district-filter">الحي</Label>
              <Select value={selectedDistrictId} onValueChange={handleDistrictSelect}>
                <SelectTrigger
                  id="district-filter"
                  className="border border-border/60 bg-white text-right"
                  disabled={selectedCityId === "all" || districtOptions.length === 0}
                >
                  <SelectValue placeholder="كل الأحياء" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">كل الأحياء</SelectItem>
                  {districtOptions.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-type-filter">نوع العقار</Label>
              <Select
                value={selectedPropertyType}
                onValueChange={handlePropertyTypeSelect}
              >
                <SelectTrigger
                  id="property-type-filter"
                  className="border border-border/60 bg-white text-right"
                  disabled={propertyTypeOptions.length === 0}
                >
                  <SelectValue placeholder="كل الأنواع" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {propertyTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-type-filter">الغرض</Label>
              <Select
                value={selectedTransactionType}
                onValueChange={handleTransactionTypeSelect}
              >
                <SelectTrigger
                  id="transaction-type-filter"
                  className="border border-border/60 bg-white text-right"
                  disabled={transactionTypeOptions.length === 0}
                >
                  <SelectValue placeholder="كل الأغراض" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">كل الأغراض</SelectItem>
                  {transactionTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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

      <main className="mx-auto w-full max-w-10xl px-4 pb-10 pt-6">
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

                {showEmptyState && emptyMessage && (
                  <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/95 px-4 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      <span>{emptyMessage}</span>
                    </div>
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
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-[800px] w-full text-right text-xs">
                          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                            <tr className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                              <th className="px-4 py-3">العقار</th>
                              <th className="px-4 py-3">الموقع</th>
                              <th className="px-4 py-3">السعر</th>
                              <th className="px-4 py-3">المساحة</th>
                              <th className="px-4 py-3">الغرف</th>
                              <th className="px-4 py-3">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredProperties.map((property) => {
                              const isFavourite = favoriteIds.includes(property.id);
                              const cityLabel = property.city.trim().length > 0 ? property.city : "غير محدد";
                              const addressLabel = property.address.trim().length > 0 ? property.address : "العنوان غير متوفر";

                              return (
                                <tr
                                  key={property.id}
                                  className="cursor-pointer transition-colors hover:bg-slate-50/50"
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
                                  <td className="px-4 py-3 text-xs text-slate-800 align-middle">
                                    <div className="flex items-center gap-3">
                                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                        {property.latitude !== null && property.longitude !== null ? (
                                          <Building2 className="h-4 w-4" />
                                        ) : (
                                          getPlaceholderLabel(property.title, property.city)
                                        )}
                                      </span>
                                      <span className="text-sm font-semibold text-slate-900">{property.title}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-slate-500">
                                      <MapPin size={12} />
                                      <span>{cityLabel}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-800 align-middle">
                                    <div className="text-slate-900">{cityLabel}</div>
                                    <div className="mt-1 text-slate-500">{addressLabel}</div>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-800 align-middle">
                                    <div className="text-emerald-600 font-semibold text-sm">
                                      {formatCurrency(property.price)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-800 align-middle">
                                    {property.areaSqm !== null
                                      ? `${property.areaSqm.toLocaleString("en-US")} م²`
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-800 align-middle">
                                    <div className="flex items-center gap-3 text-slate-900">
                                      <span className="flex items-center gap-1">
                                        <Bed size={12} />
                                        {property.bedrooms ?? "—"}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Bath size={12} />
                                        {property.bathrooms ?? "—"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-slate-800 align-middle">
                                    <div
                                      className="flex items-center justify-end gap-1"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <button
                                        className={`p-2 rounded-md transition-colors duration-150 ${
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
                                        className="p-2 rounded-md text-slate-600 transition-colors duration-150 hover:text-slate-800 hover:bg-slate-50"
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
