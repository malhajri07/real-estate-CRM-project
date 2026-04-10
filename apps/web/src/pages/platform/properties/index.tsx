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
import { useState, useMemo } from "react";
import { Plus, SlidersHorizontal, LayoutGrid, List, Search, X, CheckCircle, XCircle, Clock, Save, Bookmark } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";
import {
  Sheet, SheetContent, SheetHeader, SheetFooter,
  SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import EmptyState from "@/components/ui/empty-state";
import AddPropertyDrawer from "@/components/modals/add-property-drawer";
import { apiDelete, apiPatch } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import type { Property } from "@shared/types";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { PropertiesGridSkeleton } from "@/components/skeletons/page-skeletons";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import PageHeader from "@/components/ui/page-header";

import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import PropertiesFilters from "./PropertiesFilters";
import PropertiesGrid from "./PropertiesGrid";
import PropertiesTable from "./PropertiesTable";

export default function Properties() {
  const showSkeleton = useMinLoadTime();
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const userRoles: string[] = Array.isArray(user?.roles) ? user.roles : [];
  const isCorpOwner = userRoles.includes("CORP_OWNER");
  const isAdmin = userRoles.includes("WEBSITE_ADMIN");
  const canApprove = isCorpOwner || isAdmin;
  const [addPropertyDrawerOpen, setAddPropertyDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("any");
  const [minBathrooms, setMinBathrooms] = useState("any");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [facadeFilter, setFacadeFilter] = useState("all");
  const [legalStatusFilter, setLegalStatusFilter] = useState("all");
  const [maxBuildingAge, setMaxBuildingAge] = useState("");
  const [hasServicesFilter, setHasServicesFilter] = useState<string[]>([]);
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

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`api/listings/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "تم الموافقة على الإعلان" });
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`api/listings/${id}/reject`, { reason: "لم يستوفِ المتطلبات" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "تم رفض الإعلان" });
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  // ── Saved filter presets (E7) ───────────────────────────────────────────────

  interface SavedFilter { id: string; name: string; filterConfig: Record<string, any> }

  const { data: savedFilters } = useQuery<SavedFilter[]>({
    queryKey: ["/api/saved-filters"],
  });

  /** Save the current filter state as a named preset (E7). */
  const saveFilterMutation = useMutation({
    mutationFn: (name: string) =>
      fetch("/api/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          name,
          filterConfig: { statusFilter, propertyTypeFilter, listingTypeFilter, cityFilter, districtFilter, minPrice, maxPrice, minBedrooms, minBathrooms, sortBy },
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-filters"] });
      toast({ title: "تم حفظ الفلتر" });
    },
  });

  /** Load a saved filter preset into the current state (E7). */
  const loadFilter = (config: Record<string, any>) => {
    if (config.statusFilter) setStatusFilter(config.statusFilter);
    if (config.propertyTypeFilter) setPropertyTypeFilter(config.propertyTypeFilter);
    if (config.listingTypeFilter) setListingTypeFilter(config.listingTypeFilter);
    if (config.cityFilter) setCityFilter(config.cityFilter);
    if (config.districtFilter) setDistrictFilter(config.districtFilter);
    if (config.minPrice) setMinPrice(config.minPrice);
    if (config.maxPrice) setMaxPrice(config.maxPrice);
    if (config.minBedrooms) setMinBedrooms(config.minBedrooms);
    if (config.minBathrooms) setMinBathrooms(config.minBathrooms);
    if (config.sortBy) setSortBy(config.sortBy);
    setCurrentPage(1);
  };

  // Pending approval listings (CORP_OWNER only)
  const pendingApproval = useMemo(() => {
    if (!canApprove) return [];
    return (properties || []).filter((p: any) => p.status === "PENDING_APPROVAL");
  }, [properties, canApprove]);

  const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const trimmed = (value as string).trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const filteredProperties = (searchQuery.trim() ? searchResults : properties)?.filter((property: any) => {
    if (statusFilter !== "all" && property.status !== statusFilter) return false;
    if (propertyTypeFilter !== "all" && property.propertyType !== propertyTypeFilter && property.type !== propertyTypeFilter) return false;
    if (listingTypeFilter !== "all" && property.listingType !== listingTypeFilter) return false;
    if (cityFilter !== "all" && property.city !== cityFilter) return false;
    if (districtFilter !== "all" && property.district !== districtFilter) return false;
    // Price
    const price = toNumber(property.price);
    const pMin = toNumber(minPrice);
    const pMax = toNumber(maxPrice);
    if (pMin !== null && (price === null || price < pMin)) return false;
    if (pMax !== null && (price === null || price > pMax)) return false;
    // Bedrooms / Bathrooms
    if (minBedrooms && minBedrooms !== "any" && (!property.bedrooms || property.bedrooms < parseInt(minBedrooms))) return false;
    if (minBathrooms && minBathrooms !== "any" && (!property.bathrooms || Number(property.bathrooms) < parseInt(minBathrooms))) return false;
    // Area
    const area = toNumber(property.areaSqm);
    const aMin = toNumber(minArea);
    const aMax = toNumber(maxArea);
    if (aMin !== null && (area === null || area < aMin)) return false;
    if (aMax !== null && (area === null || area > aMax)) return false;
    // Facade
    if (facadeFilter !== "all" && property.facadeDirection !== facadeFilter) return false;
    // Legal status
    if (legalStatusFilter !== "all" && property.legalStatus !== legalStatusFilter) return false;
    // Building age
    const ageLimit = toNumber(maxBuildingAge);
    if (ageLimit !== null && (property.buildingAge == null || property.buildingAge > ageLimit)) return false;
    // Services
    if (hasServicesFilter.length > 0 && property.availableServices) {
      const svcs = String(property.availableServices).toLowerCase();
      if (!hasServicesFilter.every((s) => svcs.includes(s))) return false;
    } else if (hasServicesFilter.length > 0) {
      return false;
    }
    // Images
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
    setListingTypeFilter("all");
    setCityFilter("all");
    setDistrictFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("any");
    setMinBathrooms("any");
    setMinArea("");
    setMaxArea("");
    setFacadeFilter("all");
    setLegalStatusFilter("all");
    setMaxBuildingAge("");
    setHasServicesFilter([]);
    setImageAvailabilityFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const uniqueCities = Array.from(new Set(properties?.map(p => p.city) || [])).filter(
    (city): city is string => typeof city === "string" && city.trim() !== "",
  ).sort();
  const uniqueDistricts = useMemo(() => {
    const districts = properties
      ?.filter((p: any) => cityFilter === "all" || p.city === cityFilter)
      .map((p: any) => p.district)
      .filter((d): d is string => typeof d === "string" && d.trim() !== "");
    return Array.from(new Set(districts || [])).sort();
  }, [properties, cityFilter]);
  const uniquePropertyTypes = Array.from(new Set(properties?.map((p: any) => p.propertyType || p.type) || [])).filter(
    (type): type is string => typeof type === "string" && type.trim() !== "",
  );

  const activeFilterCount = [
    statusFilter !== "all", propertyTypeFilter !== "all", listingTypeFilter !== "all",
    cityFilter !== "all", districtFilter !== "all", minPrice !== "", maxPrice !== "",
    minBedrooms !== "any", minBathrooms !== "any", minArea !== "", maxArea !== "",
    facadeFilter !== "all", legalStatusFilter !== "all", maxBuildingAge !== "",
    hasServicesFilter.length > 0, imageAvailabilityFilter !== "all",
  ].filter(Boolean).length;

  const formatCurrency = (amount: string | number | null | undefined) => {
    const numeric = toNumber(amount);
    if (numeric === null) return "—";
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numeric) + "";
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
      <div className={PAGE_WRAPPER}>
        <QueryErrorFallback message={t("properties.load_error") || "Failed to load properties."} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title={"العقارات"} />
        <PropertiesGridSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title={"العقارات"} />
      {/* Search + Toolbar */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالعنوان، المدينة، أو الحي..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="ps-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => { if (v) setViewMode(v as "cards" | "table"); }} variant="outline" size="sm">
            <ToggleGroupItem value="cards" aria-label="بطاقات"><LayoutGrid size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="جدول"><List size={16} /></ToggleGroupItem>
          </ToggleGroup>

          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(true)}>
            <SlidersHorizontal size={16} />
            الفلاتر
            {activeFilterCount > 0 && <Badge variant="default" className="text-[10px] px-1.5 h-5">{activeFilterCount}</Badge>}
          </Button>

          {/* Saved filters (E7) */}
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              const name = prompt("اسم الفلتر:");
              if (name?.trim()) saveFilterMutation.mutate(name.trim());
            }}>
              <Save size={14} /> حفظ
            </Button>
          )}
          {savedFilters && savedFilters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Bookmark size={14} /> المحفوظات
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {savedFilters.map((f) => (
                  <DropdownMenuItem key={f.id} onClick={() => loadFilter(f.filterConfig)}>
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button onClick={() => setAddPropertyDrawerOpen(true)} size="sm">
            <Plus className="me-1.5" size={16} />
            إضافة عقار
          </Button>
        </div>
      </Card>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {statusFilter !== "all" && <Badge variant="secondary" className="gap-1">{statusFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => { setStatusFilter("all"); handleFilterChange(); }} /></Badge>}
          {cityFilter !== "all" && <Badge variant="secondary" className="gap-1">{cityFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => { setCityFilter("all"); handleFilterChange(); }} /></Badge>}
          {districtFilter !== "all" && <Badge variant="secondary" className="gap-1">{districtFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => { setDistrictFilter("all"); handleFilterChange(); }} /></Badge>}
          {propertyTypeFilter !== "all" && <Badge variant="secondary" className="gap-1">{propertyTypeFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => { setPropertyTypeFilter("all"); handleFilterChange(); }} /></Badge>}
          {legalStatusFilter !== "all" && <Badge variant="secondary" className="gap-1">{legalStatusFilter === "FREE" ? "صك حر" : legalStatusFilter === "MORTGAGED" ? "مرهون" : legalStatusFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => { setLegalStatusFilter("all"); handleFilterChange(); }} /></Badge>}
          {minPrice && <Badge variant="secondary" className="gap-1">من {Number(minPrice).toLocaleString()} <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinPrice(""); handleFilterChange(); }} /></Badge>}
          {maxPrice && <Badge variant="secondary" className="gap-1">إلى {Number(maxPrice).toLocaleString()} <X className="h-3 w-3 cursor-pointer" onClick={() => { setMaxPrice(""); handleFilterChange(); }} /></Badge>}
          <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive gap-1" onClick={resetFilters}><X className="h-3 w-3" /> مسح الكل</Button>
          <span className="ms-auto text-xs text-muted-foreground">{allProperties.length} عقار</span>
        </div>
      )}

      {/* Filter Sheet */}
      <PropertiesFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => { setStatusFilter(v); handleFilterChange(); }}
        propertyTypeFilter={propertyTypeFilter}
        onPropertyTypeFilterChange={(v) => { setPropertyTypeFilter(v); handleFilterChange(); }}
        listingTypeFilter={listingTypeFilter}
        onListingTypeFilterChange={(v) => { setListingTypeFilter(v); handleFilterChange(); }}
        cityFilter={cityFilter}
        onCityFilterChange={(v) => { setCityFilter(v); setDistrictFilter("all"); handleFilterChange(); }}
        districtFilter={districtFilter}
        onDistrictFilterChange={(v) => { setDistrictFilter(v); handleFilterChange(); }}
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
        minBathrooms={minBathrooms}
        onMinBathroomsChange={(v) => { setMinBathrooms(v); handleFilterChange(); }}
        minArea={minArea}
        onMinAreaChange={(v) => { setMinArea(v); handleFilterChange(); }}
        maxArea={maxArea}
        onMaxAreaChange={(v) => { setMaxArea(v); handleFilterChange(); }}
        facadeFilter={facadeFilter}
        onFacadeFilterChange={(v) => { setFacadeFilter(v); handleFilterChange(); }}
        legalStatusFilter={legalStatusFilter}
        onLegalStatusFilterChange={(v) => { setLegalStatusFilter(v); handleFilterChange(); }}
        maxBuildingAge={maxBuildingAge}
        onMaxBuildingAgeChange={(v) => { setMaxBuildingAge(v); handleFilterChange(); }}
        hasServicesFilter={hasServicesFilter}
        onHasServicesFilterChange={(v) => { setHasServicesFilter(v); handleFilterChange(); }}
        uniqueCities={uniqueCities}
        uniqueDistricts={uniqueDistricts}
        uniquePropertyTypes={uniquePropertyTypes}
        activeFilterCount={activeFilterCount}
        onResetFilters={resetFilters}
      />

      {/* Pending Approval Section — CORP_OWNER only */}
      {canApprove && pendingApproval.length > 0 && (
        <Card className="border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock size={16} className="text-[hsl(var(--warning))]" />
              بانتظار الموافقة ({pendingApproval.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingApproval.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.title || "بدون عنوان"}</p>
                  <p className="text-xs text-muted-foreground">{p.city}{p.district ? ` · ${p.district}` : ""} · {p.propertyType || p.type}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))]">بانتظار</Badge>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => approveMutation.mutate(p.id)} disabled={approveMutation.isPending}>
                    <CheckCircle size={12} />موافقة
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive" onClick={() => rejectMutation.mutate(p.id)} disabled={rejectMutation.isPending}>
                    <XCircle size={12} />رفض
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              جميع العقارات ({allProperties?.length || 0})
              {totalPages > 1 && ` — صفحة ${currentPage} من ${totalPages}`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!displayProperties || displayProperties.length === 0 ? (
            <EmptyState
              title={searchQuery ? "لا توجد عقارات تطابق بحثك" : "لا توجد عقارات"}
              description={searchQuery ? undefined : "أضف أول عقار للبدء."}
              action={!searchQuery ? (
                <Button onClick={() => setAddPropertyDrawerOpen(true)}>
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
                <div className="overflow-x-auto">
                <PropertiesTable
                  properties={displayProperties}
                  formatCurrency={formatCurrency}
                  onNavigate={navigateToProperty}
                  onDelete={handleDelete}
                  onShare={shareProperty}
                  isDeletePending={deletePropertyMutation.isPending}
                />
                </div>
              )}
            </>
          )}
        </CardContent>

        {displayProperties && displayProperties.length > 0 && totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t">
            <div className="text-sm text-muted-foreground">
              عرض {startIndex + 1} إلى {Math.min(endIndex, allProperties?.length || 0)} من {allProperties?.length || 0} عقار
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
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
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>

      <Sheet open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>تأكيد حذف العقار</SheetTitle>
            <SheetDescription>
              هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
            <Button
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePropertyMutation.isPending}
            >
              {deletePropertyMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AddPropertyDrawer open={addPropertyDrawerOpen} onOpenChange={setAddPropertyDrawerOpen} />
    </div>
  );
}
