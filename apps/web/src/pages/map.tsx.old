import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  Component,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Ruler,
  SlidersHorizontal,
  RefreshCcw,
  Map as MapIcon,
  LayoutGrid,
  ChevronsUpDown,
  Check,
  Eye,
  Share2,
  Square,
  Sofa,
} from "lucide-react";

import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { GoogleMap, useLoadScript, Marker, MarkerClusterer, Polygon } from "@react-google-maps/api";
import { TABLE_STYLES, TYPOGRAPHY, BADGE_STYLES } from "@/config/platform-theme";

type Coordinates = [number, number];

const DEFAULT_CENTER: Coordinates = [24.7136, 46.6753];

type GoogleWindow = Window & typeof globalThis & { google?: typeof google };

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Wraps the interactive map in a React error boundary so a failure inside the
// Google Maps integration shows a friendly fallback instead of crashing the page.
class PropertiesMapErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('PropertiesMap Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-red-200 bg-red-50">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800">خطأ في تحميل الخريطة</h3>
            <p className="text-sm text-red-600 mt-2">
              حدث خطأ أثناء تحميل خريطة العقارات. يرجى إعادة تحميل الصفحة.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


// Converts our tuple based coordinate representation into the shape expected by
// the Google Maps SDK helpers.
const toLatLngLiteral = (point: Coordinates) => ({ lat: point[0], lng: point[1] });

interface ApiListing {
  id: string;
  title?: string | null;
  address?: string | null;
  city?: string | null;
  cityId?: number | null;
  region?: string | null;
  regionId?: number | null;
  district?: string | null;
  districtId?: number | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: number | null;
  squareFeet?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  type?: string | null;
  transactionType?: string | null;
  status?: string | null;
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
  cityId: number | null;
  region: string;
  regionId: number | null;
  district: string;
  districtId: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  latitude: number | null;
  longitude: number | null;
  propertyType: string;
  transactionType: string;
  status: string;
  photoUrls?: string[];
}

interface Option {
  id: string;
  label: string;
}

interface CityOption extends Option {
  regionId: string | null;
}

interface DistrictOption extends Option {
  cityId: string | null;
}

interface CityQuickFilterOption {
  key: string;
  label: string;
  count: number;
  mode: "city" | "search";
  value: string;
}

interface DistrictPolygonShape {
  id: string;
  name: string;
  paths: google.maps.LatLngLiteral[][];
  isFilterMatch: boolean;
}

interface RegionPayload {
  id: number;
  nameAr?: string | null;
  nameEn?: string | null;
}

interface CityPayload {
  id: number;
  regionId: number | null;
  nameAr?: string | null;
  nameEn?: string | null;
}

interface DistrictPayload {
  id: number;
  regionId: number | null;
  cityId: number | null;
  nameAr?: string | null;
  nameEn?: string | null;
  boundary?: unknown;
}

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText?: string;
  disabled?: boolean;
}

// Shared searchable dropdown used across filters. It wraps the cmdk based
// command palette components inside a popover to deliver an accessible combobox.
function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText = "لم يتم العثور على نتائج",
  disabled,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-2xl border border-border/60 bg-background/90 text-right font-normal",
            disabled && "opacity-70"
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>{
            selected ? selected.label : placeholder
          }</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="end">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="text-right" />
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{emptyText}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.id && <Check className="h-4 w-4 text-brand-600" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface FilterState {
  search: string;
  region: string;
  city: string;
  district: string;
  propertyType: string;
  transactionType: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  minBathrooms: string;
  minArea: string;
  maxArea: string;
  favoritesOnly: boolean;
}

// Central location for the "show everything" filter values so reset buttons can reuse it.
const DEFAULT_FILTERS: FilterState = {
  search: "",
  region: "all",
  city: "all",
  district: "all",
  propertyType: "all",
  transactionType: "all",
  minPrice: "",
  maxPrice: "",
  minBedrooms: "",
  minBathrooms: "",
  minArea: "",
  maxArea: "",
  favoritesOnly: false,
};

// Base zoom presets that drive how the map behaves when the selection changes.
const DEFAULT_ZOOM = 6;
const SINGLE_MARKER_ZOOM = 12;
const HIGHLIGHT_ZOOM = 14;
// Vector artwork that gives the Google marker clusters a branded appearance.
const clusterStyles = [
  {
    url: "data:image/svg+xml;charset=UTF-8,".concat(
      encodeURIComponent(
        `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" fill="#0f9d58" opacity="0.15"/>
          <circle cx="24" cy="24" r="16" fill="#0f9d58" opacity="0.3"/>
          <circle cx="24" cy="24" r="13" fill="#16a34a"/>
        </svg>`
      )
    ),
    width: 48,
    height: 48,
    textColor: "#ecfdf5",
    textSize: 12,
  },
  {
    url: "data:image/svg+xml;charset=UTF-8,".concat(
      encodeURIComponent(
        `<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="28" r="24" fill="#0f9d58" opacity="0.2"/>
          <circle cx="28" cy="28" r="19" fill="#0f9d58" opacity="0.35"/>
          <circle cx="28" cy="28" r="16" fill="#16a34a"/>
        </svg>`
      )
    ),
    width: 56,
    height: 56,
    textColor: "#ecfdf5",
    textSize: 13,
  },
  {
    url: "data:image/svg+xml;charset=UTF-8,".concat(
      encodeURIComponent(
        `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" fill="#0f9d58" opacity="0.25"/>
          <circle cx="32" cy="32" r="22" fill="#0f9d58" opacity="0.4"/>
          <circle cx="32" cy="32" r="18" fill="#16a34a"/>
        </svg>`
      )
    ),
    width: 64,
    height: 64,
    textColor: "#ecfdf5",
    textSize: 14,
  },
];

// Formats marker labels using English numerals so large values stay readable at small sizes.
const formatMarkerPrice = (value: number | null): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return value.toLocaleString("en-US");
};

