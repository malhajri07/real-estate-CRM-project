/**
 * properties/index.tsx - Property Management Page
 *
 * Route: /home/platform/properties or /properties
 *
 * Property management page. Keeps all state, queries, and mutations here,
 * delegates rendering to sub-components:
 *   - PropertiesFilters — search and filter controls
 *   - PropertiesGrid   — card grid view
 *   - PropertiesTable  — table view
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { useLocation } from "wouter";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import EmptyState from "@/components/ui/empty-state";
import AddPropertyModal from "@/components/modals/add-property-modal";
import { apiDelete } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import type { Property } from "@shared/types";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import PageHeader from "@/components/ui/page-header";

import PropertiesFilters from "./PropertiesFilters";
import PropertiesGrid from "./PropertiesGrid";
import PropertiesTable from "./PropertiesTable";

export default function Properties() {
  const { t, dir } = useLanguage();
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

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

  const { data: propertiesData, isLoading, isError, refetch } = useQuery<{ items: Property[] } | Property[]>({
    queryKey: ["/api/listings?pageSize=all"],
  });

  const properties = Array.isArray(propertiesData)
    ? propertiesData
    : (propertiesData?.items || []);

  const { data: searchResults } = useQuery<Property[]>({
    queryKey: ["/api/listings", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/listings?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      return data.items || data;
    },
    enabled: !!searchQuery.trim(),
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`api/listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      toast({ title: "نجح", description: "تم حذف العقار بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حذف العقار", variant: "destructive" });
    },
  });

  const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const trimmed = (value as string).trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const filteredProperties = (searchQuery.trim() ? searchResults : properties)?.filter(property => {
    if (statusFilter !== "all" && property.status !== statusFilter) return false;
    if (propertyTypeFilter !== "all" && property.propertyType !== propertyTypeFilter) return false;
    if (cityFilter !== "all" && property.city !== cityFilter) return false;
    const price = toNumber(property.price);
    const min = toNumber(minPrice);
    const max = toNumber(maxPrice);
    if (min !== null && (price === null || price < min)) return false;
    if (max !== null && (price === null || price > max)) return false;
    if (minBedrooms && minBedrooms !== "any" && (!property.bedrooms || property.bedrooms < parseInt(minBedrooms))) return false;
    if (imageAvailabilityFilter === "with-images" && (!property.photoUrls || property.photoUrls.length === 0)) return false;
    if (imageAvailabilityFilter === "without-images" && property.photoUrls && property.photoUrls.length > 0) return false;
    return true;
  }) || [];

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "price-low": {
        const pA = toNumber(a.price), pB = toNumber(b.price);
        if (pA === null && pB === null) return 0;
        if (pA === null) return 1;
        if (pB === null) return -1;
        return pA - pB;
      }
      case "price-high": {
        const pA = toNumber(a.price), pB = toNumber(b.price);
        if (pA === null && pB === null) return 0;
        if (pA === null) return 1;
        if (pB === null) return -1;
        return pB - pA;
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

  const allProperties = sortedProperties;
  const totalPages = Math.ceil((allProperties?.length || 0) / PROPERTIES_PER_PAGE);
  const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE;
  const endIndex = startIndex + PROPERTIES_PER_PAGE;
  const displayProperties = allProperties?.slice(startIndex, endIndex);

  const handleFilterChange = () => setCurrentPage(1);

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

  const uniqueCities = Array.from(new Set(properties?.map(p => p.city) || [])).filter(
    (city): city is string => typeof city === "string" && city.trim() !== "",
  );
  const uniquePropertyTypes = Array.from(new Set(properties?.map(p => p.propertyType) || [])).filter(
    (type): type is string => typeof type === "string" && type.trim() !== "",
  );

  const formatCurrency = (amount: string | number | null | undefined) => {
    const numeric = toNumber(amount);
    if (numeric === null) return "—";
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numeric) + " ﷼";
  };

  const handleDelete = (id: string) => {
    setPropertyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (propertyToDelete) {
      deletePropertyMutation.mutate(propertyToDelete);
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const shareProperty = (property: Property, platform: "whatsapp" | "twitter") => {
    const propertyUrl = `${window.location.origin}/home/platform/properties/${property.id}`;
    const shareText = `🏠 ${property.title}\n📍 ${property.address}, ${property.city}\n💰 ${formatCurrency(property.price)}\n\nاكتشف المزيد:`;
    let shareUrl = "";
    if (platform === "whatsapp") {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${propertyUrl}`)}`;
    } else if (platform === "twitter") {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(propertyUrl)}`;
    }
    window.open(shareUrl, "_blank");
    toast({
      title: "تم المشاركة",
      description: `تم فتح نافذة المشاركة على ${platform === "whatsapp" ? "واتساب" : "تويتر"}`,
    });
  };

  const navigateToProperty = (id: string) => setLocation(`/home/platform/properties/${id}`);

  if (isError) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <QueryErrorFallback message={t("properties.load_error") || "Failed to load properties."} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <div className="text-sm font-medium text-muted-foreground mb-4">جار تحميل العقارات...</div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader title={t("nav.properties") || "العقارات"} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>
              جميع العقارات ({allProperties?.length || 0})
              {totalPages > 1 && ` - صفحة ${currentPage} من ${totalPages}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => { if (value) setViewMode(value as "cards" | "table"); }}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="cards" aria-label="عرض البطاقات">
                  <LayoutGrid size={16} />
                </ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="عرض الجدول">
                  <List size={16} />
                </ToggleGroupItem>
              </ToggleGroup>

              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal size={16} className="me-2" />
                الفلاتر
              </Button>
              <Button onClick={() => setAddPropertyModalOpen(true)}>
                <Plus className="me-2" size={16} />
                إضافة عقار
              </Button>
            </div>
          </div>

          {showFilters && (
            <PropertiesFilters
              statusFilter={statusFilter}
              onStatusFilterChange={(v) => { setStatusFilter(v); handleFilterChange(); }}
              propertyTypeFilter={propertyTypeFilter}
              onPropertyTypeFilterChange={(v) => { setPropertyTypeFilter(v); handleFilterChange(); }}
              cityFilter={cityFilter}
              onCityFilterChange={(v) => { setCityFilter(v); handleFilterChange(); }}
              imageAvailabilityFilter={imageAvailabilityFilter}
              onImageAvailabilityFilterChange={(v) => { setImageAvailabilityFilter(v); handleFilterChange(); }}
              sortBy={sortBy}
              onSortByChange={(v) => { setSortBy(v); handleFilterChange(); }}
              minPrice={minPrice}
              onMinPriceChange={(v) => { setMinPrice(v); handleFilterChange(); }}
              maxPrice={maxPrice}
              onMaxPriceChange={(v) => { setMaxPrice(v); handleFilterChange(); }}
              minBedrooms={minBedrooms}
              onMinBedroomsChange={(v) => { setMinBedrooms(v); handleFilterChange(); }}
              uniqueCities={uniqueCities}
              uniquePropertyTypes={uniquePropertyTypes}
              onResetFilters={resetFilters}
            />
          )}
        </CardHeader>
        <CardContent>
          {!displayProperties || displayProperties.length === 0 ? (
            <EmptyState
              title={searchQuery ? "لا توجد عقارات تطابق بحثك" : "لا توجد عقارات"}
              description={searchQuery ? undefined : "أضف أول عقار للبدء."}
              action={!searchQuery ? (
                <Button onClick={() => setAddPropertyModalOpen(true)}>
                  <Plus className="me-2" size={16} />
                  إضافة أول عقار
                </Button>
              ) : undefined}
            />
          ) : (
            <>
              {viewMode === "cards" ? (
                <PropertiesGrid
                  properties={displayProperties}
                  formatCurrency={formatCurrency}
                  onNavigate={navigateToProperty}
                  onDelete={handleDelete}
                  onShare={shareProperty}
                  isDeletePending={deletePropertyMutation.isPending}
                />
              ) : (
                <PropertiesTable
                  properties={displayProperties}
                  formatCurrency={formatCurrency}
                  onNavigate={navigateToProperty}
                  onDelete={handleDelete}
                  onShare={shareProperty}
                  isDeletePending={deletePropertyMutation.isPending}
                />
              )}
            </>
          )}
        </CardContent>

        {displayProperties && displayProperties.length > 0 && totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t">
            <div className="text-sm text-muted-foreground">
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
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف العقار</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePropertyMutation.isPending}
            >
              {deletePropertyMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddPropertyModal open={addPropertyModalOpen} onOpenChange={setAddPropertyModalOpen} />
    </div>
  );
}
