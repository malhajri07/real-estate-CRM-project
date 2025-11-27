/**
 * FilterContent.tsx - Filter Content Component
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → components/ → FilterContent.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Filter sidebar/form component. Renders:
 * - Search and filter controls
 * - Filter sidebar
 * - Filter state management
 * 
 * Related Files:
 * - apps/web/src/pages/map/index.tsx - Map page
 * - apps/web/src/pages/map/hooks/useMapFilters.ts - Filters hook
 */

/**
 * FilterContent Component
 * 
 * Renders the filter sidebar/form with all search and filter controls.
 */

import { useMemo, type ChangeEvent } from "react";
import { Heart, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableCombobox } from "./SearchableCombobox";
import type { FilterContentProps, Option } from "../types";

export function FilterContent({
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
  // Normalizes numeric inputs so we only store digits inside filter state
  const handleNumericChange = (key: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
    onNumericChange(key, event.target.value.replace(/[^\d]/g, ""));
  };

  // Prepend the "all" option to every drop-down so the UI can clear a filter
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

  // Convert string based filter values into the shared Option shape used by the combobox
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

