/**
 * broker-requests/index.tsx — Agent collaboration marketplace
 *
 * Agents post their listings for co-marketing. Other agents accept
 * and market the property in exchange for an agreed commission split.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Plus, Search, Handshake, Users, Building, MapPin, DollarSign,
  Percent, ChevronDown, Eye, CheckCircle, XCircle, X, Clock,
  RefreshCw, Send, Sparkles, UserCheck, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { CardGridSkeleton } from "@/components/skeletons/page-skeletons";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { SarPrice } from "@/components/ui/sar-symbol";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface BrokerAcceptance {
  id: string;
  marketingAgentId: string;
  status: string;
  notes?: string;
  agreedRate?: number;
  createdAt: string;
  marketingAgent: { id: string; firstName: string; lastName: string };
}

interface BrokerRequest {
  id: string;
  listingAgentId: string;
  title: string;
  description?: string;
  propertyType?: string;
  city?: string;
  district?: string;
  price?: number;
  commissionRate: number;
  commissionType: string;
  fixedCommission?: number;
  status: string;
  expiresAt?: string;
  createdAt: string;
  listingAgent: { id: string; firstName: string; lastName: string; organizationId?: string };
  organization?: { id: string; tradeName: string };
  property?: { id: string; title: string; city: string; district?: string; price?: number; type?: string; photos?: string };
  acceptances: BrokerAcceptance[];
}

const STATUS_MAP: Record<string, { label: string; labelEn: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  OPEN: { label: "مفتوح", labelEn: "Open", variant: "default" },
  ACCEPTED: { label: "مقبول", labelEn: "Accepted", variant: "secondary" },
  IN_PROGRESS: { label: "قيد التنفيذ", labelEn: "In Progress", variant: "secondary" },
  COMPLETED: { label: "مكتمل", labelEn: "Completed", variant: "outline" },
  CANCELLED: { label: "ملغي", labelEn: "Cancelled", variant: "destructive" },
  EXPIRED: { label: "منتهي", labelEn: "Expired", variant: "outline" },
};

// ── Form Schemas ───────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب (3 أحرف على الأقل)"),
  description: z.string().max(2000).optional(),
  propertyType: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  price: z.coerce.number().positive("السعر يجب أن يكون أكبر من صفر").optional().or(z.literal("")),
  commissionRate: z.coerce.number().min(0.5, "الحد الأدنى 0.5%").max(50, "الحد الأقصى 50%"),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  fixedCommission: z.coerce.number().positive().optional().or(z.literal("")),
});

const acceptSchema = z.object({
  notes: z.string().max(1000).optional(),
  agreedRate: z.coerce.number().min(0.5).max(50).optional().or(z.literal("")),
});

// ── Helpers ────────────────────────────────────────────────────────────────

const formatSAR = (val?: number | null): string => {
  if (!val) return "—";
  return `${Number(val).toLocaleString("en-US")}`;
};

// ── Main Component ─────────────────────────────────────────────────────────

export default function BrokerRequestsPage() {
  const { dir, language } = useLanguage();
  const isAr = language === "ar";
  const dateLocale = isAr ? ar : enUS;
  const { toast } = useToast();
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<BrokerRequest | null>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptTargetId, setAcceptTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Query ────────────────────────────────────────────────────────────────

  const { data: requests, isLoading, isError, refetch } = useQuery<BrokerRequest[]>({
    queryKey: ["/api/broker-requests"],
    queryFn: () => apiGet<BrokerRequest[]>("api/broker-requests"),
  });

  // ─�� Mutations ────────────────────────────────────────────────────────────

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", description: "", commissionRate: 2.5, commissionType: "PERCENTAGE", city: "", propertyType: "" },
  });

  const acceptForm = useForm<z.infer<typeof acceptSchema>>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("api/broker-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker-requests"] });
      setIsCreateOpen(false);
      createForm.reset();
      toast({ title: isAr ? "تم إنشاء الطلب" : "Request created" });
    },
    onError: () => toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" }),
  });

  const acceptMutation = useMutation({
    mutationFn: (data: any) => apiPost(`api/broker-requests/${acceptTargetId}/accept`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker-requests"] });
      setAcceptOpen(false);
      setAcceptTargetId(null);
      acceptForm.reset();
      toast({ title: isAr ? "تم تقديم طلب التعاون" : "Collaboration request sent" });
    },
    onError: (err: any) => toast({ title: err?.message || (isAr ? "خطأ" : "Error"), variant: "destructive" }),
  });

  const updateAcceptanceMutation = useMutation({
    mutationFn: ({ requestId, acceptId, status }: { requestId: string; acceptId: string; status: string }) =>
      apiPatch(`api/broker-requests/${requestId}/acceptances/${acceptId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker-requests"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`api/broker-requests/${id}`, { status: "CANCELLED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker-requests"] });
      setDetailItem(null);
      toast({ title: isAr ? "تم الإلغاء" : "Cancelled" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`api/broker-requests/${id}`, { status: "COMPLETED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker-requests"] });
      setDetailItem(null);
      toast({ title: isAr ? "تم إكمال الصفقة" : "Deal completed" });
    },
  });

  // ── Computed ──────────────────────────────────────────────────────────────

  const allRequests = requests ?? [];

  const topCities = useMemo(() => {
    const counts: Record<string, number> = {};
    allRequests.forEach((r) => { if (r.city) counts[r.city] = (counts[r.city] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
  }, [allRequests]);

  const filtered = useMemo(() => {
    let items = allRequests;
    if (statusFilter !== "all") items = items.filter((r) => r.status === statusFilter);
    if (cityFilter !== "all") items = items.filter((r) => r.city === cityFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.listingAgent.firstName.toLowerCase().includes(q) ||
        r.listingAgent.lastName.toLowerCase().includes(q)
      );
    }
    return items;
  }, [allRequests, statusFilter, cityFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: allRequests.length,
    open: allRequests.filter((r) => r.status === "OPEN").length,
    accepted: allRequests.filter((r) => r.status === "ACCEPTED" || r.status === "IN_PROGRESS").length,
    completed: allRequests.filter((r) => r.status === "COMPLETED").length,
  }), [allRequests]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title={isAr ? "طلبات التعاون" : "Broker Requests"} />
        <QueryErrorFallback message={isAr ? "فشل تحميل الطلبات" : "Failed to load"} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title={isAr ? "طلبات التعاون" : "Broker Requests"} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>)}
        </div>
        <CardGridSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader
        title={isAr ? "طلبات التعاون" : "Broker Requests"}
        subtitle={isAr ? "تعاون مع وسطاء آخرين لتسويق العقارات مقابل عمولة متفق عليها" : "Collaborate with other agents to market properties for an agreed commission"}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 me-1.5", isLoading && "animate-spin")} />
            {isAr ? "تحديث" : "Refresh"}
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 me-1.5" />
            {isAr ? "طلب جديد" : "New Request"}
          </Button>
        </div>
      </PageHeader>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Handshake, bg: "bg-primary/10", color: "text-primary", value: stats.total, label: isAr ? "إجمالي" : "Total" },
          { icon: Sparkles, bg: "bg-primary/10", color: "text-primary", value: stats.open, label: isAr ? "مفتوح" : "Open" },
          { icon: Users, bg: "bg-accent", color: "text-accent-foreground", value: stats.accepted, label: isAr ? "قيد التعاون" : "Active" },
          { icon: CheckCircle, bg: "bg-[hsl(var(--warning)/0.1)]", color: "text-[hsl(var(--warning))]", value: stats.completed, label: isAr ? "مكتمل" : "Completed" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search + Filters ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Card className="flex items-center p-2">
          <Search className="ms-4 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={isAr ? "ابحث بالعنوان، المدينة، أو اسم الوسيط..." : "Search by title, city, or agent..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          {searchQuery && <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")}><X className="h-4 w-4" /></Button>}
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                {statusFilter === "all" ? (isAr ? "الحالة" : "Status") : (STATUS_MAP[statusFilter]?.[isAr ? "label" : "labelEn"] ?? statusFilter)}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>{isAr ? "الكل" : "All"}</DropdownMenuItem>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)}>{isAr ? val.label : val.labelEn}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* City chips */}
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

          {(statusFilter !== "all" || cityFilter !== "all") && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => { setStatusFilter("all"); setCityFilter("all"); }}>
              <X className="h-3 w-3" />{isAr ? "مسح" : "Clear"}
            </Button>
          )}

          <span className="ms-auto text-xs text-muted-foreground">{filtered.length} {isAr ? "طلب" : "requests"}</span>
        </div>
      </div>

      {/* ── Request Cards ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={isAr ? "لا توجد طلبات تعاون" : "No broker requests"}
          description={isAr ? "أنشئ طلبًا جديدًا لدعوة وسطاء آخرين لتسويق عقارك" : "Create a request to invite other agents to market your property"}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((req) => {
            const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.OPEN;
            const agentName = `${req.listingAgent.firstName} ${req.listingAgent.lastName}`;
            const approvedCount = req.acceptances.filter((a) => a.status === "APPROVED").length;
            const pendingCount = req.acceptances.filter((a) => a.status === "PENDING").length;

            return (
              <Card
                key={req.id}
                className={cn("cursor-pointer hover:shadow-md transition-shadow", req.status === "CANCELLED" && "opacity-60")}
                onClick={() => setDetailItem(req)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2 flex-1">{req.title}</h3>
                    <Badge variant={statusInfo.variant}>{isAr ? statusInfo.label : statusInfo.labelEn}</Badge>
                  </div>

                  {/* Property info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {req.city && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.city}{req.district ? ` · ${req.district}` : ""}</span>
                    )}
                    {req.propertyType && (
                      <span className="flex items-center gap-1"><Building className="h-3 w-3" />{req.propertyType}</span>
                    )}
                    {req.price && (
                      <span className="flex items-center gap-1 text-primary font-bold"><DollarSign className="h-3 w-3" /><SarPrice value={req.price} /></span>
                    )}
                  </div>

                  {/* Commission */}
                  <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                    <Percent className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {req.commissionType === "FIXED" ? <><SarPrice value={req.fixedCommission} /></> : `${Number(req.commissionRate)}%`}
                      </p>
                      <p className="text-[10px] text-primary">{isAr ? "العمولة المتفق عليها" : "Agreed commission"}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>{agentName}</span>
                      {req.organization && <span className="text-[10px]">({req.organization.tradeName})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingCount > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))]">
                          <Clock className="h-2.5 w-2.5" />{pendingCount}
                        </Badge>
                      )}
                      {approvedCount > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 border-primary/30 text-primary">
                          <CheckCircle className="h-2.5 w-2.5" />{approvedCount}
                        </Badge>
                      )}
                      <span className="text-muted-foreground">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: dateLocale })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Detail Sheet ─────────────────────────────────────────────── */}
      <Sheet open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          {detailItem && (() => {
            const req = detailItem;
            const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.OPEN;
            const agentName = `${req.listingAgent.firstName} ${req.listingAgent.lastName}`;
            const isOwner = true; // The API only returns own + open, so detail actions are contextual

            return (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {req.title}
                    <Badge variant={statusInfo.variant}>{isAr ? statusInfo.label : statusInfo.labelEn}</Badge>
                  </SheetTitle>
                  <SheetDescription>{req.description || (isAr ? "لا يوجد وصف" : "No description")}</SheetDescription>
                </SheetHeader>

                <div className="py-4 max-w-2xl mx-auto space-y-4">
                  {/* Property + Commission */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {req.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
                            <p className="font-bold text-sm">{req.city}{req.district ? ` · ${req.district}` : ""}</p>
                          </div>
                        </div>
                      )}
                      {req.propertyType && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isAr ? "نوع العقار" : "Property Type"}</p>
                            <p className="font-bold text-sm">{req.propertyType}</p>
                          </div>
                        </div>
                      )}
                      {req.price && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isAr ? "السعر" : "Price"}</p>
                            <p className="font-bold text-primary"><SarPrice value={req.price} /></p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="bg-primary/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Percent className="h-4 w-4 text-primary" />
                          <p className="text-xs text-primary">{isAr ? "العمولة" : "Commission"}</p>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {req.commissionType === "FIXED" ? <><SarPrice value={req.fixedCommission} /></> : `${Number(req.commissionRate)}%`}
                        </p>
                        {req.price && req.commissionType === "PERCENTAGE" && (
                          <p className="text-xs text-primary mt-1">
                            ≈ <SarPrice value={Number(req.price) * Number(req.commissionRate) / 100} />
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{isAr ? "الوسيط" : "Listing Agent"}</p>
                          <p className="font-bold">{agentName}</p>
                          {req.organization && <p className="text-xs text-muted-foreground">{req.organization.tradeName}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acceptances / Collaborators */}
                  {req.acceptances.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {isAr ? `طلبات التعاون (${req.acceptances.length})` : `Collaboration Requests (${req.acceptances.length})`}
                        </h4>
                        <div className="space-y-2">
                          {req.acceptances.map((acc) => (
                            <div key={acc.id} className="flex items-center justify-between rounded-xl border p-3">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                  {acc.marketingAgent.firstName[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{acc.marketingAgent.firstName} {acc.marketingAgent.lastName}</p>
                                  {acc.notes && <p className="text-xs text-muted-foreground line-clamp-1">{acc.notes}</p>}
                                  {acc.agreedRate && <p className="text-xs text-primary">{isAr ? "العمولة المقترحة:" : "Proposed:"} {Number(acc.agreedRate)}%</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={acc.status === "APPROVED" ? "default" : acc.status === "REJECTED" ? "destructive" : "outline"}>
                                  {acc.status === "PENDING" ? (isAr ? "بانتظار" : "Pending") : acc.status === "APPROVED" ? (isAr ? "مقبول" : "Approved") : acc.status === "REJECTED" ? (isAr ? "مرفوض" : "Rejected") : acc.status}
                                </Badge>
                                {acc.status === "PENDING" && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                                      onClick={(e) => { e.stopPropagation(); updateAcceptanceMutation.mutate({ requestId: req.id, acceptId: acc.id, status: "APPROVED" }); }}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => { e.stopPropagation(); updateAcceptanceMutation.mutate({ requestId: req.id, acceptId: acc.id, status: "REJECTED" }); }}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {req.status === "OPEN" && (
                      <Button
                        className="flex-1 gap-2"
                        onClick={() => { setAcceptTargetId(req.id); setAcceptOpen(true); }}
                      >
                        <Send className="h-4 w-4" />
                        {isAr ? "تقديم طلب تعاون" : "Apply to Collaborate"}
                      </Button>
                    )}
                    {(req.status === "OPEN" || req.status === "ACCEPTED") && (
                      <Button
                        variant="outline"
                        className="gap-2 text-destructive"
                        onClick={() => cancelMutation.mutate(req.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                        {isAr ? "إلغاء" : "Cancel"}
                      </Button>
                    )}
                    {(req.status === "ACCEPTED" || req.status === "IN_PROGRESS") && (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => completeMutation.mutate(req.id)}
                        disabled={completeMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {isAr ? "إكمال الصفقة" : "Mark Complete"}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Create Sheet ─────────────────────────────────────────────── */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{isAr ? "طلب تعاون جديد" : "New Broker Request"}</SheetTitle>
            <SheetDescription>
              {isAr ? "أدخل تفاصيل العقار والعمولة لدعوة وسطاء آخرين" : "Enter property details and commission to invite other agents"}
            </SheetDescription>
          </SheetHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate({ ...data, price: data.price || undefined, fixedCommission: data.fixedCommission || undefined }))} className="space-y-4 py-4 max-w-lg mx-auto">
              {/* Title */}
              <FormField control={createForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "عنوان الطلب" : "Request Title"} *</FormLabel>
                  <FormControl><Input {...field} placeholder={isAr ? "��ثال: فيلا فاخرة في الرياض — عمولة 2%" : "e.g. Luxury villa in Riyadh — 2% commission"} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Description */}
              <FormField control={createForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "الوصف" : "Description"}</FormLabel>
                  <FormControl><Textarea {...field} placeholder={isAr ? "تفاصيل العقار وشروط التعاون..." : "Property details and collaboration terms..."} rows={3} /></FormControl>
                </FormItem>
              )} />

              {/* City + Property Type */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createForm.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isAr ? "المدينة" : "City"}</FormLabel>
                    <FormControl><Input {...field} placeholder={isAr ? "الرياض" : "Riyadh"} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="propertyType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isAr ? "نوع العقار" : "Property Type"}</FormLabel>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                          {field.value || (isAr ? "اختر..." : "Select...")}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {[isAr ? "فيلا" : "Villa", isAr ? "شقة" : "Apartment", isAr ? "أرض" : "Land", isAr ? "عمارة" : "Building", isAr ? "��جاري" : "Commercial", isAr ? "دوبلكس" : "Duplex"].map((t) => (
                          <DropdownMenuItem key={t} onClick={() => createForm.setValue("propertyType", t)}>{t}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FormItem>
                )} />
              </div>

              {/* Price + Commission */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createForm.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isAr ? "السعر" : "Price (SAR)"}</FormLabel>
                    <FormControl><Input type="number" {...field} placeholder="1,000,000" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="commissionRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isAr ? "نسبة العمولة %" : "Commission %"} *</FormLabel>
                    <FormControl><Input type="number" step="0.5" min="0.5" max="50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* REGA Commission Cap Warning */}
              {Number(createForm.watch("commissionRate")) > 2.5 && (
                <div className="rounded-xl bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.2)] p-3 text-sm text-[hsl(var(--warning))]">
                  <p className="font-bold">{isAr ? "تنبيه: تجاوز الحد النظامي للعمولة" : "Warning: Exceeds regulatory commission cap"}</p>
                  <p className="text-xs mt-1">
                    {isAr
                      ? "نسبة العمولة تتجاوز الحد النظامي (2.5%) حسب نظام الوساطة العقارية. يجب توثيق النسبة المتفق عليها في عقد الوساطة الموقّع بين الطرفين."
                      : "Commission exceeds the 2.5% regulatory cap per Saudi Brokerage Law. Must be documented in a signed brokerage contract."}
                  </p>
                </div>
              )}

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {createMutation.isPending ? "..." : (isAr ? "نشر الطلب" : "Publish")}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* ── Accept/Apply Sheet ───────────────────────────────────────── */}
      <Sheet open={acceptOpen} onOpenChange={(open) => { setAcceptOpen(open); if (!open) { setAcceptTargetId(null); acceptForm.reset(); } }}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{isAr ? "تقديم طلب تعاون" : "Apply to Collaborate"}</SheetTitle>
            <SheetDescription>{isAr ? "أرسل طلبك للتعاون مع الوسيط على تسويق هذا العقار" : "Send your request to collaborate with the listing agent"}</SheetDescription>
          </SheetHeader>
          <Form {...acceptForm}>
            <form onSubmit={acceptForm.handleSubmit((data) => acceptMutation.mutate({ ...data, agreedRate: data.agreedRate || undefined }))} className="space-y-4 py-4 max-w-lg mx-auto">
              <FormField control={acceptForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "رسالة للوسيط" : "Message to Agent"}</FormLabel>
                  <FormControl><Textarea {...field} placeholder={isAr ? "اشرح خبرتك وكيف ستسوّق العقار..." : "Explain your experience and marketing plan..."} rows={3} /></FormControl>
                </FormItem>
              )} />
              <FormField control={acceptForm.control} name="agreedRate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "العمولة المقترحة % (اختياري)" : "Proposed Commission % (optional)"}</FormLabel>
                  <FormControl><Input type="number" step="0.5" min="0.5" max="50" {...field} placeholder={isAr ? "اتركه فارغًا للموافقة على العرض" : "Leave empty to accept the offer"} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setAcceptOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button type="submit" disabled={acceptMutation.isPending} className="gap-2">
                  <Send className="h-4 w-4" />
                  {acceptMutation.isPending ? "..." : (isAr ? "إرسال" : "Submit")}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
