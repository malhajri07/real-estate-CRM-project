import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Property } from "@shared/types";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { AdminTable, type AdminTableColumn } from "@/components/admin";
import { MetricCard } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertCircle, Eye, ShieldCheck, Clock, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModerationQueuePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/moderation/queue"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/moderation/queue");
      return res.json();
    }
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    pending: { today: number; last7Days: number; last30Days: number };
    approved: { today: number; last7Days: number; last30Days: number };
    rejected: { today: number; last7Days: number; last30Days: number };
  }>({
    queryKey: ["/api/moderation/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/moderation/stats");
      return res.json();
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/moderation/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      toast({ title: "تم اعتماد الإعلان بنجاح", className: "bg-green-50 text-green-800 border-green-200" });
      setProcessingId(null);
    },
    onError: () => {
      toast({ title: "فشل اعتماد الإعلان", variant: "destructive" });
      setProcessingId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/moderation/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      toast({ title: "تم رفض الإعلان", variant: "default" });
      setProcessingId(null);
    },
    onError: () => {
      toast({ title: "فشل رفض الإعلان", variant: "destructive" });
      setProcessingId(null);
    }
  });

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    if (action === 'approve') approveMutation.mutate(id);
    else rejectMutation.mutate(id);
  };

  const columns: AdminTableColumn<Property>[] = useMemo(() => [
    {
      key: "title",
      label: "الإعلان",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {item.title}
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-0.5 max-w-xs truncate">
            {item.address}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      label: "النوع",
      render: (item) => (
        <div className="flex gap-1">
          <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-0 text-[9px] font-bold px-2 py-0.5 rounded-md">
            {item.propertyType || "غير محدد"}
          </Badge>
          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0 text-[9px] font-bold px-2 py-0.5 rounded-md">
            {item.listingType || "بيع"}
          </Badge>
        </div>
      )
    },
    {
      key: "price",
      label: "السعر",
      render: (item) => (
        <span className="font-bold text-slate-700">
          {item.price ? Number(item.price).toLocaleString('en-US') : '—'} <span className="text-xs text-slate-400">ر.س</span>
        </span>
      )
    },
    {
      key: "status",
      label: "الحالة",
      render: (item) => (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" />
          بانتظار المراجعة
        </Badge>
      )
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
            className="h-8 w-8 p-0 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 transition-all"
            onClick={() => handleAction(item.id, 'approve')}
            disabled={processingId === item.id}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
            onClick={() => handleAction(item.id, 'reject')}
            disabled={processingId === item.id}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], [processingId]);

  return (
    <div className="space-y-8 animate-in-start" dir="rtl">
      <Card className="glass border-0 rounded-[2rem] p-8 shadow-none group relative overflow-hidden">
        <div className="absolute top-0 end-0 w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="text-center md:text-end">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة المحتوى</h1>
              <p className="text-slate-500 font-medium text-lg">مراجعة واعتماد الإعلانات الجديدة</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="بانتظار المراجعة"
          subtitle="إعلانات جديدة"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          metric={stats?.pending || { today: items.length, last7Days: items.length, last30Days: items.length }}
          loading={isLoading || statsLoading}
        />
        <MetricCard
          title="تم اعتماده اليوم"
          subtitle="إجراء تلقائي"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          metric={stats?.approved || { today: 0, last7Days: 0, last30Days: 0 }}
          loading={statsLoading}
        />
        <MetricCard
          title="تم رفضه اليوم"
          subtitle="مخالف للسياسات"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
          metric={stats?.rejected || { today: 0, last7Days: 0, last30Days: 0 }}
          loading={statsLoading}
        />
      </div>

      <Card className="glass border-0 rounded-[2rem] p-8 shadow-none">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">طابور المراجعة</h2>
          <p className="text-slate-500 font-medium">قائمة الإعلانات التي تتطلب اتخاذ إجراء</p>
        </div>

        <AdminTable
          columns={columns}
          data={items}
          keyExtractor={(item) => item.id}
          loading={isLoading}
          pageSize={10}
          emptyMessage="لا توجد إعلانات بانتظار المراجعة حالياً"
        />
      </Card>
    </div>
  );
}
