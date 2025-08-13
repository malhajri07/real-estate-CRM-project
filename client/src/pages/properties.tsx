import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Edit, Eye, Plus, Bed, Bath, Square, Filter, SlidersHorizontal } from "lucide-react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PropertyMap } from "@/components/ui/property-map";
import AddPropertyModal from "@/components/modals/add-property-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Property } from "@shared/schema";

export default function Properties() {
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const PROPERTIES_PER_PAGE = 12;

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: searchResults } = useQuery<Property[]>({
    queryKey: ["/api/properties/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/properties/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!searchQuery.trim(),
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
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

  // Apply filters and sorting
  const filteredProperties = (searchQuery.trim() ? searchResults : properties)?.filter(property => {
    // Status filter
    if (statusFilter !== "all" && property.status !== statusFilter) return false;
    
    // Property type filter
    if (propertyTypeFilter !== "all" && property.propertyType !== propertyTypeFilter) return false;
    
    // City filter
    if (cityFilter !== "all" && property.city !== cityFilter) return false;
    
    // Price range filter
    const price = parseFloat(property.price);
    if (minPrice && price < parseFloat(minPrice)) return false;
    if (maxPrice && price > parseFloat(maxPrice)) return false;
    
    // Bedrooms filter
    if (minBedrooms && (!property.bedrooms || property.bedrooms < parseInt(minBedrooms))) return false;
    
    return true;
  }) || [];

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
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
    setMinBedrooms("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Get unique values for filter options
  const uniqueCities = Array.from(new Set(properties?.map(p => p.city) || []));
  const uniquePropertyTypes = Array.from(new Set(properties?.map(p => p.propertyType) || []));

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "sold": return "bg-blue-100 text-blue-800";
      case "withdrawn": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العقار؟")) {
      deletePropertyMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500">جار تحميل العقارات...</div>
      </div>
    );
  }

  return (
    <>
      <Header 
        title="العقارات" 
        onAddClick={() => setAddPropertyModalOpen(true)}
        onSearch={handleSearchChange}
        searchPlaceholder="البحث في العقارات بالعنوان أو الموقع أو النوع..."
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>
                جميع العقارات ({allProperties?.length || 0})
                {totalPages > 1 && ` - صفحة ${currentPage} من ${totalPages}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="apple-transition"
                >
                  <SlidersHorizontal size={16} className="ml-2" />
                  الفلاتر
                </Button>
                <Button onClick={() => setAddPropertyModalOpen(true)}>
                  <Plus className="ml-2" size={16} />
                  إضافة عقار
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-muted/20 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">فلاتر البحث</h3>
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    إعادة تعيين
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={statusFilter} onValueChange={(value) => {
                      setStatusFilter(value);
                      handleFilterChange();
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="pending">معلق</SelectItem>
                        <SelectItem value="sold">مباع</SelectItem>
                        <SelectItem value="withdrawn">مسحوب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Property Type Filter */}
                  <div className="space-y-2">
                    <Label>نوع العقار</Label>
                    <Select value={propertyTypeFilter} onValueChange={(value) => {
                      setPropertyTypeFilter(value);
                      handleFilterChange();
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        {uniquePropertyTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City Filter */}
                  <div className="space-y-2">
                    <Label>المدينة</Label>
                    <Select value={cityFilter} onValueChange={(value) => {
                      setCityFilter(value);
                      handleFilterChange();
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المدن</SelectItem>
                        {uniqueCities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label>ترتيب حسب</Label>
                    <Select value={sortBy} onValueChange={(value) => {
                      setSortBy(value);
                      handleFilterChange();
                    }}>
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
                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label>السعر الأدنى</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        handleFilterChange();
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>السعر الأعلى</Label>
                    <Input
                      type="number"
                      placeholder="1000000"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        handleFilterChange();
                      }}
                    />
                  </div>

                  {/* Minimum Bedrooms */}
                  <div className="space-y-2">
                    <Label>الحد الأدنى للغرف</Label>
                    <Select value={minBedrooms} onValueChange={(value) => {
                      setMinBedrooms(value);
                      handleFilterChange();
                    }}>
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
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!displayProperties || displayProperties.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-500 mb-4">
                  {searchQuery ? "لا توجد عقارات تطابق بحثك." : "لا توجد عقارات. أضف أول عقار للبدء."}
                </div>
                {!searchQuery && (
                  <Button onClick={() => setAddPropertyModalOpen(true)}>
                    <Plus className="ml-2" size={16} />
                    إضافة أول عقار
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProperties.map((property) => (
                    <Card key={property.id} className="overflow-hidden border border-border rounded-2xl apple-shadow-large apple-transition hover:scale-[1.02]">
                      {property.photoUrls && property.photoUrls.length > 0 && (
                        <div className="aspect-video overflow-hidden relative">
                          <img 
                            src={property.photoUrls[0]} 
                            alt={property.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                          {property.photoUrls.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
                              +{property.photoUrls.length - 1} more
                            </div>
                          )}
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg text-foreground line-clamp-1 tracking-tight">
                            {property.title}
                          </h3>
                          <Badge className={`${getStatusBadgeColor(property.status)} rounded-full px-3 py-1 text-xs font-medium`}>
                            {property.status}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-4">
                          {property.address}, {property.city}, {property.state}
                        </p>
                        
                        {/* Property Location Map with Marker */}
                        <div className="mb-4">
                          <PropertyMap
                            address={`${property.address}, ${property.city}, ${property.state}`}
                            latitude={property.latitude ? parseFloat(property.latitude) : undefined}
                            longitude={property.longitude ? parseFloat(property.longitude) : undefined}
                            className="h-32 w-full"
                            showLink={true}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
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
                          {property.squareFeet && (
                            <div className="flex items-center space-x-1">
                              <Square size={14} />
                              <span>{property.squareFeet.toLocaleString()} sq ft</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-primary font-semibold text-lg">
                            <span>{formatCurrency(property.price)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(property.id)}
                              disabled={deletePropertyMutation.isPending}
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
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8 pb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="apple-transition"
                    >
                      السابق
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = page === 1 || page === totalPages || 
                                        Math.abs(page - currentPage) <= 1;
                        
                        if (!showPage) {
                          // Show ellipsis for gaps
                          if (page === 2 && currentPage > 4) {
                            return <span key={page} className="px-2 text-muted-foreground">...</span>;
                          }
                          if (page === totalPages - 1 && currentPage < totalPages - 3) {
                            return <span key={page} className="px-2 text-muted-foreground">...</span>;
                          }
                          return null;
                        }
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 apple-transition ${
                              currentPage === page ? 'apple-gradient text-white' : ''
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="apple-transition"
                    >
                      التالي
                    </Button>
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
