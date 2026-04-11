/**
 * pool/index.tsx — الطلبات العقارية
 *
 * Two tabs:
 *   1. باحثين عن عقار — Buyer requests (people looking for property)
 *   2. ملاك عقار — Owner/seller submissions (have property, need agent)
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Search, Ticket, MessageSquare, RefreshCw, Download,
  X, ChevronDown, Eye, Handshake, Clock, Flame,
  MapPin, BedDouble, Bath, Building, Sparkles,
  ArrowUpDown, Inbox, Filter, Home, User,
  Phone, Mail, Ruler, Tag, CheckCircle2, Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { PoolSkeleton } from "@/components/skeletons/page-skeletons";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiGet, apiPost } from "@/lib/apiClient";
import { toast } from "sonner";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { SarPrice } from "@/components/ui/sar-symbol";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface BuyerRequest {
  id?: string | number;
  type?: string;
  city?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  bathrooms?: number | string;
  livingRooms?: number | string;
  notes?: string;
  source?: string;
  createdAt?: string | Date;
  canSendSms?: boolean;
  hasActiveClaim?: boolean;
  status?: string;
  /** Number of agents who claimed this request (E9). */
  claimCount?: number;
  /** Expiry date of the current agent's claim (E9). */
  claimExpiresAt?: string;
}

interface OwnerListing {
  id: string;
  propertyId?: string;
  title?: string;
  description?: string;
  propertyCategory?: string;
  propertyType?: string;
  listingType?: string;
  country?: string;
  region?: string;
  city?: string;
  district?: string;
  streetAddress?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  kitchens?: number;
  floorNumber?: number;
  totalFloors?: number;
  areaSqm?: number;
  buildingYear?: number;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasMaidsRoom?: boolean;
  hasDriverRoom?: boolean;
  furnished?: boolean;
  balcony?: boolean;
  swimmingPool?: boolean;
  centralAc?: boolean;
  price?: number;
  currency?: string;
  paymentFrequency?: string;
  mainImageUrl?: string;
  imageGallery?: string[];
  videoClipUrl?: string;
  contactName?: string;
  mobileNumber?: string;
  contactMobile?: string;
  status?: string;
  createdAt?: string;
}

interface PoolPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PoolSearchResponse {
  success?: boolean;
  data?: BuyerRequest[];
  pagination?: PoolPagination;
}

type SortField = "date" | "budget" | "city" | "type";
type SortDir = "asc" | "desc";

// ── Helpers ────────────────────────────────────────────────────────────────