// Simple escape to make sure we do not end up with invalid SVG when interpolating numbers.
const escapeSvgText = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Builds a dynamic SVG marker with a small pointer. Highlighted markers use a brighter palette.
const createMarkerIcon = (
  googleMaps: typeof google | undefined,
  formattedValue: string,
  isHighlighted: boolean
): google.maps.Icon | undefined => {
  if (!googleMaps?.maps) return undefined;

  const safeDigits = escapeSvgText(formattedValue);
  const width = Math.min(140, Math.max(72, safeDigits.length * 8 + 24));
  const height = 24;
  const pointerHeight = 8;
  const background = isHighlighted ? "#16a34a" : "#0f9d58";
  const border = isHighlighted ? "#bbf7d0" : "#86efac";

  const svg = `
    <svg width="${width}" height="${height + pointerHeight}" viewBox="0 0 ${width} ${height + pointerHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="rgba(15,23,42,0.3)" />
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <rect x="0" y="0" width="${width}" height="${height}" rx="12" fill="${background}" stroke="${border}" stroke-width="1.5"/>
        <text x="${width / 2}" y="${height / 2 + 3}" text-anchor="middle" font-family="'IBM Plex Sans', Arial, sans-serif" font-size="13" font-weight="600" letter-spacing="0.3" fill="#f8fafc">
          ${safeDigits}
        </text>
        <path d="M${width / 2 - 10} ${height} L${width / 2} ${height + pointerHeight} L${width / 2 + 10} ${height}" fill="${background}" stroke="${border}" stroke-width="1.5"/>
      </g>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    anchor: new googleMaps.maps.Point(width / 2, height + pointerHeight),
    scaledSize: new googleMaps.maps.Size(width, height + pointerHeight),
  };
};

// Accepts GeoJSON-ish coordinates and produces a `LatLngLiteral` the Google SDK understands.
// Handles both [lng, lat] (GeoJSON standard) and [lat, lng] formats, auto-detecting based on value ranges.
const toBoundaryLatLngLiteral = (point: unknown): google.maps.LatLngLiteral | null => {
  if (Array.isArray(point) && point.length >= 2) {
    const [first, second] = point;
    if (typeof first === "number" && typeof second === "number") {
      // Auto-detect coordinate order based on value ranges
      // Latitude must be between -90 and 90, longitude can be -180 to 180
      // For Saudi Arabia: lat ~16-32, lng ~34-55 (both positive)
      const absFirst = Math.abs(first);
      const absSecond = Math.abs(second);
      
      // If first value is outside latitude range, it must be longitude (GeoJSON format [lng, lat])
      if (absFirst > 90) {
        return { lat: second, lng: first };
      }
      // If second value is outside latitude range, first must be latitude ([lat, lng] format)
      if (absSecond > 90) {
        return { lat: first, lng: second };
      }
      // Both are in valid latitude range - check if values suggest Saudi Arabia coordinates
      // For Saudi: if first is 34-55 range and second is 16-32 range → [lng, lat] (GeoJSON)
      // If first is 16-32 range and second is 34-55 range → [lat, lng] (needs swap)
      if (first >= 30 && first <= 60 && second >= 10 && second <= 35) {
        // Likely GeoJSON format [lng, lat] for Saudi Arabia
        return { lat: second, lng: first };
      }
      if (first >= 10 && first <= 35 && second >= 30 && second <= 60) {
        // Likely [lat, lng] format - swap them
        return { lat: first, lng: second };
      }
      // Default to GeoJSON format [lng, lat] as it's the standard
      return { lat: second, lng: first };
    }
  }

  if (
    point &&
    typeof point === "object" &&
    "lat" in (point as Record<string, unknown>) &&
    "lng" in (point as Record<string, unknown>)
  ) {
    const { lat, lng } = point as { lat: unknown; lng: unknown };
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
    }
  }

  return null;
};

// Flattens GeoJSON polygon/multi-polygon rings into paths we can feed straight into the Polygon component.
const buildRingsFromCoordinates = (coords: unknown): google.maps.LatLngLiteral[][] => {
  if (!Array.isArray(coords) || coords.length === 0) return [];

  const first = coords[0];

  if (Array.isArray(first) && first.length >= 2 && typeof first[0] === "number" && typeof first[1] === "number") {
    const ring = (coords as unknown[])
      .map((point) => toBoundaryLatLngLiteral(point))
      .filter((point): point is google.maps.LatLngLiteral => Boolean(point));
    // Return the ring - coordinate order is handled by toBoundaryLatLngLiteral
    if (ring.length >= 3) {
      // Reverse ring to fix winding order if polygon appears upside-down
      // This ensures correct polygon orientation on the map
      return [[...ring].reverse()];
    }
    return [];
  }

  if (Array.isArray(first)) {
    return (coords as unknown[]).flatMap((ring) => buildRingsFromCoordinates(ring));
  }

  return [];
};

// Normalizes the variety of boundary payload shapes we can receive into a consistent array of paths.
const normalizeBoundaryToPolygon = (boundary: unknown): google.maps.LatLngLiteral[][] => {
  if (!boundary) return [];

  let data: unknown = boundary;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  if (Array.isArray(data)) {
    return buildRingsFromCoordinates(data);
  }

  if (typeof data === "object" && data !== null) {
    const geo = data as { type?: string; coordinates?: unknown };
    if (geo.coordinates) {
      return buildRingsFromCoordinates(geo.coordinates);
    }
  }

  return [];
};

// createInfoWindowContent function removed - no InfoWindow cards needed

// Attempts to sanitize and parse numeric values coming from different API fields or text boxes.
const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const sanitized = value.trim().replace(/[^\d.,-]/g, "").replace(/,/g, "");
    if (!sanitized) return null;
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const sqmFromSquareFeet = (squareFeet: number | null | undefined) =>
  squareFeet && squareFeet > 0 ? Math.round(squareFeet * 0.092903) : null;

// Formats currency values using SAR as the implicit currency.
const formatCurrency = (value: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
  }).format(value);
  return `${formatted} ريال`;
};

// Map property status to Tailwind badge classes
const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case "active":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "pending":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "sold":
      return "bg-green-100 text-green-800 border border-green-200";
    case "withdrawn":
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

// escapeHtml function removed - no InfoWindow cards needed

// Applies loose parsing rules to numbers typed into the filter inputs.
const parseFilterNumber = (value: string) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

interface FilterContentProps {
  filters: FilterState;
  regionOptions: Option[];
  cityOptions: CityOption[];
  districtOptions: DistrictOption[];
  propertyTypeOptions: string[];
  transactionTypeOptions: string[];
  onSearchChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onPropertyTypeChange: (value: string) => void;
  onTransactionTypeChange: (value: string) => void;
  onNumericChange: (key: keyof FilterState, value: string) => void;
  onFavoritesToggle: (value: boolean) => void;
  onReset: () => void;
  disableDistrictSelect?: boolean;
  isRegionLoading?: boolean;
  isCityLoading?: boolean;
  isDistrictLoading?: boolean;
}

function FilterContent({
  filters,
  regionOptions,
  cityOptions,
  districtOptions,
  propertyTypeOptions,
  transactionTypeOptions,
  onSearchChange,
  onRegionChange,
  onCityChange,
  onDistrictChange,
  onPropertyTypeChange,
  onTransactionTypeChange,
  onNumericChange,
  onFavoritesToggle,
  onReset,
  disableDistrictSelect,
  isRegionLoading,
  isCityLoading,
  isDistrictLoading,
}: FilterContentProps) {
  // Normalizes numeric inputs so we only store digits inside filter state. This
  // keeps validation simple while users type.
  const handleNumericChange = (key: keyof FilterState) => (event: ChangeEvent<HTMLInputElement>) => {
    onNumericChange(key, event.target.value.replace(/[^\d]/g, ""));
  };

  // Prepend the "all" option to every drop-down so the UI can clear a filter.
  const regionChoices = useMemo<Option[]>(
    () => [{ id: "all", label: "جميع المناطق" }, ...regionOptions],
    [regionOptions]
  );

  const cityChoices = useMemo<Option[]>(
    () => [{ id: "all", label: "جميع المدن" }, ...cityOptions],
    [cityOptions]
  );

  const districtChoices = useMemo<Option[]>(
    () => [{ id: "all", label: "جميع الأحياء" }, ...districtOptions],
    [districtOptions]
  );

  // Convert string based filter values into the shared Option shape used by the combobox.
  const propertyTypeChoices = useMemo<Option[]>(
    () => [
      { id: "all", label: "جميع الأنواع" },
      ...propertyTypeOptions.map((option) => ({ id: option, label: option })),
    ],
    [propertyTypeOptions]
  );

  const transactionTypeChoices = useMemo<Option[]>(
    () => [
      { id: "all", label: "جميع الخيارات" },
      ...transactionTypeOptions.map((option) => ({ id: option, label: option })),
    ],
    [transactionTypeOptions]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="search-input">البحث السريع</Label>
        <Input
          id="search-input"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث عن مدينة، حي أو اسم عقار"
          className="h-11 rounded-2xl border border-border/60 bg-background/90 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>المنطقة</Label>
          <SearchableCombobox
            value={filters.region}
            onChange={onRegionChange}
            options={regionChoices}
            placeholder="اختر المنطقة"
            searchPlaceholder="ابحث عن المنطقة..."
            emptyText={isRegionLoading ? "جار تحميل المناطق..." : "لم يتم العثور على منطقة"}
          />
        </div>

        <div className="space-y-2">
          <Label>المدينة</Label>
          <SearchableCombobox
            value={filters.city}
            onChange={onCityChange}
            options={cityChoices}
            placeholder="اختر المدينة"
            searchPlaceholder="ابحث عن المدينة..."
            emptyText={isCityLoading ? "جار تحميل المدن..." : "لم يتم العثور على مدينة"}
          />
        </div>

        <div className="space-y-2">
          <Label>الحي</Label>
          <SearchableCombobox
            value={filters.district}
            onChange={onDistrictChange}
            options={districtChoices}
            placeholder="اختر الحي"
            searchPlaceholder="ابحث عن الحي..."
            emptyText={isDistrictLoading ? "جار تحميل الأحياء..." : "لم يتم العثور على حي"}
            disabled={disableDistrictSelect}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>أدنى سعر (ريال)</Label>
          <Input
            inputMode="numeric"
            value={filters.minPrice}
            onChange={handleNumericChange("minPrice")}
            placeholder="مثال: 500000"
            className="h-11 rounded-2xl border border-border/60 bg-background/90"
          />
        </div>
        <div className="space-y-2">
          <Label>أعلى سعر (ريال)</Label>
          <Input
            inputMode="numeric"
            value={filters.maxPrice}
            onChange={handleNumericChange("maxPrice")}
            placeholder="مثال: 1500000"
            className="h-11 rounded-2xl border border-border/60 bg-background/90"
          />
        </div>
        <div className="space-y-2">
          <Label>أدنى مساحة (م²)</Label>
          <Input
            inputMode="numeric"
            value={filters.minArea}
            onChange={handleNumericChange("minArea")}
            placeholder="مثال: 120"
            className="h-11 rounded-2xl border border-border/60 bg-background/90"
          />
        </div>
        <div className="space-y-2">
          <Label>أعلى مساحة (م²)</Label>
          <Input
            inputMode="numeric"
            value={filters.maxArea}
            onChange={handleNumericChange("maxArea")}
            placeholder="مثال: 500"
            className="h-11 rounded-2xl border border-border/60 bg-background/90"
          />
        </div>
        <div className="space-y-2">
          <Label>أقل عدد غرف</Label>
          <Input
            inputMode="numeric"
            value={filters.minBedrooms}
            onChange={handleNumericChange("minBedrooms")}
            placeholder="مثال: 3"
            className="h-11 rounded-2xl border border-border/60 bg-background/90"
          />
        </div>
        <div className="space-y-2">
          <Label>أقل عدد دورات مياه</Label>
          <Input
            inputMode="numeric"
            value={filters.minBathrooms}
            onChange={handleNumericChange("minBathrooms")}
            placeholder="مثال: 2"
            className="h-11 rounded-2xl border border-border/60 bg-background/90"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>نوع العقار</Label>
        <SearchableCombobox
          value={filters.propertyType}
          onChange={onPropertyTypeChange}
          options={propertyTypeChoices}
          placeholder="حدد النوع"
          searchPlaceholder="ابحث عن نوع العقار..."
          emptyText="لا توجد أنواع مطابقة"
        />
      </div>

      <div className="space-y-2">
        <Label>نوع التعامل</Label>
        <SearchableCombobox
          value={filters.transactionType}
          onChange={onTransactionTypeChange}
          options={transactionTypeChoices}
          placeholder="حدد نوع التعامل"
          searchPlaceholder="ابحث عن نوع التعامل..."
          emptyText="لا توجد نتائج مطابقة"
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
        <label htmlFor="favorites-toggle" className="flex items-center gap-3">
          <Checkbox
            id="favorites-toggle"
            checked={filters.favoritesOnly}
            onCheckedChange={(checked) => onFavoritesToggle(checked === true)}
          />
          <span className="text-sm font-medium text-foreground">إظهار المفضلة فقط</span>
        </label>
        <Heart className="h-4 w-4 text-rose-500" />
      </div>

      <div className="flex items-center justify-end">
        <Button type="button" variant="ghost" onClick={onReset} className="gap-2 text-sm">
          <RefreshCcw className="h-4 w-4" />
          إعادة تعيين
        </Button>
      </div>
    </div>
  );
}

interface PropertiesMapProps {
  properties: PropertySummary[];
  highlightedId: string | null;
  onSelect: (property: PropertySummary) => void;
  onNavigate: (propertyId: string) => void;
  isClient: boolean;
  districtPolygon: DistrictPolygonShape | null;
}


// Renders the Google Map instance with clustered price markers and optional
// district polygons. All DOM access is gated behind `isClient` so SSR stays safe.
function PropertiesMap({ properties, highlightedId, onSelect, onNavigate, isClient, districtPolygon }: PropertiesMapProps) {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps script using the hook to prevent duplicate loads
  const { isLoaded, loadError: scriptLoadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey || "",
    language: "ar",
    region: "SA",
  });

  // Transform the current property collection into Google Maps marker metadata
  // while defensively skipping incomplete records.
  const markers = useMemo(() => {
    try {
      return properties
        .filter(
          (property) =>
            property &&
            typeof property.latitude === "number" &&
            typeof property.longitude === "number" &&
            !Number.isNaN(property.latitude) &&
            !Number.isNaN(property.longitude)
        )
        .map((property) => ({
          id: property.id,
          position: [property.latitude as number, property.longitude as number] as Coordinates,
          property,
        }));
    } catch (error) {
      console.error("Error creating markers:", error);
      return [];
    }
  }, [properties]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Opinionated map defaults that remove noisy controls while keeping the map interactive.
  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      controlSize: 28,
      disableDefaultUI: false,
      gestureHandling: "greedy",
      backgroundColor: "#f8fafc",
    }),
    []
  );

  // Custom cluster look and feel so nearby listings group together with branded styling.
  const clustererOptions = useMemo(
    () => ({
      styles: clusterStyles,
      minimumClusterSize: 2,
      maxZoom: 17,
      gridSize: 50,
      zoomOnClick: true,
      averageCenter: true,
    }),
    []
  );

  // Keeps the viewport focused on the active markers (and polygon if present). It
  // builds a LatLng bounds object and adjusts zoom/center depending on content.
  const fitMapToMarkers = useCallback(() => {
    if (typeof window === "undefined") return;
    const googleWindow = window as GoogleWindow;
    const map = mapRef.current;
    if (!map || !googleWindow.google?.maps) return;

    const bounds = new googleWindow.google.maps.LatLngBounds();
    let hasPoints = false;

    markers.forEach(({ position }) => {
      bounds.extend(toLatLngLiteral(position));
      hasPoints = true;
    });

    if (districtPolygon?.paths?.length) {
      districtPolygon.paths.forEach((ring) => {
        ring.forEach((point) => {
          bounds.extend(point);
          hasPoints = true;
        });
      });
    }

    if (!hasPoints) {
      map.setCenter(toLatLngLiteral(DEFAULT_CENTER));
      map.setZoom(DEFAULT_ZOOM);
      return;
    }

    if (markers.length === 1 && !districtPolygon?.paths?.length) {
      map.setCenter(toLatLngLiteral(markers[0].position));
      map.setZoom(SINGLE_MARKER_ZOOM);
      return;
    }

    const padding: google.maps.Padding = { top: 56, right: 56, bottom: 56, left: 56 };
    map.fitBounds(bounds, padding);
  }, [markers, districtPolygon]);

  // Cache the Google Map instance once it loads so we can imperatively adjust it later.
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      setIsMapReady(true);
      fitMapToMarkers();
    },
    [fitMapToMarkers]
  );

  // Clean up when the component unmounts so we do not hold on to stale references.
  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
    setIsMapReady(false);
  }, []);

  // Whenever the markers or SSR hydration state changes, refit the map so the
  // viewport stays aligned with the latest data.
  useEffect(() => {
    if (!isClient || !isMapReady) return;
    fitMapToMarkers();
  }, [fitMapToMarkers, isClient, isMapReady]);

  // Fly to the highlighted property so hovering the table keeps the map in sync.
  useEffect(() => {
    if (!isClient || !isMapReady || !highlightedId) return;
    const map = mapRef.current;
    if (!map) return;

    const markerInfo = markers.find((marker) => marker.id === highlightedId);
    if (!markerInfo) return;

    const target = toLatLngLiteral(markerInfo.position);
    map.panTo(target);

    const currentZoom = map.getZoom?.() ?? DEFAULT_ZOOM;
    if (currentZoom < HIGHLIGHT_ZOOM) {
      map.setZoom(HIGHLIGHT_ZOOM);
    }
  }, [highlightedId, markers, isClient, isMapReady]);

  const heightClass = "h-[calc(100vh-240px)] min-h-[520px]";
  const googleInstance = typeof window === "undefined" ? undefined : (window as GoogleWindow).google;

  // Ensure Google Maps API is fully loaded before rendering
  const isGoogleMapsReady = isLoaded && googleInstance?.maps;

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-border/60 bg-slate-100/70", heightClass)}>
      {!isClient ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          جار تجهيز الخريطة...
        </div>
      ) : !googleMapsApiKey ? (
        <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-destructive">
          يرجى ضبط المتغير <code className="mx-1 rounded bg-muted px-2 py-1 text-xs">VITE_GOOGLE_MAPS_API_KEY</code> لعرض الخريطة.
        </div>
      ) : scriptLoadError ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center text-sm text-destructive">
          <p>تعذر تحميل خريطة جوجل. يرجى المحاولة لاحقًا.</p>
          <p className="text-xs text-muted-foreground">حاول تحديث الصفحة أو التحقق من مفتاح Google Maps.</p>
        </div>
      ) : !isGoogleMapsReady ? (
        <div className="flex h-full w-full items-center justify-center bg-white/70 text-sm text-muted-foreground">
          جار تحميل خريطة جوجل...
        </div>
      ) : (
        <div className="relative h-full w-full">
          <GoogleMap
            mapContainerClassName="absolute inset-0 h-full w-full"
            options={mapOptions}
            onLoad={handleMapLoad}
            onUnmount={handleMapUnmount}
            center={toLatLngLiteral(DEFAULT_CENTER)}
            zoom={DEFAULT_ZOOM}
          >
            <MarkerClusterer options={clustererOptions}>
              {(clusterer) => (
                <>
                  {markers.map(({ id, position, property }) => (
                    <Marker
                      key={id}
                      position={toLatLngLiteral(position)}
                      icon={createMarkerIcon(
                        googleInstance,
                        formatMarkerPrice(property.price),
                        highlightedId === id
                      )}
                      clusterer={clusterer}
                      onClick={() => onSelect(property)}
                      onMouseOver={() => onSelect(property)}
                    />
                  ))}
                </>
              )}
            </MarkerClusterer>
            {districtPolygon?.paths?.length ? (
              <Polygon
                paths={districtPolygon.paths}
                options={{
                  strokeColor: districtPolygon.isFilterMatch ? "#1d4ed8" : "#0f9d58",
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  fillColor: districtPolygon.isFilterMatch ? "rgba(37,99,235,0.22)" : "rgba(16,185,129,0.18)",
                  fillOpacity: districtPolygon.isFilterMatch ? 0.3 : 0.18,
                  clickable: false,
                }}
              />
            ) : null}
          </GoogleMap>

          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-muted-foreground">
              جار تجهيز الخريطة...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PropertiesListProps {
  properties: PropertySummary[];
  favoriteIds: string[];
  highlightedId: string | null;
  onHighlight: (property: PropertySummary | null) => void;
  onToggleFavorite: (propertyId: string) => void;
  onNavigate: (propertyId: string) => void;
}

function PropertiesList({
  properties,
  favoriteIds,
  highlightedId,
  onHighlight,
  onToggleFavorite,
  onNavigate,
}: PropertiesListProps) {
  // Display a data-table view of the filtered properties matching the properties page table style.
  if (!properties.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center text-muted-foreground">
        <MapPin className="h-10 w-10 text-muted-foreground/50" />
        <p className="max-w-sm text-balance text-sm">
          لم يتم العثور على عقارات مطابقة للمعايير الحالية. حاول تعديل البحث أو إعادة تعيين عوامل التصفية.
        </p>
      </div>
    );
  }

  const shareProperty = (property: PropertySummary, platform: 'whatsapp' | 'twitter') => {
    const propertyUrl = `${window.location.origin}/home/platform/properties/${property.id}`;
    const shareText = `🏠 ${property.title}\n📍 ${property.address}, ${property.city}\n💰 ${formatCurrency(property.price)}\n\nاكتشف المزيد:`;
    
    let shareUrl = '';
    
    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${propertyUrl}`)}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(propertyUrl)}`;
    }
    
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm relative z-50">
      <table className={cn(TABLE_STYLES.container, "min-w-[900px] w-full text-right")}>
        <thead className={cn(TABLE_STYLES.header, "bg-gray-50 border-b border-gray-200")}>
          <tr className={cn(TABLE_STYLES.headerCell, "text-xs font-medium text-gray-700 uppercase tracking-wider")}>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-right")}>الصورة</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-right")}>العقار</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-right")}>الموقع</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-right")}>النوع</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-right")}>الحالة</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-right")}>السعر</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-right")}>المساحة</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-right")}>الغرف</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-right")}>الإجراءات</th>
          </tr>
        </thead>
        <tbody className={cn(TABLE_STYLES.body, "divide-y divide-gray-200")}>
          {properties.map((property) => {
            const isFavourite = favoriteIds.includes(property.id);
            const isActive = highlightedId === property.id;

            return (
              <tr
                key={property.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-slate-50/50",
                  isActive && "bg-slate-100"
                )}
                onMouseEnter={() => onHighlight(property)}
                onMouseLeave={() => onHighlight(null)}
                onClick={() => onNavigate(property.id)}
              >
                {/* Image */}
                <td className={cn(TABLE_STYLES.cell, "p-0 w-20 align-middle")}>
                  <div className="relative w-20 h-20 min-h-[80px]">
                    {property.photoUrls && property.photoUrls.length > 0 ? (
                      <img 
                        src={property.photoUrls[0]} 
                        alt={property.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.error('Image failed to load:', property.photoUrls?.[0], 'Property:', property.id, 'All photoUrls:', property.photoUrls);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </td>

                {/* Property */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                  <div className={cn(TYPOGRAPHY.body, "font-semibold text-gray-900 text-right")}>{property.title}</div>
                </td>

                {/* Location */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                  <div className={cn(TYPOGRAPHY.body, "text-gray-900 text-right")}>
                    {property.city}
                    {property.district && `, ${property.district}`}
                  </div>
                  <div className={cn("mt-1", TYPOGRAPHY.caption, "text-gray-600 text-right")}>{property.address}</div>
                </td>

                {/* Type */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                  <div className={cn(TYPOGRAPHY.body, "text-gray-900 text-right")}>{property.propertyType || property.transactionType || '-'}</div>
                </td>

                {/* Status */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                  {property.status && (
                    <span className={cn(BADGE_STYLES.base, getStatusBadgeClasses(property.status))}>
                      {property.status}
                    </span>
                  )}
                </td>

                {/* Price */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                  <div className={cn(TYPOGRAPHY.body, "font-semibold text-[rgb(128_193_165)] text-right")}>
                    {formatCurrency(property.price)}
                  </div>
                </td>

                {/* Area */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                  {property.areaSqm ? `${property.areaSqm.toLocaleString()} متر²` : '-'}
                </td>

                {/* Rooms */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                  <div className={cn("flex items-center gap-2", TYPOGRAPHY.body, "text-gray-900 text-right")}>
                    {property.bedrooms && (
                      <span className="flex items-center gap-1">
                        <Bed size={12} />
                        {property.bedrooms}
                      </span>
                    )}
                    {property.bathrooms && (
                      <span className="flex items-center gap-1">
                        <Bath size={12} />
                        {property.bathrooms}
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                  <div className="flex items-center justify-end gap-1 relative z-50" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={cn(
                        "p-2 rounded-md transition-colors duration-150 relative z-50",
                        isFavourite 
                          ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(property.id);
                      }}
                      title={isFavourite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                    >
                      <Heart size={14} className={isFavourite ? "fill-current" : ""} />
                    </button>
                    <button 
                      className="p-2 rounded-md text-slate-600 transition-colors duration-150 hover:text-slate-800 hover:bg-slate-50 relative z-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(property.id);
                      }}
                      title="عرض التفاصيل"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      className="p-2 rounded-md text-purple-600 transition-colors duration-150 hover:text-purple-800 hover:bg-purple-50 relative z-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareProperty(property, 'whatsapp');
                      }}
                      title="مشاركة العقار"
                    >
                      <Share2 size={14} />
                    </button>
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

export default function MapPage() {
  const [, navigate] = useLocation();

  // Centralized state for the entire map page including filters, favorites,
  // layout mode, and pagination.
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFavoritesDrawerOpen, setIsFavoritesDrawerOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25); // Fixed at 25 records per page
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Defer anything that relies on the `window` object until we know we are on the client.
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fetch the region/city hierarchy so the form drives the filter drop-downs.
  const regionsQuery = useQuery<RegionPayload[]>({
    queryKey: ["locations", "regions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations/regions");
      return (await response.json()) as RegionPayload[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const citiesQuery = useQuery<CityPayload[]>({
    queryKey: ["locations", "cities", filters.region],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.region !== "all") {
        params.set("regionId", filters.region);
      }
      const query = params.toString();
      const response = await apiRequest(
        "GET",
        `/api/locations/cities${query ? `?${query}` : ""}`
      );
      return (await response.json()) as CityPayload[];
    },
    staleTime: 30 * 60 * 1000,
  });

  // Load ALL listing data from the backend. We fetch all records and do client-side filtering/pagination.
  const listingsQuery = useQuery<ListingsResponse>({
    queryKey: ["public-property-search-all"],
    queryFn: async () => {
      // Fetch all records from database using pageSize=all
      const response = await apiRequest("GET", `/api/listings?page=1&pageSize=all`);
      const payload = (await response.json()) as ListingsResponse;
      return payload;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Flatten and sanitize the raw API payload into the `PropertySummary` shape
  // consumed by both the map and table views.
  const properties = useMemo<PropertySummary[]>(() => {
    if (!listingsQuery.data?.items) return [];

    return listingsQuery.data.items.map((item) => {
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
              if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
              }
              // If it's an array with items, return it
              if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
              }
            } catch (e) {
              // Ignore parsing errors
              console.warn('Failed to parse photos:', e);
            }
          }
          return undefined;
        })(),
      } satisfies PropertySummary;
    });
  }, [listingsQuery.data]);

  // Convert fetched regions into combobox-compatible options sorted alphabetically.
  const regionOptions = useMemo<Option[]>(() => {
    if (!regionsQuery.data) return [];
    return regionsQuery.data
      .map((region) => ({
        id: String(region.id),
        label: (region.nameAr ?? region.nameEn ?? `منطقة ${region.id}`).toString().trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [regionsQuery.data]);

  // Cities are filtered server-side by region, but we still normalize and sort them here.
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

  // Build unique property/transaction type pickers so filters stay relevant to the current dataset.
  // If a city is selected, only show property types available in that city (hierarchical filtering)
  const propertyTypeOptions = useMemo(() => {
    const set = new Set<string>();
    const cityId = filters.city !== "all" ? Number(filters.city) : null;
    const cityOption = filters.city !== "all" ? cityOptions.find(opt => opt.id === filters.city) : null;
    
    properties.forEach((property) => {
      // If city filter is active, only include properties from that city
      if (filters.city !== "all") {
        // Check by cityId first
        if (cityId !== null && Number.isFinite(cityId) && property.cityId !== null && property.cityId === cityId) {
          // Match by cityId
        } else if (cityOption && property.city?.toLowerCase().trim() === cityOption.label.toLowerCase().trim()) {
          // Match by city name
        } else {
          // Property doesn't match selected city, skip it
          return;
        }
      }
      
      // Add property type if property matches city filter
      if (property.propertyType) set.add(property.propertyType);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [properties, filters.city, cityOptions]);

  const transactionTypeOptions = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((property) => {
      if (property.transactionType) set.add(property.transactionType);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [properties]);

  // Applies all client-side filters on top of the paginated payload. Most of the
  // filters are simple equality checks, so we short-circuit early to keep it fast.
  const filteredProperties = useMemo(() => {
    const normalizedQuery = filters.search.trim().toLowerCase();
    const minPriceValue = parseFilterNumber(filters.minPrice);
    const maxPriceValue = parseFilterNumber(filters.maxPrice);
    const minBedroomsValue = parseFilterNumber(filters.minBedrooms);
    const minBathroomsValue = parseFilterNumber(filters.minBathrooms);
    const minAreaValue = parseFilterNumber(filters.minArea);
    const maxAreaValue = parseFilterNumber(filters.maxArea);

    return properties.filter((property) => {
      if (filters.favoritesOnly && !favoriteIds.includes(property.id)) {
        return false;
      }

      if (normalizedQuery) {
        const haystack = [property.title, property.city, property.region, property.district, property.address]
          .filter(Boolean)
          .map((value) => value.toLowerCase());
        const matches = haystack.some((value) => value.includes(normalizedQuery));
        if (!matches) return false;
      }

      if (filters.region !== "all") {
        const regionId = Number(filters.region);
        if (!Number.isFinite(regionId) || property.regionId !== regionId) {
          return false;
        }
      }

      if (filters.city !== "all") {
        const cityId = Number(filters.city);
        // Check by cityId if both are available
        if (Number.isFinite(cityId) && property.cityId !== null && property.cityId === cityId) {
          // Match found by cityId
        } else {
          // Fallback: check by city name if cityId doesn't match or is missing
          // Find the city option to get its name
          const cityOption = cityOptions.find(opt => opt.id === filters.city);
          if (cityOption) {
            // Compare by city name (case-insensitive)
            if (property.city?.toLowerCase().trim() !== cityOption.label.toLowerCase().trim()) {
              return false;
            }
          } else {
            // If city option not found, no match
            return false;
          }
        }
      }

      if (filters.district !== "all" && property.districtId !== filters.district) {
        return false;
      }

      if (filters.propertyType !== "all" && property.propertyType.toLowerCase() !== filters.propertyType.toLowerCase()) {
        return false;
      }

      if (
        filters.transactionType !== "all" &&
        property.transactionType.toLowerCase() !== filters.transactionType.toLowerCase()
      ) {
        return false;
      }

      if (minPriceValue !== null && (property.price === null || property.price < minPriceValue)) {
        return false;
      }

      if (maxPriceValue !== null && (property.price === null || property.price > maxPriceValue)) {
        return false;
      }

      if (minBedroomsValue !== null && (property.bedrooms === null || property.bedrooms < minBedroomsValue)) {
        return false;
      }

      if (minBathroomsValue !== null && (property.bathrooms === null || property.bathrooms < minBathroomsValue)) {
        return false;
      }

      if (minAreaValue !== null && (property.areaSqm === null || property.areaSqm < minAreaValue)) {
        return false;
      }

      if (maxAreaValue !== null && (property.areaSqm === null || property.areaSqm > maxAreaValue)) {
        return false;
      }

      return true;
    });
  }, [properties, filters, favoriteIds, cityOptions]);

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

  // Resolve the full property object for the active highlight so both views stay in sync.
  const highlightedProperty = useMemo(
    () => filteredProperties.find((property) => property.id === highlightedPropertyId) ?? null,
    [filteredProperties, highlightedPropertyId]
  );

  // Decide which city id to use when asking the API for district polygons. Preference goes to the filter.
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

  // Surface the top cities present in the base properties list as quick-action chips.
  // We use the base properties array (not filteredProperties) so the city filter buttons
  // always show all available cities, allowing users to filter by any city.
  const topCityFilters = useMemo<CityQuickFilterOption[]>(() => {
    if (!properties.length) return [];

    const counts = new Map<string, CityQuickFilterOption>();
    const cityMatchCache = new Map<string, string | null>();

    const resolveCityFilter = (cityName: string, cityId: number | null): { mode: "city" | "search"; value: string } => {
      if (typeof cityId === "number" && Number.isFinite(cityId)) {
        return { mode: "city", value: String(cityId) };
      }

      const cached = cityMatchCache.get(cityName);
      if (cached !== undefined) {
        return cached ? { mode: "city", value: cached } : { mode: "search", value: cityName };
      }

      const matchedOption = cityOptions.find((option) => option.label === cityName);
      if (matchedOption) {
        cityMatchCache.set(cityName, matchedOption.id);
        return { mode: "city", value: matchedOption.id };
      }

      cityMatchCache.set(cityName, null);
      return { mode: "search", value: cityName };
    };

    properties.forEach((property) => {
      const cityName = property.city?.trim();
      if (!cityName) return;

      const { mode, value } = resolveCityFilter(cityName, property.cityId);
      const key = `${mode}:${value}`;
      const existing = counts.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, {
          key,
          label: cityName,
          count: 1,
          mode,
          value,
        });
      }
    });

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [properties, cityOptions]);

  // Fetch districts (with polygon boundaries) that belong to the currently relevant city.
  const districtsQuery = useQuery<DistrictPayload[]>({
    queryKey: ["locations", "districts", boundaryCityId],
    queryFn: async () => {
      if (typeof boundaryCityId !== "number" || Number.isNaN(boundaryCityId)) {
        return [];
      }
      const response = await apiRequest(
        "GET",
        `/api/locations/districts?cityId=${boundaryCityId}&includeBoundary=true`
      );
      return (await response.json()) as DistrictPayload[];
    },
    enabled: typeof boundaryCityId === "number" && Number.isFinite(boundaryCityId),
    staleTime: 15 * 60 * 1000,
  });

  // Convert the district payload into combobox options so the UI can enable/disable selections.
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

  // If the selected city disappears because of an upstream filter change, reset it to "all".
  useEffect(() => {
    if (!citiesQuery.data) return;
    if (filters.city === "all") return;
    const hasSelectedCity = citiesQuery.data.some((city) => String(city.id) === filters.city);
    if (!hasSelectedCity) {
      setFilters((prev) => ({ ...prev, city: "all", district: "all" }));
    }
  }, [citiesQuery.data, filters.city]);

  // Keep the district selection in sync with the available options for the chosen city.
  useEffect(() => {
    if (filters.district === "all") return;
    if (!districtsQuery.data) return;
    const hasSelectedDistrict = districtsQuery.data.some((district) => String(district.id) === filters.district);
    if (!hasSelectedDistrict) {
      setFilters((prev) => ({ ...prev, district: "all" }));
    }
  }, [districtsQuery.data, filters.district]);

  // Chain region filter into the city options so the dropdown only shows valid choices.
  const filteredCityOptions = useMemo(() => {
    if (filters.region === "all") return cityOptions;
    return cityOptions.filter((city) => city.regionId === filters.region);
  }, [cityOptions, filters.region]);

  // Limit district options to the active city to avoid mismatched selections.
  const filteredDistrictOptions = useMemo(() => {
    if (filters.city === "all") return districtOptions;
    return districtOptions.filter((district) => district.cityId === filters.city);
  }, [districtOptions, filters.city]);

  // Prefer an explicit district filter, otherwise default to the highlighted property's district.
  const selectedDistrictId = filters.district !== "all" ? filters.district : highlightedProperty?.districtId ?? null;

  // Translate the stored GeoJSON boundary into Google Maps polygon paths so we can draw the district outline.
  const districtPolygon = useMemo<DistrictPolygonShape | null>(() => {
    if (!selectedDistrictId || !districtsQuery.data) return null;
    const district = districtsQuery.data.find((candidate) => String(candidate.id) === selectedDistrictId);
    if (!district?.boundary) return null;
    const paths = normalizeBoundaryToPolygon(district.boundary);
    if (!paths.length) return null;
    return {
      id: String(district.id),
      name: district.nameAr ?? district.nameEn ?? `حي ${district.id}`,
      paths,
      isFilterMatch: filters.district !== "all",
    };
  }, [districtsQuery.data, selectedDistrictId, filters.district]);

  // Convenience subset so the favourites drawer can display only saved items.
  const favoriteProperties = useMemo(
    () => properties.filter((property) => favoriteIds.includes(property.id)),
    [properties, favoriteIds]
  );

  // Automatically close the favourites drawer if the user removes everything.
  useEffect(() => {
    if (!favoriteIds.length) {
      setIsFavoritesDrawerOpen(false);
    }
  }, [favoriteIds]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.city, filters.region, filters.district, filters.propertyType, filters.transactionType, filters.search]);

  // Remove the highlight if the active property falls out of the filtered results.
  useEffect(() => {
    if (highlightedPropertyId && !filteredProperties.some((property) => property.id === highlightedPropertyId)) {
      setHighlightedPropertyId(null);
    }
  }, [filteredProperties, highlightedPropertyId]);

  // Default to the first mappable property so the map always has a point of focus.
  useEffect(() => {
    if (highlightedPropertyId) return;
    const firstWithCoordinates = filteredProperties.find(
      (property) => typeof property.latitude === "number" && typeof property.longitude === "number"
    );
    if (firstWithCoordinates) {
      setHighlightedPropertyId(firstWithCoordinates.id);
    }
  }, [filteredProperties, highlightedPropertyId]);

  // Toggles properties in the local favourites collection and opens the drawer for new additions.
  const handleFavoritesToggle = (propertyId: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(propertyId);
      const updated = exists ? prev.filter((id) => id !== propertyId) : [...prev, propertyId];
      if (!exists) {
        setIsFavoritesDrawerOpen(true);
      }
      return updated;
    });
  };

  // Use the SPA router to move into the detailed property page.
  const handleNavigate = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };

  // Mobile-first filter drawer trigger.
  const handleFilterToggle = () => {
    setIsFilterOpen(true);
  };

  // Reset every filter back to its defaults.
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Clicking one of the top-city chips either applies or clears that quick filter.
  const handleQuickCityFilter = (filter: CityQuickFilterOption) => {
    setViewMode("table");
    setCurrentPage(1);
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

  // Rendering helper that turns the quick filter data into pill buttons.
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

  // Count properties for each type (used in property type filters)
  // If a city is selected, only count properties in that city (hierarchical filtering)
  const propertyTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const cityId = filters.city !== "all" ? Number(filters.city) : null;
    const cityOption = filters.city !== "all" ? cityOptions.find(opt => opt.id === filters.city) : null;
    
    properties.forEach((property) => {
      // If city filter is active, only count properties from that city
      if (filters.city !== "all") {
        // Check by cityId first
        if (cityId !== null && Number.isFinite(cityId) && property.cityId !== null && property.cityId === cityId) {
          // Match by cityId
        } else if (cityOption && property.city?.toLowerCase().trim() === cityOption.label.toLowerCase().trim()) {
          // Match by city name
        } else {
          // Property doesn't match selected city, skip it
          return;
        }
      }
      
      // Count property type if property matches city filter
      if (property.propertyType) {
        counts.set(property.propertyType, (counts.get(property.propertyType) || 0) + 1);
      }
    });
    return counts;
  }, [properties, filters.city, cityOptions]);

  // Rendering helper for property type filters
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
                setCurrentPage(1);
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
                        properties={paginatedFilteredProperties}
                        favoriteIds={favoriteIds}
                        highlightedId={highlightedPropertyId}
                        onHighlight={(property) => setHighlightedPropertyId(property?.id ?? null)}
                        onToggleFavorite={handleFavoritesToggle}
                        onNavigate={handleNavigate}
                      />
                      
                      {/* Pagination Controls */}
                      {totalItems > 0 && (
                        <div className="flex items-center justify-between border-t border-border/60 pt-4">
                          <div className="text-sm text-muted-foreground">
                            عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalItems)} من {totalItems} نتيجة
                          </div>
                          
                          {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-3 text-xs"
                              >
                                السابق
                              </Button>
                              
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  const pageNum = i + 1;
                                  const isActive = pageNum === currentPage;
                                  
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={isActive ? "default" : "ghost"}
                                      size="sm"
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`h-8 w-8 p-0 text-xs ${isActive ? 'bg-brand-600 text-white' : ''}`}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                                
                                {totalPages > 5 && (
                                  <>
                                    <span className="text-xs text-muted-foreground">...</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCurrentPage(totalPages)}
                                      className="h-8 w-8 p-0 text-xs"
                                    >
                                      {totalPages}
                                    </Button>
                                  </>
                                )}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
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
