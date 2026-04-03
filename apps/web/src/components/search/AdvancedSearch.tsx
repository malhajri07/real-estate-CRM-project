/**
 * AdvancedSearch.tsx - Advanced Search & Filter Component
 *
 * Location: apps/web/src/ -> Components/ -> search/ -> AdvancedSearch.tsx
 *
 * Reusable advanced search panel used across property listings, leads,
 * deals, and other list-based pages. Features:
 * - Debounced search input
 * - Removable filter chips
 * - Collapsible filter panel with date range, multi-selects, price range, checkboxes
 * - Active filter count badge
 * - Clear all / save search / export buttons
 *
 * Dependencies:
 * - @/hooks/useDebounce
 * - @/hooks/useFilters
 * - @/components/ui/* (Input, Button, Badge, Checkbox, Popover, Calendar)
 * - lucide-react icons
 * - date-fns for date formatting
 */

import React, { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Save,
  Download,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { BORDER_RADIUS, SPACING } from "@/config/design-tokens";
import { CARD_STYLES } from "@/config/platform-theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterOption {
  /** Machine-readable value */
  value: string;
  /** Human-readable label */
  label: string;
}

export interface ActiveFilter {
  /** Filter key identifier */
  key: string;
  /** Display label for the filter */
  label: string;
  /** Display value */
  displayValue: string;
}

export interface AdvancedSearchProps {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Current search query (controlled) */
  query?: string;
  /** Called with the debounced search query */
  onQueryChange?: (query: string) => void;
  /** Debounce delay in ms (default 300) */
  debounceMs?: number;

  // -- Filter panel options --
  /** Available status options for multi-select */
  statusOptions?: FilterOption[];
  /** Currently selected statuses */
  selectedStatuses?: string[];
  /** Called when statuses change */
  onStatusChange?: (statuses: string[]) => void;

  /** Available city options for multi-select */
  cityOptions?: FilterOption[];
  /** Currently selected cities */
  selectedCities?: string[];
  /** Called when cities change */
  onCityChange?: (cities: string[]) => void;

  /** Date range filter value */
  dateRange?: DateRange;
  /** Called when date range changes */
  onDateRangeChange?: (range: DateRange | undefined) => void;

  /** Minimum price */
  priceMin?: number;
  /** Maximum price */
  priceMax?: number;
  /** Called when price range changes */
  onPriceRangeChange?: (min: number, max: number) => void;

  /** Available property type options for checkbox group */
  propertyTypeOptions?: FilterOption[];
  /** Currently selected property types */
  selectedPropertyTypes?: string[];
  /** Called when property types change */
  onPropertyTypeChange?: (types: string[]) => void;

  /** Active filter chips (if managed externally) */
  activeFilters?: ActiveFilter[];
  /** Called when a filter chip is removed */
  onRemoveFilter?: (key: string) => void;
  /** Called when "Clear all" is clicked */
  onClearAll?: () => void;
  /** Number of active filters (if managed externally; otherwise computed) */
  activeFilterCount?: number;

  /** Called when "Save search" is clicked */
  onSaveSearch?: () => void;
  /** Called when "Export" is clicked */
  onExport?: () => void;

