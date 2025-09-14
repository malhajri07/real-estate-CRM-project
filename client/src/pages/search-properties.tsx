/**
 * client/src/pages/search-properties.tsx - Property Search Page
 * 
 * This page provides a comprehensive property search interface that uses the backend
 * database for all property data. It includes:
 * - Search filters and sorting options
 * - Property grid display
 * - Pagination
 * - Real-time search results
 * 
 * Dependencies:
 * - React hooks for state management
 * - TanStack Query for data fetching
 * - Shadcn UI components for interface
 * - Backend API for property data
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Filter, MapPin, Bed, Bath, Square, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PhotoCarousel } from "@/components/ui/photo-carousel";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Property } from "@shared/types";

interface SearchFilters {
  query: string;
  type: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  sortBy: string;
}

export default function SearchProperties() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    type: "",
    city: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    bathrooms: "",
    sortBy: "newest"
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch properties from backend database
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ["properties", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.query) params.append("search", filters.query);
      if (filters.type) params.append("type", filters.type);
      if (filters.city) params.append("city", filters.city);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
      if (filters.bathrooms) params.append("bathrooms", filters.bathrooms);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);

      const response = await apiRequest(`/api/listings?${params.toString()}`);
      return response.data || [];
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      type: "",
      city: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      bathrooms: "",
      sortBy: "newest"
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">خطأ في تحميل البيانات</h2>
          <p className="text-muted-foreground">حدث خطأ أثناء تحميل العقارات. يرجى المحاولة مرة أخرى.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100" dir="rtl">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">البحث في العقارات</h1>
          <p className="text-muted-foreground">ابحث عن العقار المناسب لك من قاعدة البيانات</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="ابحث عن عقار، مدينة، أو نوع العقار..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange("query", e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                فلاتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                فلاتر البحث
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  مسح الفلاتر
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">نوع العقار</label>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الأنواع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع الأنواع</SelectItem>
                      <SelectItem value="apartment">شقة</SelectItem>
                      <SelectItem value="villa">فيلا</SelectItem>
                      <SelectItem value="house">منزل</SelectItem>
                      <SelectItem value="office">مكتب</SelectItem>
                      <SelectItem value="shop">محل تجاري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">المدينة</label>
                  <Select value={filters.city} onValueChange={(value) => handleFilterChange("city", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع المدن" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع المدن</SelectItem>
                      <SelectItem value="الرياض">الرياض</SelectItem>
                      <SelectItem value="جدة">جدة</SelectItem>
                      <SelectItem value="الدمام">الدمام</SelectItem>
                      <SelectItem value="مكة المكرمة">مكة المكرمة</SelectItem>
                      <SelectItem value="المدينة المنورة">المدينة المنورة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">السعر من</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">السعر إلى</label>
                  <Input
                    type="number"
                    placeholder="1000000"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">عدد الغرف</label>
                  <Select value={filters.bedrooms} onValueChange={(value) => handleFilterChange("bedrooms", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="أي عدد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">أي عدد</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">عدد الحمامات</label>
                  <Select value={filters.bathrooms} onValueChange={(value) => handleFilterChange("bathrooms", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="أي عدد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">أي عدد</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">ترتيب حسب</label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث</SelectItem>
                      <SelectItem value="oldest">الأقدم</SelectItem>
                      <SelectItem value="price_asc">السعر: من الأقل للأعلى</SelectItem>
                      <SelectItem value="price_desc">السعر: من الأعلى للأقل</SelectItem>
                      <SelectItem value="area_asc">المساحة: من الأصغر للأكبر</SelectItem>
                      <SelectItem value="area_desc">المساحة: من الأكبر للأصغر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            نتائج البحث
            {properties && (
              <span className="text-muted-foreground font-normal mr-2">
                ({properties.length} عقار)
              </span>
            )}
          </h2>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-3 bg-muted rounded flex-1"></div>
                    <div className="h-3 bg-muted rounded flex-1"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: Property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <PhotoCarousel
                    images={property.images || []}
                    className="h-48 w-full object-cover rounded-t-lg"
                  />
                  <Badge className="absolute top-2 right-2 bg-primary/90">
                    {property.status === "available" ? "متاح" : 
                     property.status === "sold" ? "مباع" : "محجوز"}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-muted-foreground text-sm mb-2">
                      <MapPin className="h-4 w-4 ml-1" />
                      {property.city}, {property.state}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {property.bedrooms}
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms}
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      {property.area} م²
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(property.price)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(property.createdAt)}
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => setLocation(`/property/${property.id}`)}
                  >
                    عرض التفاصيل
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">لم يتم العثور على عقارات</h3>
              <p className="text-muted-foreground mb-4">
                جرب تعديل فلاتر البحث أو البحث بكلمات مختلفة
              </p>
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}