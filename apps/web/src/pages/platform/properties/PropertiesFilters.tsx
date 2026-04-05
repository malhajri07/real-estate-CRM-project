/**
 * PropertiesFilters.tsx — Full-featured filter Sheet (side drawer)
 *
 * Organized into sections: Basic, Location, Specs, Price, Regulatory, Display.
 * Uses DropdownMenu instead of Select to avoid scroll-lock layout shift.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ChevronDown, X, SlidersHorizontal, Building2, MapPin, Bed, Bath,
  Maximize, Banknote, ArrowUpDown, Image as ImageIcon, ShieldCheck,
  Compass, FileText, Calendar, Sofa, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Filter Options ─────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "ACTIVE", label: "متاح" },
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "SOLD", label: "مباع" },
  { value: "RENTED", label: "مؤجر" },
  { value: "WITHDRAWN", label: "مسحوب" },
];

const LISTING_TYPE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
];

const FACADE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "NORTH", label: "شمال" },
  { value: "SOUTH", label: "جنوب" },
  { value: "EAST", label: "شرق" },
  { value: "WEST", label: "غرب" },
  { value: "NORTH_EAST", label: "شمال شرق" },
  { value: "NORTH_WEST", label: "شمال غرب" },
  { value: "SOUTH_EAST", label: "جنوب شرق" },
  { value: "SOUTH_WEST", label: "جنوب غرب" },
];

const LEGAL_STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "FREE", label: "صك حر" },
  { value: "MORTGAGED", label: "مرهون" },
  { value: "UNDER_DISPUTE", label: "تحت النزاع" },
  { value: "ENDOWMENT", label: "وقف" },
];

const FURNISHED_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "furnished", label: "مفروش" },
  { value: "semi_furnished", label: "مفروش جزئياً" },
  { value: "unfurnished", label: "بدون أثاث" },
];

const BEDROOM_OPTIONS = [
  { value: "any", label: "أي عدد" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
  { value: "6", label: "6+" },
];

const BATHROOM_OPTIONS = [
  { value: "any", label: "أي عدد" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "price-low", label: "السعر (الأقل)" },
  { value: "price-high", label: "السعر (الأعلى)" },
  { value: "bedrooms", label: "عدد الغرف" },
  { value: "size", label: "المساحة" },
];

const IMAGE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "with-images", label: "بصور" },
  { value: "without-images", label: "بدون صور" },
];

// ── Types ──────────────────────────────────────────────────────────────────

export interface PropertiesFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Existing filters
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  propertyTypeFilter: string;
  onPropertyTypeFilterChange: (value: string) => void;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  imageAvailabilityFilter: string;
  onImageAvailabilityFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  minBedrooms: string;
  onMinBedroomsChange: (value: string) => void;
  // New filters
  listingTypeFilter: string;
  onListingTypeFilterChange: (value: string) => void;
  districtFilter: string;
  onDistrictFilterChange: (value: string) => void;
  minBathrooms: string;
  onMinBathroomsChange: (value: string) => void;
  minArea: string;
  onMinAreaChange: (value: string) => void;
  maxArea: string;
  onMaxAreaChange: (value: string) => void;
  facadeFilter: string;
  onFacadeFilterChange: (value: string) => void;
  legalStatusFilter: string;
  onLegalStatusFilterChange: (value: string) => void;
  maxBuildingAge: string;
  onMaxBuildingAgeChange: (value: string) => void;
  hasServicesFilter: string[];
  onHasServicesFilterChange: (value: string[]) => void;
  // Data
  uniqueCities: string[];
  uniqueDistricts: string[];
  uniquePropertyTypes: string[];
  activeFilterCount: number;
  onResetFilters: () => void;
}

// ── Dropdown helper ────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon?: any;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between h-9 text-sm font-normal">
            {selected?.label || "اختر"}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <DropdownMenuItem key={opt.value} onClick={() => onChange(opt.value)} className={cn(opt.value === value && "font-bold text-primary")}>
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PropertiesFilters(props: PropertiesFiltersProps) {
  const {
    open, onOpenChange,
    statusFilter, onStatusFilterChange,
    propertyTypeFilter, onPropertyTypeFilterChange,
    listingTypeFilter, onListingTypeFilterChange,
    cityFilter, onCityFilterChange,
    districtFilter, onDistrictFilterChange,
    imageAvailabilityFilter, onImageAvailabilityFilterChange,
    sortBy, onSortByChange,
    minPrice, onMinPriceChange,
    maxPrice, onMaxPriceChange,
    minBedrooms, onMinBedroomsChange,
    minBathrooms, onMinBathroomsChange,
    minArea, onMinAreaChange,
    maxArea, onMaxAreaChange,
    facadeFilter, onFacadeFilterChange,
    legalStatusFilter, onLegalStatusFilterChange,
    maxBuildingAge, onMaxBuildingAgeChange,
    hasServicesFilter, onHasServicesFilterChange,
    uniqueCities, uniqueDistricts, uniquePropertyTypes,
    activeFilterCount, onResetFilters,
  } = props;

  const SERVICES = [
    { key: "electricity", label: "كهرباء" },
    { key: "water", label: "مياه" },
    { key: "sewage", label: "صرف صحي" },
    { key: "gas", label: "غاز" },
    { key: "fiber", label: "ألياف بصرية" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            فلاتر البحث
            {activeFilterCount > 0 && (
              <Badge variant="default" className="text-xs px-2">{activeFilterCount}</Badge>
            )}
          </SheetTitle>
          <SheetDescription>تصفية العقارات حسب المواصفات والموقع والتنظيمية</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* ── Section 1: Basic ──────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">أساسي</p>
            <FilterDropdown label="الحالة" icon={Building2} value={statusFilter} options={STATUS_OPTIONS} onChange={onStatusFilterChange} />
            <FilterDropdown
              label="نوع العقار"
              icon={Building2}
              value={propertyTypeFilter}
              options={[{ value: "all", label: "كل الأنواع" }, ...uniquePropertyTypes.map((t) => ({ value: t, label: t }))]}
              onChange={onPropertyTypeFilterChange}
            />
            <FilterDropdown label="نوع الإعلان" value={listingTypeFilter} options={LISTING_TYPE_OPTIONS} onChange={onListingTypeFilterChange} />
            <FilterDropdown label="الترتيب" icon={ArrowUpDown} value={sortBy} options={SORT_OPTIONS} onChange={onSortByChange} />
          </div>

          <Separator />

          {/* ── Section 2: Location ───────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> الموقع</p>
            <FilterDropdown
              label="المدينة"
              icon={MapPin}
              value={cityFilter}
              options={[{ value: "all", label: "كل المدن" }, ...uniqueCities.map((c) => ({ value: c, label: c }))]}
              onChange={onCityFilterChange}
            />
            <FilterDropdown
              label="الحي"
              icon={MapPin}
              value={districtFilter}
              options={[{ value: "all", label: "كل الأحياء" }, ...uniqueDistricts.map((d) => ({ value: d, label: d }))]}
              onChange={onDistrictFilterChange}
            />
            <FilterDropdown label="واجهة العقار" icon={Compass} value={facadeFilter} options={FACADE_OPTIONS} onChange={onFacadeFilterChange} />
          </div>

          <Separator />

          {/* ── Section 3: Specifications ─────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> المواصفات</p>
            <div className="grid grid-cols-2 gap-3">
              <FilterDropdown label="غرف النوم" icon={Bed} value={minBedrooms} options={BEDROOM_OPTIONS} onChange={onMinBedroomsChange} />
              <FilterDropdown label="الحمامات" icon={Bath} value={minBathrooms} options={BATHROOM_OPTIONS} onChange={onMinBathroomsChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Maximize className="h-3.5 w-3.5" /> المساحة من (م²)</Label>
                <Input type="number" placeholder="0" value={minArea} onChange={(e) => onMinAreaChange(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">المساحة إلى (م²)</Label>
                <Input type="number" placeholder="∞" value={maxArea} onChange={(e) => onMaxAreaChange(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> عمر المبنى (أقل من سنوات)</Label>
              <Input type="number" placeholder="مثال: 10" value={maxBuildingAge} onChange={(e) => onMaxBuildingAgeChange(e.target.value)} className="h-9" />
            </div>
          </div>

          <Separator />

          {/* ── Section 4: Price ──────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /> السعر</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">من</Label>
                <Input type="number" placeholder="0" value={minPrice} onChange={(e) => onMinPriceChange(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">إلى</Label>
                <Input type="number" placeholder="∞" value={maxPrice} onChange={(e) => onMaxPriceChange(e.target.value)} className="h-9" />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Section 5: Regulatory (REGA) ──────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> التنظيمية (REGA)</p>
            <FilterDropdown label="الحالة القانونية" icon={FileText} value={legalStatusFilter} options={LEGAL_STATUS_OPTIONS} onChange={onLegalStatusFilterChange} />
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> الخدمات المتوفرة</Label>
              <div className="flex flex-wrap gap-3">
                {SERVICES.map((svc) => {
                  const checked = hasServicesFilter.includes(svc.key);
                  return (
                    <label key={svc.key} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          onHasServicesFilterChange(
                            c ? [...hasServicesFilter, svc.key] : hasServicesFilter.filter((s) => s !== svc.key)
                          );
                        }}
                      />
                      <span className="text-xs">{svc.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Section 6: Display ────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> العرض</p>
            <FilterDropdown label="توفر الصور" icon={ImageIcon} value={imageAvailabilityFilter} options={IMAGE_OPTIONS} onChange={onImageAvailabilityFilterChange} />
          </div>
        </div>

        <SheetFooter className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1 gap-1.5" onClick={onResetFilters}>
            <X className="h-4 w-4" />
            إعادة تعيين
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            عرض النتائج
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
