import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Ticket, MessageSquare, RefreshCw, Download, Mail, Phone, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER, TYPOGRAPHY } from "@/config/platform-theme";
import { STATUS_COLORS } from "@/config/design-tokens";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/apiClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";

// --- Customer Requests helpers ---

const CONTRACT_LABELS: Record<string, string> = {
  buy: "شراء",
  rent: "إيجار",
};

const GENDER_LABELS: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
  other: "أخرى",
};

interface PropertySeekerRecord {
  seekerId?: string | null;
  seekerNum?: number | string | null;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  nationality?: string | null;
  age?: number | string | null;
  monthlyIncome?: number | string | null;
  gender?: string | null;
  typeOfProperty?: string | null;
  typeOfContract?: string | null;
  numberOfRooms?: number | string | null;
  numberOfBathrooms?: number | string | null;
  numberOfLivingRooms?: number | string | null;
  houseDirection?: string | null;
  budgetSize?: number | string | null;
  hasMaidRoom?: boolean | null;
  hasDriverRoom?: boolean | null;
  kitchenInstalled?: boolean | null;
  hasElevator?: boolean | null;
  parkingAvailable?: boolean | null;
  city?: string | null;
  district?: string | null;
  region?: string | null;
  otherComments?: string | null;
  notes?: string | null;
  sqm?: number | string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "object" && value !== null && typeof (value as { toString?: () => string }).toString === "function") {
    const parsed = Number((value as { toString: () => string }).toString());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatCurrency = (value: unknown): string => {
  const numeric = toNumber(value);
  if (numeric === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(numeric);
};

const formatNumber = (value: unknown): string => {
  const numeric = toNumber(value);
  if (numeric === null) return "—";
  return new Intl.NumberFormat("en-US").format(numeric);
};

const formatDateTime = (value: unknown): string => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

// --- Main Component ---

export default function Requests() {
    const { t, dir } = useLanguage();
    const showSkeleton = useMinLoadTime();
    const queryClient = useQueryClient();

    // ── Pool state ──
    const [searchQuery, setSearchQuery] = useState("");
    const [smsMessage, setSmsMessage] = useState("");
    const [smsDialogOpen, setSmsDialogOpen] = useState(false);
    const [smsTargetId, setSmsTargetId] = useState<string | null>(null);
    const [poolPage, setPoolPage] = useState(1);
    const poolPageSize = 100;

    useEffect(() => setPoolPage(1), [searchQuery]);

    interface PoolPagination {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    }

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
    }

    interface PoolSearchResponse {
        success?: boolean;
        data?: PoolRequest[];
        pagination?: PoolPagination;
    }

    const {
        data: poolData,
        isLoading: poolLoading,
        error: poolError,
        isError: poolIsError,
        refetch: poolRefetch,
    } = useQuery<PoolSearchResponse>({
        queryKey: ["/api/pool/search", searchQuery, poolPage],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(poolPage), pageSize: String(poolPageSize) });
            if (searchQuery) params.set("city", searchQuery);
            const json = await apiGet<PoolSearchResponse>(`api/pool/search?${params}`);
            const defaultPagination: PoolPagination = { page: 1, pageSize: poolPageSize, total: 0, totalPages: 1 };
            if (!json || typeof json !== "object") return { success: false, data: [], pagination: defaultPagination };
            const pagination = json.pagination && typeof json.pagination === "object"
                ? { ...defaultPagination, ...json.pagination } as PoolPagination
                : defaultPagination;
            return { success: json.success, data: json.data ?? [], pagination };
        },
        retry: 1,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    });

    const claimMutation = useMutation({
        mutationFn: async ({ requestId, source }: { requestId: string; source?: string }) => {
            if (source === "customer_request") {
                return apiPost(`api/pool/customer-requests/${requestId}/claim`, { notes: "Claimed from pool" });
            }
            return apiPost(`api/pool/${requestId}/claim`, { notes: "Quick claim via Platform" });
        },
        onSuccess: () => {
            toast.success("تم حجز الطلب بنجاح! تمت إضافته إلى خط الأنابيب.");
            queryClient.invalidateQueries({ queryKey: ["/api/pool/search"] });
        },
        onError: () => {
            toast.error("فشل حجز الطلب. تم الوصول للحد الأقصى أو تم حجزه مسبقاً.");
        },
    });

    const sendSmsMutation = useMutation({
        mutationFn: async ({ requestId, message }: { requestId: string; message: string }) =>
            apiPost(`api/pool/customer-requests/${requestId}/send-sms`, { message }),
        onSuccess: () => {
            toast.success("تم إرسال الرسالة بنجاح.");
            setSmsMessage("");
            setSmsDialogOpen(false);
            setSmsTargetId(null);
        },
        onError: (err: unknown) => {
            const raw = err instanceof Error ? err.message : String(err);
            let msg = "فشل إرسال الرسالة.";
            if (raw.includes("not configured")) msg = "خدمة الرسائل غير مفعّلة. تواصل مع المسؤول.";
            else if (raw.includes("Only agents or admins")) msg = "ليس لديك صلاحية إرسال رسائل.";
            else {
                try {
                    const jsonStart = raw.indexOf("{");
                    if (jsonStart >= 0) {
                        const obj = JSON.parse(raw.slice(jsonStart));
                        if (obj?.message) msg = obj.message;
                    }
                } catch {
                    const m = raw.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                    if (m) msg = m[1].replace(/\\"/g, '"');
                }
            }
            toast.error(msg);
        },
    });

    const poolRequests: PoolRequest[] = Array.isArray(poolData?.data) ? poolData.data : [];

    // ── Customer Requests state ──
    const {
        data: seekerData,
        isLoading: seekerLoading,
        isError: seekerIsError,
        error: seekerError,
        refetch: seekerRefetch,
        isFetching: seekerFetching,
    } = useQuery<PropertySeekerRecord[], Error>({
        queryKey: ["/api/requests"],
        queryFn: async () => {
            const body = await apiGet<PropertySeekerRecord[] | unknown>("api/requests");
            if (!Array.isArray(body)) return [];
            return body as PropertySeekerRecord[];
        },
        staleTime: 60_000,
    });

    const [seekerSearchTerm, setSeekerSearchTerm] = useState("");
    const seekers = seekerData ?? [];

    const filteredSeekers = useMemo(() => {
        const term = seekerSearchTerm.trim().toLowerCase();
        if (!term) return seekers;
        return seekers.filter((item) => {
            const values = [
                item.firstName, item.lastName, item.email, item.mobileNumber,
                item.city, item.district, item.region, item.typeOfProperty,
                item.typeOfContract, item.nationality, item.seekerId,
            ]
                .filter(Boolean)
                .map((v) => String(v).toLowerCase());
            return values.some((v) => v.includes(term));
        });
    }, [seekers, seekerSearchTerm]);

    const contractSummary = useMemo(() => {
        return seekers.reduce(
            (acc, s) => {
                const v = (s.typeOfContract ?? "").toLowerCase();
                if (v === "buy") acc.buy += 1;
                if (v === "rent") acc.rent += 1;
                return acc;
            },
            { buy: 0, rent: 0 },
        );
    }, [seekers]);

    // ── Render ──
    return (
        <div className={PAGE_WRAPPER} dir={dir}>
            <PageHeader
                title={t("requests.title") || "الطلبات"}
                subtitle={t("requests.subtitle") || "إدارة طلبات العملاء"}
            />

            <Tabs defaultValue="pool" className="w-full">
                <TabsList>
                    <TabsTrigger value="pool">{t("requests.pool") || "طلبات متاحة"}</TabsTrigger>
                    <TabsTrigger value="all">{t("requests.all") || "جميع الطلبات"}</TabsTrigger>
                </TabsList>

                {/* ═══════════ Tab 1 — Pool ═══════════ */}
                <TabsContent value="pool" className="space-y-6">
                    {/* Pool toolbar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                    >
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => void poolRefetch()}
                                disabled={poolLoading}
                            >
                                <RefreshCw className={cn("h-4 w-4", poolLoading && "animate-spin")} />
                                {t("pool.refresh")}
                            </Button>
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                <span>{t("pool.filter")}</span>
                            </Button>
                        </div>
                    </motion.div>

                    {/* Pool search */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Card className="flex items-center p-2">
                            <Search className="ms-4 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder={t("pool.search_placeholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                            />
                            <Badge variant="secondary" className="me-2 hidden sm:flex">
                                {t("pool.all_areas")}
                            </Badge>
                        </Card>
                    </motion.div>

                    {/* Pool table */}
                    <Card className="overflow-hidden">
                        {(poolLoading || showSkeleton) ? (
                            <TableSkeleton rows={6} cols={11} />
                        ) : poolIsError ? (
                            <QueryErrorFallback
                                message={`${t("pool.failed_load") || "فشل تحميل الطلبات"} ${poolError instanceof Error ? poolError.message : ""}`}
                                onRetry={() => void poolRefetch()}
                            />
                        ) : poolRequests.length === 0 ? (
                            <EmptyState
                                icon={Ticket}
                                title={t("pool.no_requests")}
                                description={t("pool.no_requests_hint")}
                            />
                        ) : (
                            <div dir={dir} className="w-full overflow-x-auto">
                                <Table className="min-w-[900px]">
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="text-start w-[140px]">{"الإجراءات"}</TableHead>
                                            <TableHead className="text-start">{"التاريخ"}</TableHead>
                                            <TableHead className="text-start">{"المصدر"}</TableHead>
                                            <TableHead className="text-start">{"ملاحظات"}</TableHead>
                                            <TableHead className="text-start">{"صالات"}</TableHead>
                                            <TableHead className="text-start">{"حمامات"}</TableHead>
                                            <TableHead className="text-start">{"غرف"}</TableHead>
                                            <TableHead className="text-start">{"الميزانية"}</TableHead>
                                            <TableHead className="text-start">{"المنطقة"}</TableHead>
                                            <TableHead className="text-start">{"المدينة"}</TableHead>
                                            <TableHead className="text-start">{"النوع"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {poolRequests.map((req, idx) => {
                                            const reqId = req.id != null ? String(req.id) : undefined;
                                            const reqSource = req.source != null ? String(req.source) : undefined;
                                            return (
                                            <TableRow key={reqId ?? `row-${idx}`}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {reqSource === "customer_request" && req.canSendSms && (
                                                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setSmsTargetId(reqId ?? null); setSmsDialogOpen(true); }}>
                                                                <MessageSquare className="h-4 w-4" />
                                                                {"رسالة"}
                                                            </Button>
                                                        )}
                                                        <Button size="sm" onClick={() => reqId && claimMutation.mutate({ requestId: reqId, source: reqSource })} disabled={claimMutation.isPending}>
                                                            {claimMutation.isPending ? "جاري..." : "استلام"}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {req.createdAt
                                                        ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: dir === "rtl" ? ar : undefined })
                                                        : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn("text-xs font-bold", reqSource === "customer_request" ? STATUS_COLORS.warning.text : "text-muted-foreground")}>
                                                        {reqSource === "customer_request" ? "طلب عميل" : "مجمع المشترين"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate text-muted-foreground" title={req.notes || ""}>{req.notes || "—"}</TableCell>
                                                <TableCell>{req.livingRooms ?? "—"}</TableCell>
                                                <TableCell>{req.bathrooms ?? "—"}</TableCell>
                                                <TableCell>{req.minBedrooms ?? req.maxBedrooms ?? "—"}</TableCell>
                                                <TableCell className="font-bold text-primary">
                                                    {req.minPrice != null && req.maxPrice != null
                                                        ? `${Number(req.minPrice).toLocaleString("en-US")} - ${Number(req.maxPrice).toLocaleString("en-US")}`
                                                        : req.minPrice != null ? Number(req.minPrice).toLocaleString("en-US") : "—"}
                                                </TableCell>
                                                <TableCell>{req.region || "—"}</TableCell>
                                                <TableCell>{req.city || "—"}</TableCell>
                                                <TableCell>
                                                    <Badge variant={req.type === "Buy" || req.type === "شراء" ? "info" : "purple"}>{req.type || "—"}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Card>

                    {/* Pool pagination */}
                    {!poolLoading && (() => {
                        const pag = poolData?.pagination;
                        if (!pag || pag.totalPages <= 1) return null;
                        return (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {t("pool.showing")} {((pag.page - 1) * pag.pageSize + 1).toLocaleString("en-US")}–{Math.min(pag.page * pag.pageSize, pag.total).toLocaleString("en-US")} {t("pool.pagination_of")} {pag.total.toLocaleString("en-US")}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPoolPage((p) => Math.max(1, p - 1))} disabled={poolPage <= 1}>
                                        {t("pool.previous")}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setPoolPage((p) => Math.min(pag.totalPages, p + 1))} disabled={poolPage >= pag.totalPages}>
                                        {t("pool.next")}
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </TabsContent>

                {/* ═══════════ Tab 2 — All Requests ═══════════ */}
                <TabsContent value="all" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-2 text-end">
                                <CardTitle className={TYPOGRAPHY.sectionTitle}>
                                    {t("requests.seekers_title") || "قاعدة بيانات العملاء الباحثين عن العقار"}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {`إجمالي ${seekers.length} طلب مسجل`} • {`شراء: ${contractSummary.buy}`} • {`إيجار: ${contractSummary.rent}`}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => seekerRefetch()}
                                    disabled={seekerFetching}
                                    aria-label={t("requests.refresh") || "تحديث القائمة"}
                                >
                                    <RefreshCcw className={`h-4 w-4 ${seekerFetching ? "animate-spin" : ""}`} />
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href="/api/requests/export" target="_blank" rel="noreferrer">
                                        <Download className={cn("me-2", "h-4 w-4")} />
                                        {t("requests.export_csv") || "تحميل CSV"}
                                    </a>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {filteredSeekers.length === seekers.length
                                        ? t("requests.showing_all") || "يعرض جميع الطلبات"
                                        : `${t("requests.showing") || "يعرض"} ${filteredSeekers.length} ${t("requests.of") || "من"} ${seekers.length} ${t("requests.request") || "طلب"}`}
                                </div>
                                <div className="w-full sm:w-72">
                                    <Input
                                        value={seekerSearchTerm}
                                        onChange={(e) => setSeekerSearchTerm(e.target.value)}
                                        placeholder={t("requests.search_placeholder") || "بحث بالاسم، المدينة، البريد أو الجوال"}
                                        className="text-end"
                                    />
                                </div>
                            </div>

                            {seekerLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                                    ))}
                                </div>
                            ) : seekerIsError ? (
                                <QueryErrorFallback
                                    message={seekerError?.message || t("requests.load_error") || "تعذر تحميل قائمة الطلبات"}
                                    onRetry={() => seekerRefetch()}
                                />
                            ) : filteredSeekers.length === 0 ? (
                                <EmptyState
                                    title={t("requests.no_match") || "لا توجد طلبات مطابقة"}
                                    description={t("requests.no_match_hint") || "لا توجد طلبات مطابقة لخيارات البحث الحالية."}
                                />
                            ) : (
                                <Card className="overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[16%]">{t("requests.col_name") || "الاسم"}</TableHead>
                                                <TableHead className="w-[20%]">{t("requests.col_contact") || "بيانات التواصل"}</TableHead>
                                                <TableHead className="w-[20%]">{t("requests.col_preferences") || "التفضيلات"}</TableHead>
                                                <TableHead className="w-[18%]">{t("requests.col_budget") || "الميزانية والدخل"}</TableHead>
                                                <TableHead className="w-[14%]">{t("requests.col_location") || "الموقع"}</TableHead>
                                                <TableHead className="w-[12%]">{t("requests.col_date") || "تاريخ التسجيل"}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSeekers.map((seeker, index) => {
                                                const fullName = `${seeker.firstName ?? ""} ${seeker.lastName ?? ""}`.trim() || "—";
                                                const contractLabel = seeker.typeOfContract
                                                    ? CONTRACT_LABELS[seeker.typeOfContract] ?? seeker.typeOfContract
                                                    : null;
                                                const genderLabel = seeker.gender ? GENDER_LABELS[seeker.gender] ?? seeker.gender : null;
                                                const createdLabel = formatDateTime(seeker.createdAt);
                                                const updatedLabel = formatDateTime(seeker.updatedAt);
                                                const rowKey = seeker.seekerId
                                                    ?? (seeker.seekerNum !== undefined && seeker.seekerNum !== null
                                                        ? String(seeker.seekerNum)
                                                        : `${seeker.email ?? ""}-${seeker.mobileNumber ?? index}`);

                                                return (
                                                    <TableRow key={rowKey}>
                                                        <TableCell>
                                                            <div className="flex flex-col items-end gap-1 text-end">
                                                                <span className="font-semibold">{fullName}</span>
                                                                {seeker.seekerId && (
                                                                    <span className="text-xs text-muted-foreground">معرف: {seeker.seekerId}</span>
                                                                )}
                                                                {genderLabel && (
                                                                    <span className="text-xs text-muted-foreground">الجنس: {genderLabel}</span>
                                                                )}
                                                                {seeker.age && (
                                                                    <span className="text-xs text-muted-foreground">العمر: {seeker.age}</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-2 text-end text-sm">
                                                                {seeker.mobileNumber && (
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <span>{seeker.mobileNumber}</span>
                                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                                {seeker.email && (
                                                                    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                                                        <span className="max-w-[220px] truncate ltr:text-start rtl:text-end">{seeker.email}</span>
                                                                        <Mail className="h-3.5 w-3.5" />
                                                                    </div>
                                                                )}
                                                                {seeker.nationality && (
                                                                    <div className="text-xs text-muted-foreground">الجنسية: {seeker.nationality}</div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col items-end gap-2 text-end text-sm">
                                                                {seeker.typeOfProperty && (
                                                                    <Badge variant="secondary" className="w-fit">
                                                                        {seeker.typeOfProperty}
                                                                    </Badge>
                                                                )}
                                                                {contractLabel && (
                                                                    <Badge variant="outline" className="w-fit">
                                                                        {contractLabel}
                                                                    </Badge>
                                                                )}
                                                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                                    <span>غرف: {seeker.numberOfRooms ?? "—"}</span>
                                                                    <span>حمامات: {seeker.numberOfBathrooms ?? "—"}</span>
                                                                    <span>صالات: {seeker.numberOfLivingRooms ?? "—"}</span>
                                                                </div>
                                                                {seeker.houseDirection && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        اتجاه: {seeker.houseDirection}
                                                                    </span>
                                                                )}
                                                                {(seeker.otherComments || seeker.notes) && (
                                                                    <span className="text-xs text-muted-foreground max-w-xs truncate">
                                                                        ملاحظات: {(seeker.otherComments || seeker.notes) ?? ""}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col items-end gap-1 text-end text-sm">
                                                                <span className="font-semibold text-primary">
                                                                    {formatCurrency(seeker.budgetSize)}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    الدخل الشهري: {formatCurrency(seeker.monthlyIncome)}
                                                                </span>
                                                                {seeker.sqm && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        المساحة: {formatNumber(seeker.sqm)} م²
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col items-end gap-1 text-end text-sm">
                                                                <span>
                                                                    {[seeker.city, seeker.district].filter(Boolean).join("، ") || "—"}
                                                                </span>
                                                                {seeker.region && (
                                                                    <span className="text-xs text-muted-foreground">المنطقة: {seeker.region}</span>
                                                                )}
                                                                {seeker.hasMaidRoom && (
                                                                    <span className="text-xs text-muted-foreground">غرفة خادمة</span>
                                                                )}
                                                                {seeker.hasDriverRoom && (
                                                                    <span className="text-xs text-muted-foreground">غرفة سائق</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col items-end gap-1 text-end text-sm">
                                                                <span>{createdLabel}</span>
                                                                {seeker.updatedAt && updatedLabel !== createdLabel && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        آخر تحديث: {updatedLabel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                  </div>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── Bottom Drawer: Send SMS ── */}
            <Sheet open={smsDialogOpen} onOpenChange={(open) => {
                setSmsDialogOpen(open);
                if (!open) { setSmsTargetId(null); setSmsMessage(""); }
            }}>
                <SheetContent side="bottom">
                    <SheetHeader>
                        <SheetTitle>{t("pool.sms_title")}</SheetTitle>
                        <SheetDescription>{t("pool.sms_description")}</SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-2 py-4 max-w-lg mx-auto">
                        <Label htmlFor="sms-body">{t("pool.sms_message")}</Label>
                        <Textarea
                            id="sms-body"
                            placeholder={t("pool.sms_placeholder")}
                            value={smsMessage}
                            onChange={(e) => setSmsMessage(e.target.value)}
                            rows={4}
                            maxLength={500}
                        />
                    </div>
                    <SheetFooter className="max-w-lg mx-auto">
                        <Button
                            onClick={() => {
                                if (!smsMessage.trim() || !smsTargetId) return;
                                sendSmsMutation.mutate({ requestId: smsTargetId, message: smsMessage });
                            }}
                            disabled={sendSmsMutation.isPending || !smsMessage.trim()}
                        >
                            {sendSmsMutation.isPending ? "..." : t("pool.send_sms")}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