  /** Additional className for the root element */
  className?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterChip({
  label,
  displayValue,
  onRemove,
}: {
  label: string;
  displayValue: string;
  onRemove: () => void;
}) {
  return (
    <Badge variant="secondary" className="gap-1.5 pe-1.5 ps-2.5 py-1 text-xs font-medium">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{displayValue}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ms-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
        aria-label={`إزالة فلتر ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

function MultiSelectGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PriceRangeInputs({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const [localMin, setLocalMin] = useState(String(min || ""));
  const [localMax, setLocalMax] = useState(String(max || ""));

  const handleBlur = () => {
    const parsedMin = Number(localMin) || 0;
    const parsedMax = Number(localMax) || 0;
    onChange(parsedMin, parsedMax);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        نطاق السعر
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="الحد الأدنى"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onBlur={handleBlur}
          className="flex-1"
          min={0}
        />
        <span className="text-muted-foreground text-sm">-</span>
        <Input
          type="number"
          placeholder="الحد الأقصى"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={handleBlur}
          className="flex-1"
          min={0}
        />
      </div>
    </div>
  );
}

function PropertyTypeCheckboxes({
  options,
  selected,
  onChange,
}: {
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        نوع العقار
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <Checkbox
              checked={selected.includes(option.value)}
              onCheckedChange={() => toggle(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AdvancedSearch({
  placeholder = "بحث...",
  query: controlledQuery,
  onQueryChange,
  debounceMs = 300,

  statusOptions = [],
  selectedStatuses = [],
  onStatusChange,

  cityOptions = [],
  selectedCities = [],
  onCityChange,

  dateRange,
  onDateRangeChange,

  priceMin = 0,
  priceMax = 0,
  onPriceRangeChange,

  propertyTypeOptions = [],
  selectedPropertyTypes = [],
  onPropertyTypeChange,

  activeFilters: externalFilters,
  onRemoveFilter,
  onClearAll,
  activeFilterCount: externalCount,

  onSaveSearch,
  onExport,

  className,
}: AdvancedSearchProps) {
  const [internalQuery, setInternalQuery] = useState(controlledQuery ?? "");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const query = controlledQuery !== undefined ? controlledQuery : internalQuery;
  const debouncedQuery = useDebounce(query, debounceMs);

  // Fire callback when debounced value changes
  useEffect(() => {
    onQueryChange?.(debouncedQuery);
  }, [debouncedQuery, onQueryChange]);

  // Sync controlled query
  useEffect(() => {
    if (controlledQuery !== undefined) {
      setInternalQuery(controlledQuery);
    }
  }, [controlledQuery]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (controlledQuery === undefined) {
        setInternalQuery(value);
      }
      // Immediate (non-debounced) update for controlled mode
      if (controlledQuery !== undefined) {
        onQueryChange?.(value);
      }
    },
    [controlledQuery, onQueryChange],
  );

  const handleClearQuery = useCallback(() => {
    setInternalQuery("");
    onQueryChange?.("");
  }, [onQueryChange]);

  // Compute active filter count
  const computedCount =
    externalCount ??
    [
      selectedStatuses.length > 0,
      selectedCities.length > 0,
      dateRange?.from != null,
      priceMin > 0 || priceMax > 0,
      selectedPropertyTypes.length > 0,
    ].filter(Boolean).length;

  // Build internal chip list when external is not provided
  const chips: ActiveFilter[] =
    externalFilters ??
    [
      selectedStatuses.length > 0
        ? { key: "status", label: "الحالة", displayValue: selectedStatuses.join(", ") }
        : null,
      selectedCities.length > 0
        ? { key: "city", label: "المدينة", displayValue: selectedCities.join(", ") }
        : null,
      dateRange?.from
        ? {
            key: "dateRange",
            label: "التاريخ",
            displayValue: `${format(dateRange.from, "dd/MM/yyyy")}${dateRange.to ? ` - ${format(dateRange.to, "dd/MM/yyyy")}` : ""}`,
          }
        : null,
      priceMin > 0 || priceMax > 0
        ? {
            key: "price",
            label: "السعر",
            displayValue: `${priceMin.toLocaleString()} - ${priceMax.toLocaleString()} ر.س`,
          }
        : null,
      selectedPropertyTypes.length > 0
        ? { key: "propertyType", label: "نوع العقار", displayValue: selectedPropertyTypes.join(", ") }
        : null,
    ].filter(Boolean) as ActiveFilter[];

  const handleRemoveChip = useCallback(
    (key: string) => {
      if (onRemoveFilter) {
        onRemoveFilter(key);
        return;
      }
      switch (key) {
        case "status":
          onStatusChange?.([]);
          break;
        case "city":
          onCityChange?.([]);
          break;
        case "dateRange":
          onDateRangeChange?.(undefined);
          break;
        case "price":
          onPriceRangeChange?.(0, 0);
          break;
        case "propertyType":
          onPropertyTypeChange?.([]);
          break;
      }
    },
    [onRemoveFilter, onStatusChange, onCityChange, onDateRangeChange, onPriceRangeChange, onPropertyTypeChange],
  );

  const handleClearAll = useCallback(() => {
    if (onClearAll) {
      onClearAll();
      return;
    }
    handleClearQuery();
    onStatusChange?.([]);
    onCityChange?.([]);
    onDateRangeChange?.(undefined);
    onPriceRangeChange?.(0, 0);
    onPropertyTypeChange?.([]);
  }, [onClearAll, handleClearQuery, onStatusChange, onCityChange, onDateRangeChange, onPriceRangeChange, onPropertyTypeChange]);

  const hasFilters = chips.length > 0 || query.length > 0;
  const hasFilterOptions =
    statusOptions.length > 0 ||
    cityOptions.length > 0 ||
    propertyTypeOptions.length > 0 ||
    onDateRangeChange != null ||
    onPriceRangeChange != null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search bar row */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            className="pe-10"
          />
          {query && (
            <button
              type="button"
              onClick={handleClearQuery}
              className="absolute start-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
              aria-label="مسح البحث"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        {hasFilterOptions && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={cn("gap-1.5 relative", isPanelOpen && "bg-primary/5 border-primary/30")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>فلترة</span>
            {isPanelOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {computedCount > 0 && (
              <span className="absolute -top-1.5 -start-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {computedCount}
              </span>
            )}
          </Button>
        )}

        {/* Save search */}
        {onSaveSearch && (
          <Button variant="outline" size="sm" onClick={onSaveSearch} className="gap-1.5">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">حفظ البحث</span>
          </Button>
        )}

        {/* Export */}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">تصدير</span>
          </Button>
        )}
      </div>

      {/* Filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              displayValue={chip.displayValue}
              onRemove={() => handleRemoveChip(chip.key)}
            />
          ))}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              مسح الكل
            </Button>
          )}
        </div>
      )}

      {/* Collapsible filter panel */}
      {isPanelOpen && hasFilterOptions && (
        <div
          className={cn(
            CARD_STYLES,
            SPACING.cardPadding,
            "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in slide-in-from-top-2 duration-200",
          )}
        >
          {/* Date range */}
          {onDateRangeChange && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                نطاق التاريخ
              </Label>
              <DateRangePicker
                value={dateRange}
                onValueChange={onDateRangeChange}
                placeholder="اختر نطاق التاريخ"
              />
            </div>
          )}

          {/* Status multi-select */}
          {statusOptions.length > 0 && onStatusChange && (
            <MultiSelectGroup
              label="الحالة"
              options={statusOptions}
              selected={selectedStatuses}
              onChange={onStatusChange}
            />
          )}

          {/* City multi-select */}
          {cityOptions.length > 0 && onCityChange && (
            <MultiSelectGroup
              label="المدينة"
              options={cityOptions}
              selected={selectedCities}
              onChange={onCityChange}
            />
          )}

          {/* Price range */}
          {onPriceRangeChange && (
            <PriceRangeInputs
              min={priceMin}
              max={priceMax}
              onChange={onPriceRangeChange}
            />
          )}

          {/* Property type checkboxes */}
          {propertyTypeOptions.length > 0 && onPropertyTypeChange && (
            <PropertyTypeCheckboxes
              options={propertyTypeOptions}
              selected={selectedPropertyTypes}
              onChange={onPropertyTypeChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default AdvancedSearch;
