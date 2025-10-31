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
import { GoogleMap, LoadScript, Marker, MarkerClusterer, Polygon } from "@react-google-maps/api";

type Coordinates = [number, number];

const DEFAULT_CENTER: Coordinates = [24.7136, 46.6753];
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

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
const toBoundaryLatLngLiteral = (point: unknown): google.maps.LatLngLiteral | null => {
  if (Array.isArray(point) && point.length >= 2) {
    const [lng, lat] = point;
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
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
    return ring.length >= 3 ? [ring] : [];
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
  const [loadError, setLoadError] = useState<string | null>(null);
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
      ) : loadError ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center text-sm text-destructive">
          <p>{loadError}</p>
          <p className="text-xs text-muted-foreground">حاول تحديث الصفحة أو التحقق من مفتاح Google Maps.</p>
        </div>
      ) : (
        <LoadScript
          id={GOOGLE_MAPS_SCRIPT_ID}
          googleMapsApiKey={googleMapsApiKey}
          language="ar"
          region="SA"
          loadingElement={
            <div className="flex h-full w-full items-center justify-center bg-white/70 text-sm text-muted-foreground">
              جار تحميل خريطة جوجل...
            </div>
          }
          onError={() => setLoadError("تعذر تحميل خريطة جوجل. يرجى المحاولة لاحقًا.")}
          onLoad={() => setLoadError(null)}
        >
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
        </LoadScript>
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
  // Display a data-table view of the filtered properties. Hovering rows wires
  // back into the map and favourite state to keep the experiences connected.
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-emerald-100 bg-emerald-25/60 shadow-[0_25px_70px_rgba(16,185,129,0.12)]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-emerald-50/40 to-emerald-50/70">
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-900/95">العقار</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-900/95">الموقع</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-900/95">النوع</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-900/95">السعر</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-900/95">الغرف</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-900/95">دورات المياه</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-900/95">المساحة</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-900/95">الحالة</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-900/95">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property, index) => {
            const isFavourite = favoriteIds.includes(property.id);
            const isActive = highlightedId === property.id;

            return (
              <tr
                key={property.id}
                className={cn(
                  "border-b border-emerald-50/70 transition-all duration-200 hover:bg-emerald-50/60 hover:shadow-sm",
                  isActive && "bg-emerald-100/60 ring-2 ring-emerald-200 shadow-md",
                  index % 2 === 0 ? "bg-white/70" : "bg-white/95"
                )}
                onMouseEnter={() => onHighlight(property)}
                onMouseLeave={() => onHighlight(null)}
              >
                {/* Property Title and ID */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleFavorite(property.id)}
                      className={cn(
                        "h-6 w-6 rounded-full border border-emerald-200 bg-white/80 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50",
                        isFavourite && "border-emerald-500 bg-emerald-100 text-emerald-600"
                      )}
                    >
                      <Heart className={cn("h-3 w-3", isFavourite ? "fill-emerald-500 text-emerald-500" : "text-emerald-400")} />
                      <span className="sr-only">إضافة إلى المفضلة</span>
                    </Button>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-brand-900 truncate">{property.title}</div>
                      <div className="text-[10px] text-brand-500">#{property.id}</div>
                    </div>
                  </div>
                </td>

                {/* Location */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-emerald-900 truncate">
                        {property.city ? `${property.city}${property.region ? `، ${property.region}` : ""}` : property.region}
                      </div>
                      {property.district && (
                        <div className="text-[10px] text-emerald-600 truncate">{property.district}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Property Type */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {property.propertyType && (
                      <Badge variant="outline" className="text-[10px] w-fit border-emerald-200 text-emerald-800 bg-emerald-50 px-1 py-0">{property.propertyType}</Badge>
                    )}
                    {property.transactionType && (
                      <Badge variant="outline" className="text-[10px] w-fit border-lime-200 text-lime-800 bg-lime-50 px-1 py-0">{property.transactionType}</Badge>
                    )}
                  </div>
                </td>

                {/* Price */}
                <td className="px-4 py-3">
                  <div className="text-sm font-bold" style={{ color: 'hsl(152 76% 32%)' }}>
                    {formatCurrency(property.price)}
                  </div>
                </td>

                {/* Bedrooms */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs">
                    <Bed className="h-3 w-3 text-emerald-500" />
                    <span className="font-semibold text-emerald-900">{property.bedrooms ?? "—"}</span>
                  </div>
                </td>

                {/* Bathrooms */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs">
                    <Bath className="h-3 w-3 text-emerald-500" />
                    <span className="font-semibold text-emerald-900">{property.bathrooms ?? "—"}</span>
                  </div>
                </td>

                {/* Area */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs">
                    <Ruler className="h-3 w-3 text-emerald-500" />
                    <span className="font-semibold text-emerald-900">{property.areaSqm ? `${property.areaSqm} م²` : "—"}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {property.status && (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 px-1 py-0">
                      {property.status}
                    </Badge>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 transition-all duration-200 font-medium text-xs px-2 py-1 h-6"
                    onClick={() => onNavigate(property.id)}
                  >
                    عرض التفاصيل
                  </Button>
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

  // Load paginated listing data from the backend. We keep pagination state on
  // the client, and enrich the raw payload later before rendering.
  const listingsQuery = useQuery<ListingsResponse>({
    queryKey: ["public-property-search", currentPage, pageSize],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/listings?page=${currentPage}&pageSize=${pageSize}`);
      const payload = (await response.json()) as ListingsResponse;
      return payload;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Sync pagination totals whenever the listings query returns new data.
  useEffect(() => {
    if (listingsQuery.data) {
      setTotalItems(listingsQuery.data.total || 0);
      setTotalPages(listingsQuery.data.totalPages || 0);
    }
  }, [listingsQuery.data]);

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
  const propertyTypeOptions = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((property) => {
      if (property.propertyType) set.add(property.propertyType);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [properties]);

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

      if (filters.region !== "all" && property.regionId !== Number(filters.region)) {
        return false;
      }

      if (filters.city !== "all" && property.cityId !== Number(filters.city)) {
        return false;
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
  }, [properties, filters, favoriteIds]);

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

  // Surface the top cities present in the filtered list as quick-action chips.
  const topCityFilters = useMemo<CityQuickFilterOption[]>(() => {
    if (!filteredProperties.length) return [];

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

    filteredProperties.forEach((property) => {
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
  }, [filteredProperties, cityOptions]);

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
      };
    });
  };

  // Rendering helper that turns the quick filter data into pill buttons.
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
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-7 rounded-full border border-border/60 bg-white/90 px-3 text-xs"
              onClick={() => handleQuickCityFilter(city)}
            >
              <span className="font-semibold text-foreground">{city.label}</span>
              <span className="text-muted-foreground">({city.count})</span>
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
              <Card className="rounded-3xl border border-emerald-100 bg-white shadow-xl">
                <CardHeader className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
                  <div className="w-full space-y-2">
                    <div>
                      <CardTitle className="text-xl">قائمة العقارات</CardTitle>
                      <CardDescription>
                        {listingsQuery.isLoading 
                          ? "جار تحميل العقارات..." 
                          : `تم العثور على ${totalItems} عقار مطابق للبحث. (صفحة ${currentPage} من ${totalPages})`
                        }
                      </CardDescription>
                    </div>
                    {renderQuickCityFilters()}
                  </div>
                  {!listingsQuery.isLoading && (
                    <div className="text-sm text-muted-foreground">
                      إجمالي النتائج المتاحة: {listingsQuery.data?.total ?? filteredProperties.length}
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
                        properties={filteredProperties}
                        favoriteIds={favoriteIds}
                        highlightedId={highlightedPropertyId}
                        onHighlight={(property) => setHighlightedPropertyId(property?.id ?? null)}
                        onToggleFavorite={handleFavoritesToggle}
                        onNavigate={handleNavigate}
                      />
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border/60 pt-4">
                          <div className="text-sm text-muted-foreground">
                            عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalItems)} من {totalItems} نتيجة
                          </div>
                          
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
                    {renderQuickCityFilters()}
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
          "fixed inset-y-0 left-0 z-50 w-full max-w-sm transform border-r border-emerald-100 bg-white shadow-[0_25px_70px_rgba(16,185,129,0.18)] transition-transform duration-300 ease-in-out md:rounded-r-3xl",
          isFavoritesDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-label="المفضلات"
      >
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/70 px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700">المفضلة</p>
            <p className="text-sm font-semibold text-emerald-900">{favoriteIds.length} عقار محفوظ</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-emerald-700 hover:bg-emerald-100"
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
                  className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-25/60 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-emerald-900">{property.title}</p>
                      <p className="text-xs text-emerald-700">
                        {property.city ? `${property.city}${property.region ? `، ${property.region}` : ""}` : property.region}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                      onClick={() => handleFavoritesToggle(property.id)}
                    >
                      <Heart className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                      <span className="sr-only">إزالة من المفضلة</span>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-emerald-800">
                    <span className="font-semibold" style={{ color: "hsl(152 76% 32%)" }}>
                      {formatCurrency(property.price)}
                    </span>
                    <span className="text-emerald-600">{property.areaSqm ? `${property.areaSqm} م²` : "—"}</span>
                    <span className="text-emerald-600">{property.bedrooms ?? "—"} غرف</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
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
                setFilters((prev) => ({ ...prev, region: value, city: "all", district: "all" }));
              }}
              onCityChange={(value) => setFilters((prev) => ({ ...prev, city: value, district: "all" }))}
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