const formatBudgetRange = (min?: number | null, max?: number | null): string => {
  const fmt = (v: number) => v.toLocaleString("en-US");
  if (min != null && max != null && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return fmt(min);
  if (max != null) return fmt(max);
  return "—";
};

const isFresh = (createdAt?: string | Date | null): boolean => {
  if (!createdAt) return false;
  return differenceInHours(new Date(), new Date(String(createdAt))) < 24;
};

// ── Main Component ─────────────────────────────────────────────────────────

export default function PoolPage() {
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();

  // ── Buyer tab state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [poolTypeFilter, setPoolTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [poolPage, setPoolPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [detailRequest, setDetailRequest] = useState<BuyerRequest | null>(null);

  // ── Owner tab state ──
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerStatusFilter, setOwnerStatusFilter] = useState<string>("Pending");
  const [detailOwner, setDetailOwner] = useState<OwnerListing | null>(null);

  // SMS sheet
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsTargetId, setSmsTargetId] = useState<string | null>(null);
  const smsForm = useForm<{ message: string }>({
    resolver: zodResolver(z.object({ message: z.string().min(1).max(500) })),
    defaultValues: { message: "" },
  });

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: poolData,
    isLoading: buyerLoading,
    isError: buyerError,
    refetch: buyerRefetch,
  } = useQuery<PoolSearchResponse>({
    queryKey: ["/api/pool/search", searchQuery, poolPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(poolPage), pageSize: "100" });
      if (searchQuery) params.set("city", searchQuery);
      const json = await apiGet<PoolSearchResponse>(`api/pool/search?${params}`);
      const defaultPag: PoolPagination = { page: 1, pageSize: 100, total: 0, totalPages: 1 };
      if (!json || typeof json !== "object") return { success: false, data: [], pagination: defaultPag };
      return { success: json.success, data: json.data ?? [], pagination: { ...defaultPag, ...json.pagination } };
    },
    retry: 1,
    staleTime: 60_000, // 1 minute — pool data doesn't change every second
  });

  const {
    data: ownerListings,
    isLoading: ownerLoading,
    isError: ownerError,
    refetch: ownerRefetch,
  } = useQuery<OwnerListing[]>({
    queryKey: ["/api/unverified-listings", ownerStatusFilter],
    queryFn: () => apiGet<OwnerListing[]>(`api/unverified-listings?status=${ownerStatusFilter}`),
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const claimMutation = useMutation({
    mutationFn: async ({ requestId, source }: { requestId: string; source?: string }) => {
      if (source === "customer_request") {
        return apiPost(`api/pool/customer-requests/${requestId}/claim`, { notes: "Claimed from pool" });
      }
      return apiPost(`api/pool/${requestId}/claim`, { notes: "Quick claim via Platform" });
    },
    onSuccess: () => {
      toast.success("تم استلام الطلب بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["/api/pool/search"] });
      setDetailRequest(null);
    },
    onError: () => toast.error("فشل استلام الطلب"),
  });

  const sendSmsMutation = useMutation({
    mutationFn: async ({ requestId, message }: { requestId: string; message: string }) =>
      apiPost(`api/pool/customer-requests/${requestId}/send-sms`, { message }),
    onSuccess: () => { toast.success("تم إرسال الرسالة"); smsForm.reset(); setSmsOpen(false); },
    onError: () => toast.error("فشل إرسال الرسالة"),
  });

  // ── Buyer computed ───────────────────────────────────────────────────────

  const rawPool: BuyerRequest[] = Array.isArray(poolData?.data) ? poolData.data : [];

  const topCities = useMemo(() => {
    const counts: Record<string, number> = {};
    rawPool.forEach((r) => { if (r.city) counts[r.city] = (counts[r.city] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
  }, [rawPool]);

  const buyerFiltered = useMemo(() => {
    let items = rawPool;
    if (poolTypeFilter !== "all") items = items.filter((r) => r.type === poolTypeFilter);
    if (cityFilter !== "all") items = items.filter((r) => r.city === cityFilter);
    return items;
  }, [rawPool, poolTypeFilter, cityFilter]);

  const buyerSorted = useMemo(() => {
    const arr = [...buyerFiltered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date": cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(); break;
        case "budget": cmp = (a.minPrice ?? 0) - (b.minPrice ?? 0); break;
        case "city": cmp = (a.city || "").localeCompare(b.city || ""); break;
        case "type": cmp = (a.type || "").localeCompare(b.type || ""); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [buyerFiltered, sortField, sortDir]);

  const buyerStats = useMemo(() => ({
    total: rawPool.length,
    buy: rawPool.filter((r) => r.type === "Buy" || r.type === "شراء").length,
    rent: rawPool.filter((r) => r.type === "Rent" || r.type === "إيجار").length,
    fresh: rawPool.filter((r) => isFresh(r.createdAt)).length,
  }), [rawPool]);

  // ── Owner computed ───────────────────────────────────────────────────────

  const allOwnerListings = ownerListings ?? [];
  const ownerFiltered = useMemo(() => {
    if (!ownerSearch.trim()) return allOwnerListings;
    const q = ownerSearch.toLowerCase();
    return allOwnerListings.filter((l) =>
      (l.title || "").toLowerCase().includes(q) ||
      (l.city || "").toLowerCase().includes(q) ||
      (l.contactName || "").toLowerCase().includes(q)
    );
  }, [allOwnerListings, ownerSearch]);

  const ownerStats = useMemo(() => ({
    total: allOwnerListings.length,
    pending: allOwnerListings.filter((l) => l.status === "Pending").length,
    approved: allOwnerListings.filter((l) => l.status === "Approved").length,
  }), [allOwnerListings]);

  // ── Sort helper ──
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 text-start font-bold hover:text-primary transition-colors">
      {children}
      <ArrowUpDown className={cn("h-3 w-3", sortField === field ? "text-primary" : "text-muted-foreground/40")} />
    </button>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  if ((buyerLoading && ownerLoading) || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="الطلبات العقارية" subtitle="طلبات الباحثين عن عقار وإعلانات الملاك الذين يبحثون عن وسيط" />
        <PoolSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader
        title="الطلبات العقارية"
        subtitle="طلبات الباحثين عن عقار وإعلانات الملاك الذين يبحثون عن وسيط"
      >
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { buyerRefetch(); ownerRefetch(); }}>
          <RefreshCw className={cn("h-4 w-4", (buyerLoading || ownerLoading) && "animate-spin")} />
          تحديث
        </Button>
      </PageHeader>

      <Tabs defaultValue="buyers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="buyers" className="gap-1.5">
            <Search size={14} />
            باحثين عن عقار
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ms-1">{buyerStats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="owners" className="gap-1.5">
            <Home size={14} />
            ملاك عقار
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ms-1">{ownerStats.total}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ══════════════ TAB 1: Buyers (Looking for property) ══════════════ */}
        <TabsContent value="buyers" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Inbox, bg: "bg-primary/10", color: "text-primary", value: buyerStats.total, label: "إجمالي" },
              { icon: Building, bg: "bg-accent", color: "text-accent-foreground", value: buyerStats.buy, label: "شراء" },
              { icon: Tag, bg: "bg-primary/10", color: "text-primary", value: buyerStats.rent, label: "إيجار" },
              { icon: Sparkles, bg: "bg-[hsl(var(--warning)/0.1)]", color: "text-[hsl(var(--warning))]", value: buyerStats.fresh, label: "جديد اليوم" },
            ].map((s, i) => (
              <Card key={i}><CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.bg)}>
                  <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent></Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <Filter className="h-3.5 w-3.5" />
                  {poolTypeFilter === "all" ? "النوع" : poolTypeFilter === "Buy" ? "شراء" : "إيجار"}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setPoolTypeFilter("all")}>الكل</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPoolTypeFilter("Buy")}>شراء ({buyerStats.buy})</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPoolTypeFilter("Rent")}>إيجار ({buyerStats.rent})</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {topCities.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                {topCities.map((city) => (
                  <Button key={city} size="sm" variant={cityFilter === city ? "default" : "outline"} className="h-7 text-xs px-2.5" onClick={() => setCityFilter(cityFilter === city ? "all" : city)}>
                    <MapPin className="h-3 w-3 me-1" />{city}
                  </Button>
                ))}
              </>
            )}

            {(poolTypeFilter !== "all" || cityFilter !== "all") && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => { setPoolTypeFilter("all"); setCityFilter("all"); }}>
                <X className="h-3 w-3" />مسح
              </Button>
            )}
            <span className="ms-auto text-xs text-muted-foreground">{buyerSorted.length} طلب</span>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            {(buyerLoading || showSkeleton) ? (
              <TableSkeleton rows={8} cols={7} />
            ) : buyerError ? (
              <QueryErrorFallback message="فشل تحميل الطلبات" onRetry={() => buyerRefetch()} />
            ) : buyerSorted.length === 0 ? (
              <EmptyState icon={Ticket} title="لا توجد طلبات" description="لا توجد طلبات باحثين عن عقار حالياً" />
            ) : (
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[44px]">#</TableHead>
                      <TableHead><SortHeader field="type">النوع</SortHeader></TableHead>
                      <TableHead><SortHeader field="city">المدينة</SortHeader></TableHead>
                      <TableHead><SortHeader field="budget">الميزانية</SortHeader></TableHead>
                      <TableHead>المواصفات</TableHead>
                      <TableHead><SortHeader field="date">التاريخ</SortHeader></TableHead>
                      <TableHead>وسطاء</TableHead>
                      <TableHead className="w-[100px]">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyerSorted.map((req, idx) => {
                      const reqId = req.id != null ? String(req.id) : undefined;
                      const fresh = isFresh(req.createdAt);
                      return (
                        <TableRow key={reqId ?? idx} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailRequest(req)}>
                          <TableCell className="text-muted-foreground tabular-nums text-xs">{idx + 1}</TableCell>
                          <TableCell>
                            <Badge variant={req.type === "Buy" || req.type === "شراء" ? "default" : "secondary"}>
                              {req.type === "Buy" ? "شراء" : req.type === "Rent" ? "إيجار" : (req.type || "—")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{req.city || "—"}</span>
                          </TableCell>
                          <TableCell className="font-bold text-primary tabular-nums">{formatBudgetRange(req.minPrice, req.maxPrice)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5"><BedDouble className="h-3 w-3" />{req.minBedrooms ?? req.maxBedrooms ?? "—"}</span>
                              <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{req.bathrooms ?? "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {fresh && <Flame className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />}
                              <span className="text-sm text-muted-foreground">
                                {req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: ar }) : "—"}
                              </span>
                            </div>
                          </TableCell>
                          {/* Interested agents count + claim expiry (E9) */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {(req as any).claimCount > 0 && (
                                <Badge variant="outline" className="text-[10px] gap-0.5">
                                  <User className="h-3 w-3" /> {(req as any).claimCount}
                                </Badge>
                              )}
                              {(req as any).claimExpiresAt && (
                                <Badge variant="outline" className="text-[10px] border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))]">
                                  <Clock className="h-3 w-3" /> {Math.max(0, Math.ceil((new Date((req as any).claimExpiresAt).getTime() - Date.now()) / 86400000))} يوم
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => reqId && claimMutation.mutate({ requestId: reqId, source: req.source })} disabled={claimMutation.isPending}>
                                <Handshake className="h-3.5 w-3.5" />استلام
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ══════════════ TAB 2: Owners (Have property, need agent) ══════════════ */}
        <TabsContent value="owners" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: Home, bg: "bg-primary/10", color: "text-primary", value: ownerStats.total, label: "إجمالي" },
              { icon: Clock, bg: "bg-[hsl(var(--warning)/0.1)]", color: "text-[hsl(var(--warning))]", value: ownerStats.pending, label: "بانتظار وسيط" },
              { icon: Handshake, bg: "bg-accent", color: "text-accent-foreground", value: ownerStats.approved, label: "تم التعيين" },
            ].map((s, i) => (
              <Card key={i}><CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.bg)}>
                  <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent></Card>
            ))}
          </div>

          {/* Search + Status filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ابحث بالعنوان أو المدينة أو المالك..." value={ownerSearch} onChange={(e) => setOwnerSearch(e.target.value)} className="ps-9 h-9" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-9">
                  <Filter className="h-3.5 w-3.5" />
                  {ownerStatusFilter === "Pending" ? "بانتظار" : ownerStatusFilter === "Approved" ? "معتمد" : "الكل"}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setOwnerStatusFilter("Pending")}>بانتظار وسيط</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOwnerStatusFilter("Approved")}>معتمد</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOwnerStatusFilter("Rejected")}>مرفوض</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOwnerStatusFilter("")}>الكل</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="ms-auto text-xs text-muted-foreground">{ownerFiltered.length} إعلان</span>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            {(ownerLoading || showSkeleton) ? (
              <TableSkeleton rows={8} cols={7} />
            ) : ownerError ? (
              <QueryErrorFallback message="فشل تحميل إعلانات الملاك" onRetry={() => ownerRefetch()} />
            ) : ownerFiltered.length === 0 ? (
              <EmptyState icon={Home} title="لا توجد إعلانات" description="لا توجد إعلانات من ملاك عقار حالياً" />
            ) : (
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[44px]">#</TableHead>
                      <TableHead>العقار</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المالك</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="w-[80px]">عرض</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownerFiltered.map((listing, idx) => (
                      <TableRow key={listing.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailOwner(listing)}>
                        <TableCell className="text-muted-foreground tabular-nums text-xs">{idx + 1}</TableCell>
                        <TableCell>
                          <p className="font-bold text-sm truncate max-w-[200px]">{listing.title || "بدون عنوان"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{listing.propertyType || listing.listingType || "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{listing.city || "—"}</span>
                        </TableCell>
                        <TableCell className="font-bold text-primary tabular-nums">
                          {listing.price ? <SarPrice value={listing.price} /> : "—"}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm"><User className="h-3.5 w-3.5 text-muted-foreground" />{listing.contactName || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={listing.status === "Approved" ? "default" : listing.status === "Rejected" ? "destructive" : "outline"}>
                            {listing.status === "Pending" ? "بانتظار" : listing.status === "Approved" ? "معتمد" : listing.status === "Rejected" ? "مرفوض" : listing.status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailOwner(listing)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Buyer Detail Sheet ────────────────────────────────────────── */}
      <Sheet open={!!detailRequest} onOpenChange={() => setDetailRequest(null)}>
        <SheetContent side="bottom">
          {detailRequest && (() => {
            const req = detailRequest;
            const reqId = req.id != null ? String(req.id) : undefined;
            const fresh = isFresh(req.createdAt);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    تفاصيل طلب الباحث
                    {fresh && <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)] gap-1"><Flame className="h-3 w-3" />جديد</Badge>}
                  </SheetTitle>
                  <SheetDescription>باحث عن عقار</SheetDescription>
                </SheetHeader>
                <div className="py-4 max-w-lg mx-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={req.type === "Buy" || req.type === "شراء" ? "default" : "secondary"} className="text-sm px-3 py-1">
                      {req.type === "Buy" ? "شراء" : req.type === "Rent" ? "إيجار" : (req.type || "—")}
                    </Badge>
                    <p className="text-xl font-bold text-primary">{formatBudgetRange(req.minPrice, req.maxPrice)}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">الموقع</p><p className="font-bold text-sm">{req.city || "—"}</p></div></div>
                    <div className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">الغرف</p><p className="font-bold text-sm">{req.minBedrooms ?? req.maxBedrooms ?? "—"}</p></div></div>
                    <div className="flex items-center gap-2"><Bath className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">الحمامات</p><p className="font-bold text-sm">{req.bathrooms ?? "—"}</p></div></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">التاريخ</p><p className="font-bold text-sm">{req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: ar }) : "—"}</p></div></div>
                  </div>
                  {req.notes && <div><p className="text-xs text-muted-foreground mb-1">ملاحظات</p><p className="text-sm bg-muted/30 rounded-xl p-3">{req.notes}</p></div>}
                  <Separator />
                  <Button className="w-full gap-2" onClick={() => reqId && claimMutation.mutate({ requestId: reqId, source: req.source })} disabled={claimMutation.isPending}>
                    <Handshake className="h-4 w-4" />{claimMutation.isPending ? "..." : "استلام الطلب"}
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Owner Detail Sheet — Full Property Overview ────────────── */}
      <Sheet open={!!detailOwner} onOpenChange={() => setDetailOwner(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          {detailOwner && (() => {
            const l = detailOwner;
            const phone = l.mobileNumber || l.contactMobile || "";
            const photos: string[] = (() => {
              try {
                if (l.mainImageUrl && !l.mainImageUrl.startsWith("data:")) return [l.mainImageUrl];
                const gallery = l.imageGallery ?? [];
                const arr = typeof gallery === "string" ? JSON.parse(gallery) : gallery;
                return Array.isArray(arr) ? arr.filter((u: string) => u && !u.startsWith("data:image")) : [];
              } catch { return []; }
            })();
            const amenities = [
              { key: "hasParking", label: "موقف سيارات", value: l.hasParking },
              { key: "hasElevator", label: "مصعد", value: l.hasElevator },
              { key: "hasMaidsRoom", label: "غرفة خادمة", value: l.hasMaidsRoom },
              { key: "hasDriverRoom", label: "غرفة سائق", value: l.hasDriverRoom },
              { key: "furnished", label: "مفروش", value: l.furnished },
              { key: "balcony", label: "بلكونة", value: l.balcony },
              { key: "swimmingPool", label: "مسبح", value: l.swimmingPool },
              { key: "centralAc", label: "تكييف مركزي", value: l.centralAc },
            ].filter((a) => a.value);

            return (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {l.title || "عقار مالك"}
                    {l.listingType && <Badge variant="default">{l.listingType}</Badge>}
                    <Badge variant="outline">{l.status === "Pending" ? "بانتظار وسيط" : l.status === "Approved" ? "معتمد" : l.status || "—"}</Badge>
                  </SheetTitle>
                  <SheetDescription>
                    {l.propertyId && <span className="font-mono text-xs">#{l.propertyId}</span>}
                    {l.createdAt && <> · {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true, locale: ar })}</>}
                  </SheetDescription>
                </SheetHeader>

                <div className="py-4 max-w-3xl mx-auto space-y-5">

                  {/* Photos */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {photos.slice(0, 8).map((url, i) => (
                        <img key={i} src={url} alt={`${l.title} - ${i + 1}`} className={cn("w-full object-cover rounded-lg", i === 0 ? "col-span-2 row-span-2 h-48" : "h-24")} />
                      ))}
                    </div>
                  )}

                  {/* Price + Type header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {l.propertyType && <Badge variant="secondary">{l.propertyType}</Badge>}
                      {l.propertyCategory && <Badge variant="outline">{l.propertyCategory}</Badge>}
                    </div>
                    {l.price && (
                      <div className="text-end">
                        <p className="text-2xl font-black text-primary"><SarPrice value={l.price} /></p>
                        {l.paymentFrequency && <p className="text-xs text-muted-foreground">{l.paymentFrequency}</p>}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Location */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><MapPin size={14} />الموقع</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {l.region && <div><p className="text-xs text-muted-foreground">المنطقة</p><p className="font-bold">{l.region}</p></div>}
                      {l.city && <div><p className="text-xs text-muted-foreground">المدينة</p><p className="font-bold">{l.city}</p></div>}
                      {l.district && <div><p className="text-xs text-muted-foreground">الحي</p><p className="font-bold">{l.district}</p></div>}
                      {l.streetAddress && <div><p className="text-xs text-muted-foreground">الشارع</p><p className="font-bold">{l.streetAddress}</p></div>}
                    </div>
                  </div>

                  <Separator />

                  {/* Specifications */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><Building size={14} />المواصفات</p>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        { label: "غرف نوم", value: l.bedrooms, icon: BedDouble },
                        { label: "حمامات", value: l.bathrooms, icon: Bath },
                        { label: "صالات", value: l.livingRooms, icon: Home },
                        { label: "مطابخ", value: l.kitchens, icon: Home },
                        { label: "المساحة", value: l.areaSqm ? `${l.areaSqm} م²` : null, icon: Ruler },
                        { label: "الطابق", value: l.floorNumber ? `${l.floorNumber}/${l.totalFloors || "—"}` : null, icon: Building },
                      ].filter((s) => s.value != null).map((s, i) => (
                        <div key={i} className="text-center p-2 rounded-lg bg-muted/30">
                          <s.icon size={16} className="mx-auto mb-1 text-muted-foreground" />
                          <p className="text-sm font-black">{s.value}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                      {l.buildingYear && (
                        <div className="text-center p-2 rounded-lg bg-muted/30">
                          <CalendarIcon size={16} className="mx-auto mb-1 text-muted-foreground" />
                          <p className="text-sm font-black">{l.buildingYear}</p>
                          <p className="text-[10px] text-muted-foreground">سنة البناء</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-2">المرافق والخدمات</p>
                        <div className="flex flex-wrap gap-2">
                          {amenities.map((a) => (
                            <Badge key={a.key} variant="secondary" className="gap-1 text-xs">
                              <CheckCircle2 size={12} className="text-primary" />
                              {a.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  {l.description && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">الوصف</p>
                        <p className="text-sm leading-relaxed whitespace-pre-line bg-muted/30 rounded-xl p-4">{l.description}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Owner Contact Card */}
                  <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-bold">بيانات المالك — تواصل لتقديم خدمة الوساطة</p>
                      <div className="flex items-center gap-6">
                        {l.contactName && (
                          <span className="flex items-center gap-2 text-sm">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><User size={16} className="text-primary" /></div>
                            {l.contactName}
                          </span>
                        )}
                        {phone && (
                          <span className="flex items-center gap-2 text-sm font-mono" dir="ltr">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Phone size={16} className="text-primary" /></div>
                            {phone}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        {phone && (
                          <Button className="flex-1 gap-2" onClick={() => window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank")}>
                            <MessageSquare className="h-4 w-4" />
                            تواصل واتساب — عرض خدمة الوساطة
                          </Button>
                        )}
                        {phone && (
                          <Button variant="outline" className="gap-2" onClick={() => window.open(`tel:${phone}`)}>
                            <Phone className="h-4 w-4" />اتصال
                          </Button>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        تواصل مع المالك لعرض خدماتك كوسيط عقاري معتمد. اشرح خبرتك في المنطقة واعرض عليه عقد وساطة حصري.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── SMS Sheet ────────────────────────────────────────────────── */}
      <Sheet open={smsOpen} onOpenChange={(open) => { setSmsOpen(open); if (!open) { setSmsTargetId(null); smsForm.reset(); } }}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>إرسال رسالة نصية</SheetTitle>
          </SheetHeader>
          <Form {...smsForm}>
            <form onSubmit={smsForm.handleSubmit((data) => { if (smsTargetId) sendSmsMutation.mutate({ requestId: smsTargetId, message: data.message }); })} className="space-y-4 py-4 max-w-lg mx-auto">
              <FormField control={smsForm.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>نص الرسالة</FormLabel>
                  <FormControl><Textarea placeholder="اكتب رسالتك..." {...field} rows={4} maxLength={500} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setSmsOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={sendSmsMutation.isPending} className="gap-2">
                  <MessageSquare className="h-4 w-4" />{sendSmsMutation.isPending ? "..." : "إرسال"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
