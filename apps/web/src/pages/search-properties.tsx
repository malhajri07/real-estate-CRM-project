import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import type { LatLngTuple, DivIcon } from "leaflet";
import { LatLngBounds, divIcon } from "leaflet";
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

const DEFAULT_CENTER: LatLngTuple = [24.7136, 46.6753];
const LEAFLET_CSS_ID = "leaflet-css";

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

const ensureLeafletStyles = () => {
  if (typeof window === "undefined") return;
  if (document.getElementById(LEAFLET_CSS_ID)) return;

  const link = document.createElement("link");
  link.id = LEAFLET_CSS_ID;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
};

interface LeafletMapContainerProps {
  center: LatLngTuple;
  zoom?: number;
  zoomControl?: boolean;
  className?: string;
  scrollWheelZoom?: boolean;
  preferCanvas?: boolean;
  children?: ReactNode;
}

interface LeafletTileLayerProps {
  url: string;
  attribution?: string;
  children?: ReactNode;
}

interface LeafletMarkerProps {
  position: LatLngTuple;
  icon?: DivIcon;
  eventHandlers?: {
    click?: () => void;
    mouseover?: () => void;
  };
  children?: ReactNode;
  key?: string;
}

const LeafletMapContainer = MapContainer as unknown as ComponentType<LeafletMapContainerProps>;
const LeafletTileLayer = TileLayer as unknown as ComponentType<LeafletTileLayerProps>;
const LeafletMarker = Marker as unknown as ComponentType<LeafletMarkerProps>;

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

const formatCurrency = (value: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(value);
};

const currencyCompactFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  minimumFractionDigits: 0,
  notation: "compact",
});

const formatCurrencyCompact = (value: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "سعر غير متاح";
  return currencyCompactFormatter.format(value);
};

const escapeHtml = (value: string | null | undefined) => {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

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
  const handleNumericChange = (key: keyof FilterState) => (event: ChangeEvent<HTMLInputElement>) => {
    onNumericChange(key, event.target.value.replace(/[^\d]/g, ""));
  };

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

interface AutoFocusProps {
  points: LatLngTuple[];
  fallbackCenter: LatLngTuple;
}

function MapAutoFocus({ points, fallbackCenter }: AutoFocusProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (!points.length) {
      map.setView(fallbackCenter, 6);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    const bounds = new LatLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, points, fallbackCenter]);

  return null;
}

interface HighlightFocusProps {
  point: LatLngTuple | null;
}

function MapHighlightFocus({ point }: HighlightFocusProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !point) return;
    const currentZoom = map.getZoom();
    map.flyTo(point, currentZoom < 14 ? 14 : currentZoom, { duration: 0.6 });
  }, [map, point]);

  return null;
}

const createPropertyMarkerIcon = (property: PropertySummary, isHighlighted: boolean): DivIcon => {
  const background = isHighlighted ? "rgba(37, 99, 235, 0.95)" : "rgba(15, 23, 42, 0.9)";
  const border = isHighlighted ? "rgba(191, 219, 254, 0.8)" : "rgba(148, 163, 184, 0.45)";
  const price = escapeHtml(formatCurrencyCompact(property.price));
  const location = escapeHtml(property.city ?? property.region ?? "");
  const type = escapeHtml(property.propertyType ?? "");

  return divIcon({
    className: "property-map-marker",
    iconAnchor: [56, 58],
    popupAnchor: [0, -48],
    html: `
      <div style="position:relative;display:flex;flex-direction:column;gap:6px;min-width:132px;padding:12px 16px;border-radius:20px;background:${background};color:#fff;box-shadow:0 18px 35px rgba(15,23,42,0.25);border:1px solid ${border};">
        <span style="font-size:14px;font-weight:700;letter-spacing:0.2px;">${price}</span>
        ${location ? `<span style="font-size:12px;font-weight:500;opacity:0.85;">${location}</span>` : ""}
        ${type ? `<span style='font-size:11px;font-weight:500;opacity:0.75;'>${type}</span>` : ""}
        <span style="position:absolute;left:50%;bottom:-16px;transform:translateX(-50%);width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:16px solid ${background};filter:drop-shadow(0 6px 6px rgba(15,23,42,0.25));"></span>
      </div>
    `,
  });
};

