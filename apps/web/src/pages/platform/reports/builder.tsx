/**
 * reports/builder.tsx — Custom Report Builder
 *
 * Agent selects entity, groupBy, metric, date range → see results.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { ReportBuilderSkeleton } from "@/components/skeletons/page-skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BarChart3, Play, Save, Download } from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiPost } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { SarPrice } from "@/components/ui/sar-symbol";

const ENTITIES = [
  { value: "leads", label: "العملاء" },
  { value: "deals", label: "الصفقات" },
  { value: "properties", label: "العقارات" },
];

const GROUP_OPTIONS: Record<string, { value: string; label: string }[]> = {
  leads: [
    { value: "", label: "بدون تجميع" },
    { value: "status", label: "الحالة" },
    { value: "source", label: "المصدر" },
  ],
  deals: [
    { value: "", label: "بدون تجميع" },
    { value: "stage", label: "المرحلة" },
    { value: "agent", label: "الوسيط" },
    { value: "month", label: "الشهر" },
  ],
  properties: [
    { value: "", label: "بدون تجميع" },
    { value: "city", label: "المدينة" },
    { value: "type", label: "النوع" },
    { value: "status", label: "الحالة" },
  ],
};

const METRICS = [
  { value: "count", label: "العدد" },
  { value: "sum_price", label: "مجموع القيمة" },
  { value: "conversion_rate", label: "معدل التحويل" },
];

interface ReportResult {
  entity: string;
  groupBy: string;
  metric: string;
  data: { label: string; value: number; suffix?: string }[];
}

export default function ReportBuilder() {
  const showSkeleton = useMinLoadTime();
  const { toast } = useToast();
  const [entity, setEntity] = useState("deals");
  const [groupBy, setGroupBy] = useState("stage");
  const [metric, setMetric] = useState("count");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState<ReportResult | null>(null);

  const runMutation = useMutation({
    mutationFn: (data: any) => apiPost("api/reports/custom", data),
    onSuccess: (data: any) => setResult(data),
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiPost("api/reports/saved", data),
    onSuccess: () => toast({ title: "تم حفظ التقرير" }),
  });

  const handleRun = () => {
    runMutation.mutate({
      entity,
      groupBy: groupBy || undefined,
      metric,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const handleSave = () => {
    saveMutation.mutate({ name: `تقرير ${ENTITIES.find((e) => e.value === entity)?.label || entity}`, config: { entity, groupBy, metric, dateFrom, dateTo } });
  };

  const maxValue = result ? Math.max(...result.data.map((d) => d.value), 1) : 1;

  if (showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="منشئ التقارير" subtitle="أنشئ تقارير مخصصة بالأبعاد والمقاييس التي تختارها" />
        <ReportBuilderSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="منشئ التقارير" subtitle="أنشئ تقارير مخصصة بالأبعاد والمقاييس التي تختارها" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 size={16} />إعدادات التقرير</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">البيانات</label>
              <Select value={entity} onValueChange={(v) => { setEntity(v); setGroupBy(""); setResult(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITIES.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">تجميع حسب</label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                <SelectContent>
                  {(GROUP_OPTIONS[entity] || []).map((g) => <SelectItem key={g.value || "__none"} value={g.value || " "}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">المقياس</label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">من تاريخ</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} dir="ltr" className="text-start" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">إلى تاريخ</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} dir="ltr" className="text-start" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1 gap-1.5" onClick={handleRun} disabled={runMutation.isPending}>
                <Play size={14} />{runMutation.isPending ? "جاري..." : "تشغيل"}
              </Button>
              <Button variant="outline" size="icon" onClick={handleSave} disabled={!result}>
                <Save size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2">
          {!result ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <BarChart3 size={40} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-bold">اختر إعدادات التقرير واضغط تشغيل</p>
                <p className="text-sm text-muted-foreground mt-1">ستظهر النتائج هنا</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {ENTITIES.find((e) => e.value === result.entity)?.label} — {METRICS.find((m) => m.value === result.metric)?.label}
                  </CardTitle>
                  <Badge variant="secondary">{result.data.length} نتيجة</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {result.data.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-3">
                    {result.data.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm w-32 truncate text-end">{item.label}</span>
                        <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-primary/20 rounded-lg flex items-center justify-end px-2"
                            style={{ width: `${Math.max((item.value / maxValue) * 100, 5)}%` }}
                          >
                            <span className="text-xs font-black tabular-nums text-primary">
                              {metric === "sum_price" || metric === "sum_commission"
                                ? item.value.toLocaleString()
                                : item.value}{item.suffix || ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
