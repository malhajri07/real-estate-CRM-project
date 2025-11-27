/**
 * types.ts - Map Page Type Definitions
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → types.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Type definitions for the Map page. Defines:
 * - Map-related interfaces and types
 * - Property types
 * - Filter types
 * 
 * Related Files:
 * - apps/web/src/pages/map/index.tsx - Map page uses these types
 */

/**
 * Type definitions for the Map page
 */

export type Coordinates = [number, number];

export interface ApiListing {
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
  propertyType?: string | null;
  listings?: Array<{ id: string; price: number | null | undefined }>;
  photoUrls?: string[];
}

export interface ListingsResponse {
  items: ApiListing[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PropertySummary {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  cityId: number | null;
  region: string | null;
  regionId: number | null;
  district: string | null;
  districtId: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  latitude: number | null;
  longitude: number | null;
  propertyType: string | null;
  transactionType: string | null;
  status: string | null;
  photoUrls?: string[];
}

export interface Option {
  id: string;
  label: string;
}

export interface CityOption extends Option {
  regionId: string | null;
}

export interface DistrictOption extends Option {
  cityId: string | null;
}

export interface CityQuickFilterOption {
  key: string;
  label: string;
  count: number;
  mode: "city" | "search";
  value: string;
}

// Type alias to avoid circular reference issues
type LatLngLiteral = { lat: number; lng: number };

export interface DistrictPolygonShape {
  paths: LatLngLiteral[][];
  isFilterMatch: boolean;
}

export interface RegionPayload {
  id: number;
  nameAr?: string | null;
  nameEn?: string | null;
}

export interface CityPayload {
  id: number;
  regionId: number | null;
  nameAr?: string | null;
  nameEn?: string | null;
}

export interface DistrictPayload {
  id: number;
  regionId: number | null;
  cityId: number | null;
  nameAr?: string | null;
  nameEn?: string | null;
  boundary?: unknown;
}

export interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText?: string;
  disabled?: boolean;
}

export interface FilterState {
  search: string;
  region: string;
  city: string;
  district: string;
  propertyType: string;
  transactionType: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  maxBedrooms: string;
  minBathrooms: string;
  maxBathrooms: string;
  minArea: string;
  maxArea: string;
  favoritesOnly: boolean;
}

export interface FilterContentProps {
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
  disableDistrictSelect: boolean;
  isRegionLoading: boolean;
  isCityLoading: boolean;
  isDistrictLoading: boolean;
}

export interface PropertiesMapProps {
  properties: PropertySummary[];
  highlightedId: string | null;
  onSelect: (property: PropertySummary) => void;
  onNavigate: (propertyId: string) => void;
  isClient: boolean;
  districtPolygon: DistrictPolygonShape | null;
}

export interface PropertiesListProps {
  properties: PropertySummary[];
  favoriteIds: string[];
  highlightedId: string | null;
  onHighlight: (property: PropertySummary | null) => void;
  onToggleFavorite: (propertyId: string) => void;
  onNavigate: (propertyId: string) => void;
}

export type GoogleWindow = Window & typeof globalThis & { google?: typeof google };