interface PropertiesMapProps {
  properties: PropertySummary[];
  highlightedId: string | null;
  onSelect: (property: PropertySummary) => void;
  onNavigate: (propertyId: string) => void;
  isClient: boolean;
}

function PropertiesMap({ properties, highlightedId, onSelect, onNavigate, isClient }: PropertiesMapProps) {
  const markers = useMemo(
    () =>
      properties
        .filter((property) => typeof property.latitude === "number" && typeof property.longitude === "number")
        .map((property) => ({
          id: property.id,
          position: [property.latitude as number, property.longitude as number] as LatLngTuple,
          property,
        })),
    [properties]
  );

  const activeProperty = useMemo(
    () =>
      highlightedId
        ? markers.find((marker) => marker.id === highlightedId)?.property ?? null
        : markers.length
          ? markers[0].property
          : null,
    [highlightedId, markers]
  );

  const activePoint = useMemo(() => {
    if (!activeProperty || typeof activeProperty.latitude !== "number" || typeof activeProperty.longitude !== "number") {
      return null;
    }
    return [activeProperty.latitude, activeProperty.longitude] as LatLngTuple;
  }, [activeProperty]);

  const fallbackCenter = markers.length ? markers[0].position : DEFAULT_CENTER;
  const heightClass = "h-[640px] lg:h-[720px]";

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-border/60 bg-slate-100/70", heightClass)}>
      {isClient ? (
        <div className="relative h-full w-full">
          <LeafletMapContainer
            center={fallbackCenter}
            zoom={6}
            zoomControl={false}
            className="absolute inset-0"
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
            preferCanvas
          >
            <LeafletTileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />
            <ZoomControl position="topright" />
            <MapAutoFocus points={markers.map((marker) => marker.position)} fallbackCenter={fallbackCenter} />
            <MapHighlightFocus point={activePoint} />
            {markers.map(({ id, position, property }) => {
              const isHighlighted = highlightedId === id;
              return (
                <LeafletMarker
                  key={id}
                  position={position}
                  icon={createPropertyMarkerIcon(property, isHighlighted)}
                  eventHandlers={{
                    click: () => onSelect(property),
                    mouseover: () => onSelect(property),
                  }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-slate-900">{property.title}</p>
                      <p className="text-muted-foreground">{property.city || property.region}</p>
                      <p className="font-medium text-brand-600">{formatCurrency(property.price)}</p>
                    </div>
                  </Popup>
                </LeafletMarker>
              );
            })}
          </LeafletMapContainer>

          {activeProperty && (
            <div className="pointer-events-none absolute inset-x-3 bottom-4 z-[401] sm:inset-x-6 md:inset-x-auto md:right-6 md:max-w-sm">
              <div className="pointer-events-auto space-y-3 rounded-3xl border border-border/60 bg-white/95 p-4 shadow-2xl backdrop-blur">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {activeProperty.transactionType || "عرض"}
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">
                    {activeProperty.title || "عقار بدون عنوان"}
                  </h3>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-brand-600" />
                    <span>
                      {activeProperty.city
                        ? `${activeProperty.city}${activeProperty.region ? `، ${activeProperty.region}` : ""}`
                        : activeProperty.region}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-brand-50/80 px-4 py-2">
                  <span className="text-sm font-medium text-brand-700">السعر</span>
                  <span className="text-lg font-semibold text-brand-600">
                    {formatCurrency(activeProperty.price)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-col items-center gap-1 rounded-2xl border border-border/40 bg-muted/30 px-2 py-2">
                    <Bed className="h-4 w-4 text-brand-600" />
                    <span className="font-semibold text-foreground">
                      {activeProperty.bedrooms ?? "—"}
                    </span>
                    <span>غرف</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-2xl border border-border/40 bg-muted/30 px-2 py-2">
                    <Bath className="h-4 w-4 text-brand-600" />
                    <span className="font-semibold text-foreground">
                      {activeProperty.bathrooms ?? "—"}
                    </span>
                    <span>دورات مياه</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-2xl border border-border/40 bg-muted/30 px-2 py-2">
                    <Ruler className="h-4 w-4 text-brand-600" />
                    <span className="font-semibold text-foreground">
                      {activeProperty.areaSqm ?? "—"}
                    </span>
                    <span>م²</span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  className="w-full rounded-2xl"
                  onClick={() => onNavigate(activeProperty.id)}
                >
                  عرض التفاصيل كاملة
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          جار تجهيز الخريطة...
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
    <div className="grid gap-4 lg:grid-cols-2">
      {properties.map((property) => {
        const isFavourite = favoriteIds.includes(property.id);
        const isActive = highlightedId === property.id;

        return (
          <Card
            key={property.id}
            className={cn(
              "group relative flex h-full flex-col justify-between border border-border/60 bg-white/90 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl",
              isActive && "ring-2 ring-brand-500"
            )}
            onMouseEnter={() => onHighlight(property)}
            onMouseLeave={() => onHighlight(null)}
          >
            <CardHeader className="flex flex-col gap-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {property.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {property.city ? `${property.city}${property.region ? `، ${property.region}` : ""}` : property.region}
                    </span>
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleFavorite(property.id)}
                  className={cn(
                    "rounded-full border border-border/60 bg-white/70 transition",
                    isFavourite && "border-rose-500 bg-rose-50"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isFavourite ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
                  <span className="sr-only">إضافة إلى المفضلة</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                {property.propertyType && <Badge variant="outline">{property.propertyType}</Badge>}
                {property.transactionType && <Badge variant="info">{property.transactionType}</Badge>}
                {property.status && <Badge variant="secondary">{property.status}</Badge>}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-0">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between text-lg font-semibold text-brand-600">
                  <span>السعر</span>
                  <span>{formatCurrency(property.price)}</span>
                </div>
                {property.address && (
                  <p className="text-sm text-muted-foreground">{property.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-muted/10 px-3 py-2">
                  <Bed className="h-4 w-4 text-brand-600" />
                  <span className="font-medium text-foreground">{property.bedrooms ?? "—"}</span>
                  <span className="text-xs">غرف</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-muted/10 px-3 py-2">
                  <Bath className="h-4 w-4 text-brand-600" />
                  <span className="font-medium text-foreground">{property.bathrooms ?? "—"}</span>
                  <span className="text-xs">دورات مياه</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-muted/10 px-3 py-2">
                  <Ruler className="h-4 w-4 text-brand-600" />
                  <span className="font-medium text-foreground">{property.areaSqm ?? "—"}</span>
                  <span className="text-xs">م²</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-muted/10 px-3 py-2">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  <span className="font-medium text-foreground">
                    {property.district || "—"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  رقم العقار: <span className="font-semibold text-foreground">{property.id}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-2xl border-brand-500 text-brand-600 hover:bg-brand-50"
                  onClick={() => onNavigate(property.id)}
                >
                  عرض التفاصيل
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function SearchProperties() {
  const [, navigate] = useLocation();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    ensureLeafletStyles();
    setIsClient(true);
  }, []);

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

  const districtsQuery = useQuery<DistrictPayload[]>({
    queryKey: ["locations", "districts", filters.city],
    queryFn: async () => {
      const cityId = Number(filters.city);
      if (!Number.isFinite(cityId)) {
        return [];
      }
      const response = await apiRequest(
        "GET",
        `/api/locations/districts?cityId=${cityId}`
      );
      return (await response.json()) as DistrictPayload[];
    },
    enabled: filters.city !== "all",
    staleTime: 15 * 60 * 1000,
  });

  const listingsQuery = useQuery<ListingsResponse>({
    queryKey: ["public-property-search"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/listings?pageSize=200");
      const payload = (await response.json()) as ListingsResponse;
      return payload;
    },
    staleTime: 5 * 60 * 1000,
  });

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

  const regionOptions = useMemo<Option[]>(() => {
    if (!regionsQuery.data) return [];
    return regionsQuery.data
      .map((region) => ({
        id: String(region.id),
        label: (region.nameAr ?? region.nameEn ?? `منطقة ${region.id}`).toString().trim(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [regionsQuery.data]);

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

  useEffect(() => {
    if (!citiesQuery.data) return;
    if (filters.city === "all") return;
    const hasSelectedCity = citiesQuery.data.some((city) => String(city.id) === filters.city);
    if (!hasSelectedCity) {
      setFilters((prev) => ({ ...prev, city: "all", district: "all" }));
    }
  }, [citiesQuery.data, filters.city]);

  useEffect(() => {
    if (filters.district === "all") return;
    if (!districtsQuery.data) return;
    const hasSelectedDistrict = districtsQuery.data.some((district) => String(district.id) === filters.district);
    if (!hasSelectedDistrict) {
      setFilters((prev) => ({ ...prev, district: "all" }));
    }
  }, [districtsQuery.data, filters.district]);

  const filteredCityOptions = useMemo(() => {
    if (filters.region === "all") return cityOptions;
    return cityOptions.filter((city) => city.regionId === filters.region);
  }, [cityOptions, filters.region]);

  const filteredDistrictOptions = useMemo(() => {
    if (filters.city === "all") return districtOptions;
    return districtOptions.filter((district) => district.cityId === filters.city);
  }, [districtOptions, filters.city]);

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

  useEffect(() => {
    if (highlightedPropertyId && !filteredProperties.some((property) => property.id === highlightedPropertyId)) {
      setHighlightedPropertyId(null);
    }
  }, [filteredProperties, highlightedPropertyId]);

  useEffect(() => {
    if (highlightedPropertyId) return;
    const firstWithCoordinates = filteredProperties.find(
      (property) => typeof property.latitude === "number" && typeof property.longitude === "number"
    );
    if (firstWithCoordinates) {
      setHighlightedPropertyId(firstWithCoordinates.id);
    }
  }, [filteredProperties, highlightedPropertyId]);

  const handleFavoritesToggle = (propertyId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
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

  return (
    <div className="min-h-screen bg-slate-100/60">
      <Header title="استكشف العقارات" showSearch={false} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-full border-border/70 bg-white/90"
                onClick={handleFilterToggle}
              >
                <SlidersHorizontal className="h-4 w-4" />
                فتح عوامل التصفية
              </Button>

              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-white/90 p-1 shadow-sm">
                <Button
                  type="button"
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => setViewMode("map")}
                >
                  <MapIcon className="h-4 w-4" />
                  عرض الخريطة
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  عرض القائمة
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={filters.favoritesOnly ? "default" : "outline"}
                className="gap-2 rounded-full border-border/70 bg-white/90"
                onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
              >
                <Heart className="h-4 w-4" />
                المفضلة فقط
              </Button>
              <Button type="button" variant="ghost" className="gap-2 text-sm" onClick={handleReset}>
                <RefreshCcw className="h-4 w-4" />
                إعادة تعيين الكل
              </Button>
            </div>
          </div>

          <section className="space-y-6">
            {viewMode === "table" ? (
              <Card className="rounded-3xl border border-border/60 bg-white/95 shadow-xl">
                <CardHeader className="flex flex-col gap-2 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">قائمة العقارات</CardTitle>
                    <CardDescription>تم العثور على {filteredProperties.length} عقار مطابق للبحث.</CardDescription>
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
                    <PropertiesList
                      properties={filteredProperties}
                      favoriteIds={favoriteIds}
                      highlightedId={highlightedPropertyId}
                      onHighlight={(property) => setHighlightedPropertyId(property?.id ?? null)}
                      onToggleFavorite={handleFavoritesToggle}
                      onNavigate={handleNavigate}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-3xl border border-border/60 bg-white/95 shadow-2xl">
                <CardHeader className="flex flex-col gap-2 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">خريطة العقارات</CardTitle>
                    <CardDescription>استكشف العقارات على خريطة تفاعلية بتجربة مماثلة لخريطة عقار.</CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {filteredProperties.filter((property) => property.latitude && property.longitude).length} عقار على الخريطة
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <PropertiesMap
                    properties={filteredProperties}
                    highlightedId={highlightedPropertyId}
                    onSelect={(property) => setHighlightedPropertyId(property.id)}
                    onNavigate={handleNavigate}
                    isClient={isClient}
                  />
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>

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
