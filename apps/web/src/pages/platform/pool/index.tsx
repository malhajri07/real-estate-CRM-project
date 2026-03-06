import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Ticket, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function PoolPage() {
    const { t, dir } = useLanguage();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [smsMessage, setSmsMessage] = useState("");
    const [smsDialogOpen, setSmsDialogOpen] = useState(false);
    const [smsTargetId, setSmsTargetId] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const pageSize = 100;

    useEffect(() => setPage(1), [searchQuery]);

    const { data, isLoading, error, isError, refetch } = useQuery({
        queryKey: ["/api/pool/search", searchQuery, page],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (searchQuery) params.set("city", searchQuery);
            const res = await apiRequest("GET", `/api/pool/search?${params}`);
            const json = await res.json();
            if (!json || typeof json !== "object") return { success: false, data: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };
            return { success: json.success, data: json.data ?? [], pagination: json.pagination ?? { page: 1, pageSize, total: 0, totalPages: 1 } };
        },
        retry: 1,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    });

    const claimMutation = useMutation({
        mutationFn: async ({ requestId, source }: { requestId: string; source?: string }) => {
            if (source === "customer_request") {
                const res = await apiRequest("POST", `/api/pool/customer-requests/${requestId}/claim`, { notes: "Claimed from pool" });
                return res.json();
            }
            const res = await apiRequest("POST", `/api/pool/${requestId}/claim`, { notes: "Quick claim via Platform" });
            return res.json();
        },
        onSuccess: () => {
            toast.success("Request claimed successfully! Added to your pipeline.");
            queryClient.invalidateQueries({ queryKey: ["/api/pool/search"] });
        },
        onError: () => {
            toast.error("Failed to claim request. Limit reached or already taken.");
        }
    });

    const sendSmsMutation = useMutation({
        mutationFn: async ({ requestId, message }: { requestId: string; message: string }) => {
            const res = await apiRequest("POST", `/api/pool/customer-requests/${requestId}/send-sms`, { message });
            return res.json();
        },
        onSuccess: () => {
            toast.success("SMS sent successfully.");
            setSmsMessage("");
            setSmsDialogOpen(false);
            setSmsTargetId(null);
        },
        onError: (err: any) => {
            const raw = err?.message || String(err);
            console.error("[Send SMS] API error:", raw);
            let msg = "Failed to send SMS.";
            if (raw.includes("not configured")) msg = "SMS is not configured. Contact admin.";
            else if (raw.includes("Only agents or admins")) msg = "You don't have permission to send SMS.";
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
        }
    });

    const requests = Array.isArray(data?.data) ? data.data : [];

    return (
        <div className="w-full space-y-6" dir={dir}>
            {/* Header Section */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-bold">
                            {t("nav.pool")}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t("pool.subtitle")}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => void refetch()}
                            disabled={isLoading}
                        >
                            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                            {t("pool.refresh")}
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            <span>{t("pool.filter")}</span>
                        </Button>
                    </div>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="mt-6 flex items-center p-2">
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
            </div>

            {/* Pool Table */}
            <Card className="overflow-hidden">
                {isLoading ? (
                    <TableSkeleton rows={6} cols={11} />
                ) : (
                    <div dir={dir} className="w-full overflow-x-auto">
                        <Table className="min-w-[850px]">
                            <TableHeader>
                                <TableRow>
                                <TableHead className="text-end">{t("pool.table.type")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.city")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.region")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.budget")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.bedrooms")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.bathrooms")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.living_rooms")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.notes")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.source")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.date")}</TableHead>
                                <TableHead className="text-end">{t("pool.table.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isError ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 text-amber-600">
                                            <Ticket className="h-12 w-12 opacity-60" />
                                            <p className="text-sm">{t("pool.failed_load")} {error instanceof Error ? error.message : ""}</p>
                                            <p className="text-sm text-muted-foreground">{t("pool.login_required")}</p>
                                            <Button variant="outline" size="sm" className="gap-2" onClick={() => void refetch()}>
                                                <RefreshCw className="h-4 w-4" />
                                                {t("pool.retry")}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11}>
                                        <EmptyState
                                            icon={Ticket}
                                            title={t("pool.no_requests")}
                                            description={t("pool.no_requests_hint")}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((req: any, idx: number) => (
                                    <TableRow key={req?.id ?? `row-${idx}`}>
                                        <TableCell>
                                            <Badge variant={req.type === "Buy" || req.type === "شراء" ? "info" : "purple"}>
                                                {req.type || "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{req.city || "—"}</TableCell>
                                        <TableCell>{req.region || "—"}</TableCell>
                                        <TableCell className="font-medium text-emerald-600">
                                            {req.minPrice != null && req.maxPrice != null
                                                ? `${Number(req.minPrice).toLocaleString("en-US")} - ${Number(req.maxPrice).toLocaleString("en-US")}`
                                                : req.minPrice != null
                                                    ? Number(req.minPrice).toLocaleString("en-US")
                                                    : "—"}
                                        </TableCell>
                                        <TableCell>{req.minBedrooms ?? req.maxBedrooms ?? "—"}</TableCell>
                                        <TableCell>{req.bathrooms ?? "—"}</TableCell>
                                        <TableCell>{req.livingRooms ?? "—"}</TableCell>
                                        <TableCell className="max-w-[200px] truncate text-muted-foreground" title={req.notes || ""}>
                                            {req.notes || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "text-xs font-medium",
                                                req.source === "customer_request" ? "text-amber-600" : "text-muted-foreground"
                                            )}>
                                                {req.source === "customer_request" ? t("pool.customer_request") : t("pool.buyer_pool")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {req.createdAt
                                                ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: dir === "rtl" ? ar : undefined })
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.source === "customer_request" && req.canSendSms && (
                                                    <Dialog open={smsDialogOpen && smsTargetId === req.id} onOpenChange={(open) => {
                                                        setSmsDialogOpen(open);
                                                        if (!open) { setSmsTargetId(null); setSmsMessage(""); }
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setSmsTargetId(req.id); setSmsDialogOpen(true); }}>
                                                                <MessageSquare className="h-4 w-4" />
                                                                {t("pool.send_sms")}
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>{t("pool.sms_title")}</DialogTitle>
                                                                <DialogDescription>{t("pool.sms_description")}</DialogDescription>
                                                            </DialogHeader>
                                                            <div className="grid gap-2 py-2">
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
                                                            <DialogFooter>
                                                                <Button
                                                                    onClick={() => {
                                                                        if (!smsMessage.trim() || !smsTargetId) return;
                                                                        sendSmsMutation.mutate({ requestId: smsTargetId, message: smsMessage });
                                                                    }}
                                                                    disabled={sendSmsMutation.isPending || !smsMessage.trim()}
                                                                >
                                                                    {sendSmsMutation.isPending ? "..." : t("pool.send_sms")}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                                <Button
                                                    size="sm"
                                                    onClick={() => claimMutation.mutate({ requestId: req.id, source: req.source })}
                                                    disabled={claimMutation.isPending}
                                                >
                                                    {claimMutation.isPending ? t("pool.claiming") : t("pool.claim")}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* Pagination */}
            {!isLoading && data?.pagination && data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {t("pool.showing")} {((data.pagination.page - 1) * data.pagination.pageSize + 1).toLocaleString("en-US")}–{Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total).toLocaleString("en-US")} {t("pool.pagination_of")} {data.pagination.total.toLocaleString("en-US")}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            {t("pool.previous")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                            disabled={page >= data.pagination.totalPages}
                        >
                            {t("pool.next")}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
