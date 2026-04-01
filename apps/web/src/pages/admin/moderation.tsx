import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/apiClient";
import type { Property } from "@shared/types";
import { AdminTable, type AdminTableColumn } from "@/components/admin";
import { MetricCard } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSectionHeader } from "@/components/ui/page-section-header";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, ShieldCheck, Clock, Check, X } from "lucide-react";
import { LISTING_STATUS_LABELS, PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS } from "@/constants/labels";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { formatPrice } from "@/lib/formatters";

export default function ModerationQueuePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/moderation/queue"],
    queryFn: async () => apiGet<Property[]>("api/moderation/queue"),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    pending: { today: number; last7Days: number; last30Days: number };
    approved: { today: number; last7Days: number; last30Days: number };
    rejected: { today: number; last7Days: number; last30Days: number };
  }>({
    queryKey: ["/api/moderation/stats"],
    queryFn: async () => apiGet("api/moderation/stats"),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => apiPost(`api/moderation/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      toast({ title: "تم اعتماد الإعلان بنجاح" });
      setProcessingId(null);
    },
    onError: () => {
      toast({ title: "فشل اعتماد الإعلان", variant: "destructive" });
      setProcessingId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => apiPost(`api/moderation/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      toast({ title: "تم رفض الإعلان", variant: "default" });
      setProcessingId(null);
    },
    onError: () => {
      toast({ title: "فشل رفض الإعلان", variant: "destructive" });
      setProcessingId(null);
    },
  });

  const handleAction = (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    if (action === "approve") approveMutation.mutate(id);
    else rejectMutation.mutate(id);
  };

  const columns: AdminTableColumn<Property>[] = useMemo(
    () => [
      {
        key: "title",
        label: "الإعلان",
        sortable: true,
        render: (item) => (
          <div className="flex flex-col py-1">
            <span className="font-bold text-foreground group-hover:text-foreground/80 transition-colors">
              {item.title}
            </span>
            <span className="text-xs font-bold text-muted-foreground mt-0.5 max-w-xs truncate">
              {item.address}
            </span>
          </div>
        ),
      },
      {
        key: "type",
        label: "النوع",
        render: (item) => (
          <div className="flex gap-1 flex-wrap">
            <Badge variant="secondary" className="text-xs font-bold px-2 py-0.5 rounded-md">
              {PROPERTY_TYPE_LABELS[item.propertyType ?? ""] ?? item.propertyType ?? "غير محدد"}
            </Badge>
            <Badge variant="outline" className="status-badge-info text-xs font-bold px-2 py-0.5 rounded-md">
              {LISTING_TYPE_LABELS[item.listingType ?? ""] ?? item.listingType ?? "بيع"}
            </Badge>
          </div>
        ),
      },
      {
        key: "price",
        label: "السعر",
        render: (item) => (
          <span className="font-bold text-foreground">
            {item.price ? formatPrice(Number(item.price)) : "—"}
          </span>
        ),
      },
      {
        key: "status",
        label: "الحالة",
        render: () => (
          <Badge className="status-badge-pending border text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            {LISTING_STATUS_LABELS.pending}
          </Badge>
        ),
      },
      {
        key: "actions",
        label: "تحكم",
        className: "w-32 text-center",
        render: (item) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => handleAction(item.id, "approve")}
              disabled={processingId === item.id}
              title="اعتماد"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => handleAction(item.id, "reject")}
              disabled={processingId === item.id}
              title="رفض"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [processingId],
  );

  return (
    <div className={PAGE_WRAPPER}>
      <PageSectionHeader
        icon={<ShieldCheck className="h-7 w-7" />}
        title="إدارة المحتوى"
        subtitle="مراجعة واعتماد الإعلانات الجديدة"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="بانتظار المراجعة"
          subtitle="إعلانات جديدة"
          icon={<Clock className="w-5 h-5 text-primary" />}
          metric={stats?.pending || { today: items.length, last7Days: items.length, last30Days: items.length }}
          loading={isLoading || statsLoading}
        />
        <MetricCard
          title="تم اعتماده"
          subtitle="إجراء تلقائي"
          icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
          metric={stats?.approved || { today: 0, last7Days: 0, last30Days: 0 }}
          loading={statsLoading}
        />
        <MetricCard
          title="تم رفضه"
          subtitle="مخالف للسياسات"
          icon={<XCircle className="w-5 h-5 text-destructive" />}
          metric={stats?.rejected || { today: 0, last7Days: 0, last30Days: 0 }}
          loading={statsLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>طابور المراجعة</CardTitle>
          <CardDescription>قائمة الإعلانات التي تتطلب اتخاذ إجراء</CardDescription>
        </CardHeader>
        <CardContent className="p-0 px-6 pb-6">
          <AdminTable
            columns={columns}
            data={items}
            keyExtractor={(item) => item.id}
            loading={isLoading}
            pageSize={10}
            emptyState="لا توجد إعلانات بانتظار المراجعة حالياً"
          />
        </CardContent>
      </Card>
    </div>
  );
}
