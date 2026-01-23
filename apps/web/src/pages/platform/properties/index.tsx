/**
 * properties.tsx - Property Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → properties.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Property management page for authenticated users. Provides:
 * - Property listing and search
 * - Property CRUD operations
 * - Property filtering and sorting
 * - Property detail views
 * 
 * Route: /home/platform/properties or /properties
 * 
 * Related Files:
 * - apps/web/src/components/modals/add-property-modal.tsx - Add property modal
 * - apps/web/src/pages/property-detail.tsx - Property detail page
 * - apps/api/routes/listings.ts - Property API routes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Edit, Eye, Plus, Bed, Bath, Square, Filter, SlidersHorizontal, Share2, LayoutGrid, List, Sofa } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// import { PropertyMap } from "@/components/ui/property-map"; // Map component removed
import { PhotoCarousel } from "@/components/ui/photo-carousel";
import AddPropertyModal from "@/components/modals/add-property-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Property } from "@shared/types";
import { BUTTON_PRIMARY_CLASSES, TYPOGRAPHY, PAGE_WRAPPER, CARD_STYLES, TABLE_STYLES, BADGE_STYLES, LOADING_STYLES, EMPTY_STYLES } from "@/config/platform-theme";
import { cn } from "@/lib/utils";

export default function Properties() {
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [, setLocation] = useLocation();

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("any");
  const [imageAvailabilityFilter, setImageAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const PROPERTIES_PER_PAGE = 12;

  const { data: propertiesData, isLoading } = useQuery<{ items: Property[] } | Property[]>({
    queryKey: ["/api/listings?pageSize=all"],
  });

  const properties = Array.isArray(propertiesData)
    ? propertiesData
    : (propertiesData?.items || []);

  const { data: searchResults } = useQuery<Property[]>({
    queryKey: ["/api/listings", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      // Listing API uses /api/listings?q=... for search
      const response = await fetch(`/api/listings?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return data.items || data; // Handle both paginated and raw array responses
    },
    enabled: !!searchQuery.trim(),
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "نجح", description: "تم حذف العقار بنجاح" });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف العقار",
        variant: "destructive"
      });
    },
  });

  // Helper function to convert values to numbers
  const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  // Apply filters and sorting
  const filteredProperties = (searchQuery.trim() ? searchResults : properties)?.filter(property => {
    // Status filter
    if (statusFilter !== "all" && property.status !== statusFilter) return false;

    // Property type filter
    if (propertyTypeFilter !== "all" && property.propertyType !== propertyTypeFilter) return false;

    // City filter
    if (cityFilter !== "all" && property.city !== cityFilter) return false;

    // Price range filter
    const price = toNumber(property.price);
    const min = toNumber(minPrice);
    const max = toNumber(maxPrice);
    if (min !== null) {
      if (price === null || price < min) return false;
    }
    if (max !== null) {
      if (price === null || price > max) return false;
    }

    // Bedrooms filter
    if (minBedrooms && minBedrooms !== "any" && (!property.bedrooms || property.bedrooms < parseInt(minBedrooms))) return false;

    // Image availability filter
    if (imageAvailabilityFilter === "with-images" && (!property.photoUrls || property.photoUrls.length === 0)) return false;
    if (imageAvailabilityFilter === "without-images" && property.photoUrls && property.photoUrls.length > 0) return false;

    return true;
  }) || [];

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        {
          const priceA = toNumber(a.price);
          const priceB = toNumber(b.price);
          if (priceA === null && priceB === null) return 0;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceA - priceB;
        }
      case "price-high":
        {
          const priceA = toNumber(a.price);
          const priceB = toNumber(b.price);
          if (priceA === null && priceB === null) return 0;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceB - priceA;
        }
      case "bedrooms":
        return (b.bedrooms || 0) - (a.bedrooms || 0);
      case "size":
        return (b.squareFeet || 0) - (a.squareFeet || 0);
      case "oldest":
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case "newest":
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  // Pagination logic
  const allProperties = sortedProperties;
  const totalPages = Math.ceil((allProperties?.length || 0) / PROPERTIES_PER_PAGE);
  const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
  const endIndex = startIndex + PROPERTIES_PER_PAGE;
  const displayProperties = allProperties?.slice(startIndex, endIndex);

  // Reset to page 1 when search or filters change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setPropertyTypeFilter("all");
    setCityFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("any");
    setImageAvailabilityFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Get unique values for filter options
  const uniqueCities = Array.from(new Set(properties?.map(p => p.city) || [])).filter(
    (city): city is string => typeof city === "string" && city.trim() !== ""
  );
  const uniquePropertyTypes = Array.from(new Set(properties?.map(p => p.propertyType) || [])).filter(
    (type): type is string => typeof type === "string" && type.trim() !== ""
  );

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


  const formatCurrency = (amount: string | number | null | undefined) => {
    const numeric = toNumber(amount);
    if (numeric === null) return "—";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric) + ' ﷼';
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العقار؟")) {
      deletePropertyMutation.mutate(id);
    }
  };

  const shareProperty = (property: Property, platform: 'whatsapp' | 'twitter') => {
    const propertyUrl = `${window.location.origin}/home/platform/properties/${property.id}`;
    const shareText = `🏠 ${property.title}\n📍 ${property.address}, ${property.city}\n💰 ${formatCurrency(property.price)}\n\nاكتشف المزيد:`;

    let shareUrl = '';

    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${propertyUrl}`)}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(propertyUrl)}`;
    }

    window.open(shareUrl, '_blank');

    toast({
      title: "تم المشاركة",
      description: `تم فتح نافذة المشاركة على ${platform === 'whatsapp' ? 'واتساب' : 'تويتر'}`
    });
  };

  if (isLoading) {
    return (
      <div className={LOADING_STYLES.container} dir="rtl">
        <div className={LOADING_STYLES.text}>جار تحميل العقارات...</div>
      </div>
    );
  }

  return (
    <>
      <main className={PAGE_WRAPPER} dir="rtl">
        <Card className={CARD_STYLES.container}>
          <CardHeader className={cn(CARD_STYLES.header, "border-b border-gray-200")}>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className={TYPOGRAPHY.cardTitle}>
                جميع العقارات ({allProperties?.length || 0})
                {totalPages > 1 && ` - صفحة ${currentPage} من ${totalPages}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'cards' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="rounded-r-none border-r-0"
                    title="عرض البطاقات"
                  >
                    <LayoutGrid size={16} />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-l-none"
                    title="عرض الجدول"
                  >
                    <List size={16} />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="ui-transition"
                >
                  <SlidersHorizontal size={16} className="ml-2" />
                  الفلاتر
                </Button>
                <Button onClick={() => setAddPropertyModalOpen(true)} className={BUTTON_PRIMARY_CLASSES}>
                  <Plus className="ml-2" size={16} />
                  إضافة عقار
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="rounded-2xl p-5 space-y-4 border border-slate-200/60 shadow-sm ui-stable backdrop-blur-xl bg-white/90 ring-1 ring-emerald-200/40">
                <div className="flex items-center justify-between">
                  <h3 className={cn(TYPOGRAPHY.sectionTitle, "text-gray-900 text-right")}>فلاتر البحث</h3>
                  <Button variant="ghost" size="sm" onClick={resetFilters} className={BUTTON_PRIMARY_CLASSES}>
                    إعادة تعيين
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 transform-none">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">الحالة</Label>
                    <Select value={statusFilter} onValueChange={(value) => {
                      setStatusFilter(value);
                      handleFilterChange();
                    }}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">
                          كل الحالات
                        </SelectItem>
                        <SelectItem value="active" className="hover:bg-slate-100">
                          متاح
                        </SelectItem>
                        <SelectItem value="pending" className="hover:bg-slate-100">
                          قيد الانتظار
                        </SelectItem>
                        <SelectItem value="sold" className="hover:bg-slate-100">
                          مباع
                        </SelectItem>
                        <SelectItem value="withdrawn" className="hover:bg-slate-100">
                          مسحوب
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Property Type Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">نوع العقار</Label>
                    <Select value={propertyTypeFilter} onValueChange={(value) => {
                      setPropertyTypeFilter(value);
                      handleFilterChange();
                    }}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">
                          كل الأنواع
                        </SelectItem>
                        {uniquePropertyTypes.map(type => (
                          <SelectItem key={type} value={type} className="hover:bg-slate-100">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">المدينة</Label>
                    <Select value={cityFilter} onValueChange={(value) => {
                      setCityFilter(value);
                      handleFilterChange();
                    }}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">
                          كل المدن
                        </SelectItem>
                        {uniqueCities.map(city => (
                          <SelectItem key={city} value={city} className="hover:bg-slate-100">
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image Availability Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">توفر الصور</Label>
                    <Select value={imageAvailabilityFilter} onValueChange={(value) => {
                      setImageAvailabilityFilter(value);
                      handleFilterChange();
                    }}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">
                          جميع العقارات
                        </SelectItem>
                        <SelectItem value="with-images" className="hover:bg-slate-100">
                          عقارات مزودة بالصور
                        </SelectItem>
                        <SelectItem value="without-images" className="hover:bg-slate-100">
                          عقارات بدون صور
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">ترتيب حسب</Label>
                    <Select value={sortBy} onValueChange={(value) => {
                      setSortBy(value);
                      handleFilterChange();
                    }}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر الترتيب" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="newest" className="hover:bg-slate-100">
                          الأحدث
                        </SelectItem>
                        <SelectItem value="oldest" className="hover:bg-slate-100">
                          الأقدم
                        </SelectItem>
                        <SelectItem value="price-low" className="hover:bg-slate-100">
                          السعر (من الأقل)
                        </SelectItem>
                        <SelectItem value="price-high" className="hover:bg-slate-100">
                          السعر (من الأعلى)
                        </SelectItem>
                        <SelectItem value="bedrooms" className="hover:bg-slate-100">
                          عدد الغرف
                        </SelectItem>
                        <SelectItem value="size" className="hover:bg-slate-100">
                          المساحة
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">السعر الأدنى</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        handleFilterChange();
                      }}
                      className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">السعر الأعلى</Label>
                    <Input
                      type="number"
                      placeholder="1000000"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        handleFilterChange();
                      }}
                      className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors"
                    />
                  </div>

                  {/* Minimum Bedrooms */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">الحد الأدنى للغرف</Label>
                    <Select value={minBedrooms} onValueChange={(value) => {
                      setMinBedrooms(value);
                      handleFilterChange();
                    }}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="أي عدد" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg z-50" position="popper" sideOffset={4}>
                        <SelectItem value="any" className="hover:bg-slate-100">
                          أي عدد
                        </SelectItem>
                        <SelectItem value="1" className="hover:bg-slate-100">
                          1+
                        </SelectItem>
                        <SelectItem value="2" className="hover:bg-slate-100">
                          2+
                        </SelectItem>
                        <SelectItem value="3" className="hover:bg-slate-100">
                          3+
                        </SelectItem>
                        <SelectItem value="4" className="hover:bg-slate-100">
                          4+
                        </SelectItem>
                        <SelectItem value="5" className="hover:bg-slate-100">
                          5+
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!displayProperties || displayProperties.length === 0 ? (
              <div className={cn(EMPTY_STYLES.container, "text-right")}>
                <div className={cn(EMPTY_STYLES.description, "mb-4 text-gray-600")}>
                  {searchQuery ? "لا توجد عقارات تطابق بحثك." : "لا توجد عقارات. أضف أول عقار للبدء."}
                </div>
                {!searchQuery && (
                  <Button onClick={() => setAddPropertyModalOpen(true)} className={BUTTON_PRIMARY_CLASSES}>
                    <Plus className="ml-2" size={16} />
                    إضافة أول عقار
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-6">
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayProperties.map((property) => (
                      <Card
                        key={property.id}
                        className="ui-surface overflow-hidden ui-transition hover:scale-[1.02] cursor-pointer"
                        onClick={() => setLocation(`/home/platform/properties/${property.id}`)}
                      >
                        {property.photoUrls && property.photoUrls.length > 0 ? (
                          <PhotoCarousel
                            photos={property.photoUrls}
                            alt={property.title}
                            className="aspect-video"
                            showIndicators={property.photoUrls.length > 1}
                          />
                        ) : (
                          <div className="aspect-video bg-muted flex items-center justify-center border-b">
                            <div className="text-center text-muted-foreground">
                              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium">لا توجد صور</p>
                              <p className="text-xs">صورة العقار غير متوفرة</p>
                            </div>
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-lg text-foreground line-clamp-1 tracking-tight">
                              {property.title}
                            </h3>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(property.status)}`}>
                              {property.status}
                            </span>
                          </div>

                          <p className="text-muted-foreground text-sm mb-4">
                            {property.address}, {property.city}, {property.state}
                          </p>


                          <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-muted-foreground mb-4">
                            {property.bedrooms && (
                              <div className="flex items-center space-x-1">
                                <Bed size={14} />
                                <span>{property.bedrooms}</span>
                              </div>
                            )}
                            {property.bathrooms && (
                              <div className="flex items-center space-x-1">
                                <Bath size={14} />
                                <span>{property.bathrooms}</span>
                              </div>
                            )}
                            {(property as any).livingRooms && (
                              <div className="flex items-center space-x-1">
                                <Sofa size={14} />
                                <span>{(property as any).livingRooms}</span>
                              </div>
                            )}
                            {(property as any).areaSqm && (
                              <div className="flex items-center space-x-1">
                                <Square size={14} />
                                <span>{(property as any).areaSqm?.toLocaleString?.() ?? (property as any).areaSqm} متر²</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 text-primary font-semibold text-lg">
                              <span>{formatCurrency(property.price)}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/home/platform/properties/${property.id}`);
                                }}
                                title="عرض التفاصيل"
                              >
                                <Eye size={16} />
                              </Button>

                              {/* Share Dropdown */}
                              <div className="relative group">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  title="مشاركة العقار"
                                  className="relative"
                                >
                                  <Share2 size={16} />
                                </Button>

                                {/* Share Dropdown Menu */}
                                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
                                  <div className="p-2 space-y-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        shareProperty(property, 'whatsapp');
                                      }}
                                      className="w-full text-right px-3 py-2 text-sm hover:bg-gray-100 rounded-md flex items-center gap-2 text-gray-700"
                                    >
                                      <svg className="w-4 h-4 fill-current text-green-500" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382" />
                                      </svg>
                                      واتساب
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        shareProperty(property, 'twitter');
                                      }}
                                      className="w-full text-right px-3 py-2 text-sm hover:bg-gray-100 rounded-md flex items-center gap-2 text-gray-700"
                                    >
                                      <svg className="w-4 h-4 fill-current text-blue-400" viewBox="0 0 24 24">
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                      </svg>
                                      تويتر
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                title="تعديل العقار"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(property.id);
                                }}
                                disabled={deletePropertyMutation.isPending}
                                title="حذف العقار"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>

                          {property.description && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              {property.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
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
                        {displayProperties.map((property) => (
                          <tr
                            key={property.id}
                            className="cursor-pointer transition-colors hover:bg-slate-50/50"
                            onClick={() => setLocation(`/home/platform/properties/${property.id}`)}
                          >
                            <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                              {property.photoUrls && property.photoUrls.length > 0 ? (
                                <img
                                  src={property.photoUrls[0]}
                                  alt={property.title}
                                  className="w-16 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                  </svg>
                                </div>
                              )}
                            </td>
                            <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                              <div className={cn(TYPOGRAPHY.body, "font-semibold text-gray-900 line-clamp-1 text-right")}>{property.title}</div>
                              <div className={cn("mt-1 flex items-center gap-2", TYPOGRAPHY.caption, "text-gray-500 text-right")}>
                                <span className="flex items-center gap-1">
                                  <Square size={12} />
                                  {property.propertyType}
                                </span>
                              </div>
                            </td>
                            <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                              <div className={cn(TYPOGRAPHY.body, "text-gray-900 text-right")}>{property.city}, {property.state}</div>
                              <div className={cn("mt-1", TYPOGRAPHY.caption, "text-gray-600 text-right")}>{property.address}</div>
                            </td>
                            <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                              <div className={cn(TYPOGRAPHY.body, "text-gray-900 text-right")}>{property.propertyType}</div>
                            </td>
                            <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                              <span className={cn(BADGE_STYLES.base, getStatusBadgeClasses(property.status))}>
                                {property.status}
                              </span>
                            </td>
                            <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                              <div className={cn(TYPOGRAPHY.body, "font-semibold text-[rgb(128_193_165)] text-right")}>
                                {formatCurrency(property.price)}
                              </div>
                            </td>
                            <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                              {(property as any).areaSqm ? `${((property as any).areaSqm?.toLocaleString?.() ?? (property as any).areaSqm)} متر²` : '-'}
                            </td>
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
                                {(property as any).livingRooms && (
                                  <span className="flex items-center gap-1">
                                    <Sofa size={12} />
                                    {(property as any).livingRooms}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-right")}>
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="p-2 rounded-md text-slate-600 transition-colors duration-150 hover:text-slate-800 hover:bg-slate-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocation(`/home/platform/properties/${property.id}`);
                                  }}
                                  title="عرض التفاصيل"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  className="p-2 rounded-md text-purple-600 transition-colors duration-150 hover:text-purple-800 hover:bg-purple-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    shareProperty(property, 'whatsapp');
                                  }}
                                  title="مشاركة العقار"
                                >
                                  <Share2 size={14} />
                                </button>
                                <button
                                  className="p-2 rounded-md text-blue-600 transition-colors duration-150 hover:text-blue-800 hover:bg-blue-50"
                                  onClick={(e) => e.stopPropagation()}
                                  title="تعديل العقار"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="p-2 rounded-md text-red-600 transition-colors duration-150 hover:text-red-800 hover:bg-red-50 disabled:opacity-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(property.id);
                                  }}
                                  disabled={deletePropertyMutation.isPending}
                                  title="حذف العقار"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/30">
                    <div className="text-sm text-slate-600">
                      عرض {startIndex + 1} إلى {Math.min(endIndex, allProperties?.length || 0)} من {allProperties?.length || 0} عقار
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        السابق
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        التالي
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AddPropertyModal open={addPropertyModalOpen} onOpenChange={setAddPropertyModalOpen} />
    </>
  );
}
