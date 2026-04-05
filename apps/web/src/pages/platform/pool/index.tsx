/**
 * pool/index.tsx — Unified Customer Requests Pool (single table + detail drawer)
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Search, Ticket, MessageSquare, RefreshCw, Download,
  X, ChevronDown, Eye, Handshake, Clock, Flame,
  MapPin, BedDouble, Bath, Building, Sparkles,
  ArrowUpDown, Inbox, DollarSign, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiGet, apiPost } from "@/lib/apiClient";
import { toast } from "sonner";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { SarPrice } from "@/components/ui/sar-symbol";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface PoolRequest {
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
}

interface PoolPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PoolSearchResponse {
  success?: boolean;
  data?: PoolRequest[];
  pagination?: PoolPagination;
}

type SortField = "date" | "budget" | "city" | "type";
type SortDir = "asc" | "desc";

// ── Helpers ────────────────────────────────────────────────────────────────

const formatSAR = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US")}`;
};

const formatBudgetRange = (min?: number | null, max?: number | null): string => {
  if (min != null && max != null && min !== max) return `${formatSAR(min)} – ${formatSAR(max)}`;
  if (min != null) return formatSAR(min);
  if (max != null) return formatSAR(max);
  return "—";
};

const isFresh = (createdAt?: string | Date | null): boolean => {
  if (!createdAt) return false;
  const date = createdAt instanceof Date ? createdAt : new Date(String(createdAt));
  return differenceInHours(new Date(), date) < 24;
};

// ── Form Schema ────────────────────────────────────────────────────────────

const smsSchema = z.object({
  message: z.string().min(1, "يرجى إدخال الرسالة").max(500, "الحد الأقصى 500 حرف"),
});

// ── Main Component ─────────────────────────────────────────────────────────

export default function PoolPage() {
  const { dir, language } = useLanguage();
  const isAr = language === "ar";
  const dateLocale = isAr ? ar : enUS;
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [poolTypeFilter, setPoolTypeFilter] = useState<string>("all");
  const [poolSourceFilter, setPoolSourceFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [poolPage, setPoolPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const poolPageSize = 100;

  // Detail & SMS sheets
  const [detailRequest, setDetailRequest] = useState<PoolRequest | null>(null);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsTargetId, setSmsTargetId] = useState<string | null>(null);

  const smsForm = useForm<z.infer<typeof smsSchema>>({
    resolver: zodResolver(smsSchema),
    defaultValues: { message: "" },
  });

  // ── Query ────────────────────────────────────────────────────────────────

  const {
    data: poolData,
    isLoading: poolLoading,
    isError: poolIsError,
    error: poolError,
    refetch: poolRefetch,
  } = useQuery<PoolSearchResponse>({
    queryKey: ["/api/pool/search", searchQuery, poolPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(poolPage), pageSize: String(poolPageSize) });
      if (searchQuery) params.set("city", searchQuery);
      const json = await apiGet<PoolSearchResponse>(`api/pool/search?${params}`);
      const defaultPag: PoolPagination = { page: 1, pageSize: poolPageSize, total: 0, totalPages: 1 };
      if (!json || typeof json !== "object") return { success: false, data: [], pagination: defaultPag };
      return { success: json.success, data: json.data ?? [], pagination: { ...defaultPag, ...json.pagination } };
    },
    retry: 1,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
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
      toast.success(isAr ? "تم استلام الطلب بنجاح!" : "Request claimed successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/pool/search"] });
      setDetailRequest(null);
    },
    onError: () => {
      toast.error(isAr ? "فشل استلام الطلب. تم الوصول للحد الأقصى أو تم حجزه مسبقاً." : "Claim failed.");
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: async ({ requestId, message }: { requestId: string; message: string }) =>
      apiPost(`api/pool/customer-requests/${requestId}/send-sms`, { message }),
    onSuccess: () => {
      toast.success(isAr ? "تم إرسال الرسالة بنجاح" : "SMS sent");
      smsForm.reset();
      setSmsOpen(false);
      setSmsTargetId(null);
    },
    onError: (err: unknown) => {
      const raw = err instanceof Error ? err.message : String(err);
      toast.error(raw.includes("not configured") ? (isAr ? "خدمة الرسائل غير مفعّلة" : "SMS not configured") : (isAr ? "فشل إرسال الرسالة" : "SMS failed"));
    },
  });

  // ── Computed ──────────────────────────────────────────────────────────────

  const rawPool: PoolRequest[] = Array.isArray(poolData?.data) ? poolData.data : [];

  const topCities = useMemo(() => {
    const counts: Record<string, number> = {};
    rawPool.forEach((r) => { if (r.city) counts[r.city] = (counts[r.city] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
  }, [rawPool]);

  const filtered = useMemo(() => {
    let items = rawPool;
    if (poolTypeFilter !== "all") items = items.filter((r) => r.type === poolTypeFilter);
    if (poolSourceFilter !== "all") items = items.filter((r) => r.source === poolSourceFilter);
    if (cityFilter !== "all") items = items.filter((r) => r.city === cityFilter);
    return items;
  }, [rawPool, poolTypeFilter, poolSourceFilter, cityFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
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
  }, [filtered, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: rawPool.length,
    buy: rawPool.filter((r) => r.type === "Buy" || r.type === "شراء").length,
    rent: rawPool.filter((r) => r.type === "Rent" || r.type === "إيجار").length,
    fresh: rawPool.filter((r) => isFresh(r.createdAt)).length,
    customerReqs: rawPool.filter((r) => r.source === "customer_request").length,
  }), [rawPool]);

  // ── Sort toggle ──────────────────────────────────────────────────────────

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

  const activeFilters = [poolTypeFilter !== "all", poolSourceFilter !== "all", cityFilter !== "all"].filter(Boolean).length;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={PAGE_WRAPPER}>
      {/* Header */}
      <PageHeader
        title={isAr ? "مجمع الطلبات" : "Requests Pool"}
        subtitle={isAr ? "استعرض طلبات العملاء واستلمها" : "Browse and claim customer requests"}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/requests/export" target="_blank" rel="noreferrer">
              <Download className="h-4 w-4 me-1.5" />
              {isAr ? "تصدير" : "Export"}
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => poolRefetch()} disabled={poolLoading}>
            <RefreshCw className={cn("h-4 w-4", poolLoading && "animate-spin")} />
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </PageHeader>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      {(poolLoading || showSkeleton) ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Inbox, iconBg: "bg-primary/10", iconColor: "text-primary", value: stats.total, label: isAr ? "إجمالي الطلبات" : "Total" },
            { icon: Building, iconBg: "bg-accent", iconColor: "text-accent-foreground", value: stats.buy, label: isAr ? "شراء" : "Buy" },
            { icon: DollarSign, iconBg: "bg-secondary", iconColor: "text-secondary-foreground", value: stats.rent, label: isAr ? "إيجار" : "Rent" },
            { icon: Sparkles, iconBg: "bg-[hsl(var(--warning)/0.1)]", iconColor: "text-[hsl(var(--warning))]", value: stats.fresh, label: isAr ? "جديد اليوم" : "New Today" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.iconBg)}>
                  <s.icon className={cn("h-5 w-5", s.iconColor)} />
                </div>
                <div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Search + Filters ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Card className="flex items-center p-2">
          <Search className="ms-4 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={isAr ? "ابحث بالمدينة..." : "Search by city..."}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPoolPage(1); }}
            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")}><X className="h-4 w-4" /></Button>
          )}
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <Filter className="h-3.5 w-3.5" />
                {poolTypeFilter === "all" ? (isAr ? "النوع" : "Type") : poolTypeFilter === "Buy" ? (isAr ? "شراء" : "Buy") : (isAr ? "إيجار" : "Rent")}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPoolTypeFilter("all")}>{isAr ? "الكل" : "All"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPoolTypeFilter("Buy")}>{isAr ? "شراء" : "Buy"} ({stats.buy})</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPoolTypeFilter("Rent")}>{isAr ? "إيجار" : "Rent"} ({stats.rent})</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                {poolSourceFilter === "all" ? (isAr ? "المصدر" : "Source") : poolSourceFilter === "customer_request" ? (isAr ? "طلب عميل" : "Customer") : (isAr ? "مجمع" : "Pool")}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPoolSourceFilter("all")}>{isAr ? "الكل" : "All"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPoolSourceFilter("customer_request")}>{isAr ? "طلبات العملاء" : "Customer"} ({stats.customerReqs})</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPoolSourceFilter("buyer_pool")}>{isAr ? "مجمع المشترين" : "Buyer Pool"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* City chips */}
          {topCities.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-6" />
              {topCities.map((city) => (
                <Button
                  key={city}
                  size="sm"
                  variant={cityFilter === city ? "default" : "outline"}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setCityFilter(cityFilter === city ? "all" : city)}
                >
                  <MapPin className="h-3 w-3 me-1" />{city}
                </Button>
              ))}
            </>
          )}

          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => { setPoolTypeFilter("all"); setPoolSourceFilter("all"); setCityFilter("all"); }}>
              <X className="h-3 w-3" />{isAr ? "مسح" : "Clear"} ({activeFilters})
            </Button>
          )}

          <span className="ms-auto text-xs text-muted-foreground">{sorted.length} {isAr ? "طلب" : "requests"}</span>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {(poolLoading || showSkeleton) ? (
          <TableSkeleton rows={8} cols={8} />
        ) : poolIsError ? (
          <QueryErrorFallback
            message={`${isAr ? "فشل تحميل الطلبات" : "Failed to load"} ${poolError instanceof Error ? poolError.message : ""}`}
            onRetry={() => poolRefetch()}
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={isAr ? "لا توجد طلبات" : "No requests"}
            description={isAr ? "لا توجد طلبات متاحة حالياً" : "No requests available"}
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[850px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[44px]">#</TableHead>
                  <TableHead><SortHeader field="type">{isAr ? "النوع" : "Type"}</SortHeader></TableHead>
                  <TableHead><SortHeader field="city">{isAr ? "المدينة" : "City"}</SortHeader></TableHead>
                  <TableHead><SortHeader field="budget">{isAr ? "الميزانية" : "Budget"}</SortHeader></TableHead>
                  <TableHead>{isAr ? "المواصفات" : "Specs"}</TableHead>
                  <TableHead>{isAr ? "المصدر" : "Source"}</TableHead>
                  <TableHead><SortHeader field="date">{isAr ? "التاريخ" : "Date"}</SortHeader></TableHead>
                  <TableHead className="w-[110px]">{isAr ? "إجراء" : "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((req, idx) => {
                  const reqId = req.id != null ? String(req.id) : undefined;
                  const reqSource = req.source ?? "";
                  const fresh = isFresh(req.createdAt);

                  return (
                    <TableRow
                      key={reqId ?? `r-${idx}`}
                      className={cn("cursor-pointer hover:bg-muted/50 transition-colors", fresh && "bg-[hsl(var(--warning)/0.1)]/30")}
                      onClick={() => setDetailRequest(req)}
                    >
                      <TableCell className="text-muted-foreground tabular-nums text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <Badge variant={req.type === "Buy" || req.type === "شراء" ? "default" : "secondary"}>
                          {req.type === "Buy" ? (isAr ? "شراء" : "Buy") : req.type === "Rent" ? (isAr ? "إيجار" : "Rent") : (req.type || "—")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span>{req.city || "—"}</span>
                          {req.region && <span className="text-xs text-muted-foreground">({req.region})</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-primary tabular-nums">{formatBudgetRange(req.minPrice, req.maxPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5"><BedDouble className="h-3 w-3" />{req.minBedrooms ?? req.maxBedrooms ?? "—"}</span>
                          <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{req.bathrooms ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", reqSource === "customer_request" ? "border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))]" : "")}>
                          {reqSource === "customer_request" ? (isAr ? "عميل" : "Customer") : (isAr ? "مجمع" : "Pool")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {fresh && <Flame className="h-3.5 w-3.5 text-[hsl(var(--warning))] flex-shrink-0" />}
                          <span className="text-sm text-muted-foreground">
                            {req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: dateLocale }) : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => reqId && claimMutation.mutate({ requestId: reqId, source: reqSource })}
                            disabled={claimMutation.isPending}
                          >
                            <Handshake className="h-3.5 w-3.5" />
                            {isAr ? "استلام" : "Claim"}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailRequest(req)}>
                            <Eye className="h-3.5 w-3.5" />
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

      {/* Pagination */}
      {!poolLoading && (() => {
        const pag = poolData?.pagination;
        if (!pag || pag.totalPages <= 1) return null;
        return (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {((pag.page - 1) * pag.pageSize + 1).toLocaleString()}–{Math.min(pag.page * pag.pageSize, pag.total).toLocaleString()} {isAr ? "من" : "of"} {pag.total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPoolPage((p) => Math.max(1, p - 1))} disabled={poolPage <= 1}>{isAr ? "السابق" : "Prev"}</Button>
              <Button variant="outline" size="sm" onClick={() => setPoolPage((p) => Math.min(pag.totalPages, p + 1))} disabled={poolPage >= pag.totalPages}>{isAr ? "التالي" : "Next"}</Button>
            </div>
          </div>
        );
      })()}

      {/* ── Detail Sheet ─────────────────────────────────────────────── */}
      <Sheet open={!!detailRequest} onOpenChange={() => setDetailRequest(null)}>
        <SheetContent side="bottom">
          {detailRequest && (() => {
            const req = detailRequest;
            const reqId = req.id != null ? String(req.id) : undefined;
            const reqSource = req.source ?? "";
            const fresh = isFresh(req.createdAt);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {isAr ? "تفاصيل الطلب" : "Request Details"}
                    {fresh && <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)] gap-1"><Flame className="h-3 w-3" />{isAr ? "جديد" : "New"}</Badge>}
                  </SheetTitle>
                  <SheetDescription>
                    {reqSource === "customer_request" ? (isAr ? "طلب عميل مباشر" : "Direct customer request") : (isAr ? "من مجمع المشترين" : "From buyer pool")}
                  </SheetDescription>
                </SheetHeader>

                <div className="py-4 max-w-lg mx-auto space-y-4">
                  {/* Type + Budget */}
                  <div className="flex items-center justify-between">
                    <Badge variant={req.type === "Buy" || req.type === "شراء" ? "default" : "secondary"} className="text-sm px-3 py-1">
                      {req.type === "Buy" ? (isAr ? "شراء" : "Buy") : req.type === "Rent" ? (isAr ? "إيجار" : "Rent") : (req.type || "—")}
                    </Badge>
                    <p className="text-xl font-bold text-primary">{formatBudgetRange(req.minPrice, req.maxPrice)}</p>
                  </div>

                  <Separator />

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
                        <p className="font-bold text-sm">{req.city || "—"}{req.region ? ` · ${req.region}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p>
                        <p className="font-bold text-sm">
                          {req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: dateLocale }) : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{isAr ? "الغرف" : "Bedrooms"}</p>
                        <p className="font-bold text-sm">{req.minBedrooms ?? req.maxBedrooms ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{isAr ? "الحمامات" : "Bathrooms"}</p>
                        <p className="font-bold text-sm">{req.bathrooms ?? "—"}</p>
                      </div>
                    </div>
                  </div>

                  {req.livingRooms && (
                    <p className="text-sm text-muted-foreground">{isAr ? "الصالات:" : "Living rooms:"} <span className="font-bold text-foreground">{req.livingRooms}</span></p>
                  )}

                  {req.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{isAr ? "ملاحظات" : "Notes"}</p>
                      <p className="text-sm bg-muted/30 rounded-xl p-3">{req.notes}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => reqId && claimMutation.mutate({ requestId: reqId, source: reqSource })}
                      disabled={claimMutation.isPending}
                    >
                      <Handshake className="h-4 w-4" />
                      {claimMutation.isPending ? "..." : (isAr ? "استلام الطلب" : "Claim Request")}
                    </Button>
                    {reqSource === "customer_request" && req.canSendSms && (
                      <Button variant="outline" className="gap-2" onClick={() => { setSmsTargetId(reqId ?? null); setSmsOpen(true); }}>
                        <MessageSquare className="h-4 w-4" />
                        {isAr ? "رسالة" : "SMS"}
                      </Button>
                    )}
                  </div>
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
            <SheetTitle>{isAr ? "إرسال رسالة نصية" : "Send SMS"}</SheetTitle>
            <SheetDescription>{isAr ? "أرسل رسالة للعميل عبر SMS" : "Send an SMS to the customer"}</SheetDescription>
          </SheetHeader>
          <Form {...smsForm}>
            <form
              onSubmit={smsForm.handleSubmit((data) => { if (smsTargetId) sendSmsMutation.mutate({ requestId: smsTargetId, message: data.message }); })}
              className="space-y-4 py-4 max-w-lg mx-auto"
            >
              <FormField control={smsForm.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "نص الرسالة" : "Message"}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={isAr ? "اكتب رسالتك للعميل..." : "Write your message..."} {...field} rows={4} maxLength={500} />
                  </FormControl>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <FormMessage />
                    <span>{field.value?.length || 0}/500</span>
                  </div>
                </FormItem>
              )} />
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setSmsOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button type="submit" disabled={sendSmsMutation.isPending} className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {sendSmsMutation.isPending ? "..." : (isAr ? "إرسال" : "Send")}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
