import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PropertiesFiltersProps {
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
  uniqueCities: string[];
  uniquePropertyTypes: string[];
  onResetFilters: () => void;
}

export default function PropertiesFilters({
  statusFilter,
  onStatusFilterChange,
  propertyTypeFilter,
  onPropertyTypeFilterChange,
  cityFilter,
  onCityFilterChange,
  imageAvailabilityFilter,
  onImageAvailabilityFilterChange,
  sortBy,
  onSortByChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  minBedrooms,
  onMinBedroomsChange,
  uniqueCities,
  uniquePropertyTypes,
  onResetFilters,
}: PropertiesFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">فلاتر البحث</h3>
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            إعادة تعيين
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 transform-none">
          <div className="space-y-2">
            <Label>الحالة</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">متاح</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="sold">مباع</SelectItem>
                <SelectItem value="withdrawn">مسحوب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>نوع العقار</Label>
            <Select value={propertyTypeFilter} onValueChange={onPropertyTypeFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {uniquePropertyTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>المدينة</Label>
            <Select value={cityFilter} onValueChange={onCityFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المدن</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>توفر الصور</Label>
            <Select value={imageAvailabilityFilter} onValueChange={onImageAvailabilityFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العقارات</SelectItem>
                <SelectItem value="with-images">عقارات مزودة بالصور</SelectItem>
                <SelectItem value="without-images">عقارات بدون صور</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ترتيب حسب</Label>
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="oldest">الأقدم</SelectItem>
                <SelectItem value="price-low">السعر (من الأقل)</SelectItem>
                <SelectItem value="price-high">السعر (من الأعلى)</SelectItem>
                <SelectItem value="bedrooms">عدد الغرف</SelectItem>
                <SelectItem value="size">المساحة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>السعر الأدنى</Label>
            <Input type="number" placeholder="0" value={minPrice} onChange={(e) => onMinPriceChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>السعر الأعلى</Label>
            <Input type="number" placeholder="1000000" value={maxPrice} onChange={(e) => onMaxPriceChange(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>الحد الأدنى للغرف</Label>
            <Select value={minBedrooms} onValueChange={onMinBedroomsChange}>
              <SelectTrigger>
                <SelectValue placeholder="أي عدد" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="any">أي عدد</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
