/**
 * LeadRoutingSection.tsx — Lead distribution strategy config (CORP_OWNER only)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Users, MapPin, RotateCw, Hand, Inbox } from "lucide-react";
import { apiGet, apiPut } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RoutingRule {
  strategy: string;
  enabled: boolean;
  config?: string;
}

const STRATEGIES = [
  {
    id: "round_robin",
    name: "التوزيع بالتناوب",
    desc: "توزيع العملاء بالتساوي على الوسطاء النشطين بالتناوب",
    icon: RotateCw,
  },
  {
    id: "territory",
    name: "حسب المنطقة",
    desc: "توجيه العميل للوسيط المختص بمنطقته بناءً على مناطق الخدمة المسجلة",
    icon: MapPin,
  },
  {
    id: "first_to_claim",
    name: "أول مستجيب",
    desc: "العميل يظهر في حوض الطلبات وأول وسيط يستلمه يحصل عليه",
    icon: Inbox,
  },
  {
    id: "manual",
    name: "توزيع يدوي",
    desc: "مدير المنشأة يوزّع العملاء يدوياً على الوسطاء",
    icon: Hand,
  },
];

export default function LeadRoutingSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rule, isLoading } = useQuery<RoutingRule>({
    queryKey: ["/api/org/lead-routing"],
    queryFn: () => apiGet<RoutingRule>("api/org/lead-routing"),
  });

  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);

  // Sync from server data
  const strategy = selectedStrategy ?? rule?.strategy ?? "manual";
  const isEnabled = selectedStrategy !== null ? enabled : (rule?.enabled ?? false);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiPut("api/org/lead-routing", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org/lead-routing"] });
      toast({ title: "تم حفظ إعدادات التوزيع" });
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  const handleSave = () => {
    saveMutation.mutate({ strategy, enabled: isEnabled });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Users size={18} /></span>
              <div>
                <CardTitle>توزيع العملاء المحتملين</CardTitle>
                <CardDescription>اختر كيف يتم توزيع العملاء الجدد على وسطاء المنشأة تلقائياً</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">التوزيع التلقائي</span>
              <Switch
                checked={isEnabled}
                onCheckedChange={(v) => { setEnabled(v); if (selectedStrategy === null) setSelectedStrategy(strategy); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {STRATEGIES.map((s) => {
            const isActive = strategy === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={cn(
                  "w-full flex items-start gap-4 rounded-xl border p-4 text-start transition-colors",
                  isActive ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-muted/50"
                )}
                onClick={() => { setSelectedStrategy(s.id); if (!isEnabled) setEnabled(true); }}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <s.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{s.name}</p>
                    {isActive && <Badge variant="default" className="text-[10px]">مفعّل</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </button>
            );
          })}

          <Separator />

          <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
            <Save size={16} />
            {saveMutation.isPending ? "جاري الحفظ..." : "حفظ إعدادات التوزيع"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
