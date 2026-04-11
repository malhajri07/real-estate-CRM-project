/**
 * tenants/index.tsx — إدارة المستأجرين
 *
 * Post-rental lifecycle: lease tracking, rent payments, renewals.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Home, Calendar, Users, Clock, AlertTriangle,
  CheckCircle, MapPin, Phone, MessageSquare, Banknote,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TenantsSkeleton } from "@/components/skeletons/page-skeletons";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiGet, apiPatch } from "@/lib/apiClient";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { useToast } from "@/hooks/use-toast";
import { SarPrice } from "@/components/ui/sar-symbol";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Tenancy {
  id: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  status: string;
  isExpiring: boolean;
  daysUntilExpiry: number;
  ejarContractNo: string | null;
  /** Last WhatsApp renewal reminder timestamp (E6). Source: tenancies.renewalReminderSentAt. */
  renewalReminderSentAt: string | null;
  /** Per-tenancy payment breakdown (E6). Source: computed server-side. */
  paymentSummary?: { total: number; paid: number; overdue: number; upcoming: number };
  property: { id: string; title: string; city: string; district: string; type: string } | null;
  tenant: { id: string; firstName: string; lastName: string; phone: string } | null;
  rentPayments: { id: string; amount: number; dueDate: string; paidDate: string | null; status: string; daysOverdue?: number }[];
}

interface TenancyStats {
  total: number;
  active: number;
  expiring: number;
  overduePayments: number;
}

export default function TenantsPage() {
  const showSkeleton = useMinLoadTime();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTenancy, setSelectedTenancy] = useState<Tenancy | null>(null);

  const { data: tenancies, isLoading } = useQuery<Tenancy[]>({
    queryKey: ["/api/tenancies"],
    queryFn: () => apiGet<Tenancy[]>("api/tenancies"),
  });

  const { data: stats } = useQuery<TenancyStats>({
    queryKey: ["/api/tenancies/stats/summary"],
    queryFn: () => apiGet<TenancyStats>("api/tenancies/stats/summary"),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ tenancyId, paymentId }: { tenancyId: string; paymentId: string }) =>
      apiPatch(`api/tenancies/${tenancyId}/payments/${paymentId}`, { status: "PAID" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenancies"] });
      toast({ title: "تم تسجيل الدفع" });
    },
  });

  /** Sort: expiring (< 7 days) first, then expiring (< 90 days), then rest (E6). */
  const allTenancies = [...(tenancies ?? [])].sort((a, b) => {
    if (a.isExpiring && !b.isExpiring) return -1;
    if (!a.isExpiring && b.isExpiring) return 1;
    if (a.isExpiring && b.isExpiring) return a.daysUntilExpiry - b.daysUntilExpiry;
    return 0;
  });

  /**
   * Send renewal reminder mutation (E6).
   * Consumer: "تذكير بالتجديد" button in tenancy detail sheet.
   */
  const sendReminderMutation = useMutation({
    mutationFn: (tenancyId: string) =>
      apiPatch(`api/tenancies/${tenancyId}/send-reminder`, {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenancies"] });
      if (data?.waLink) window.open(data.waLink, "_blank");
      toast({ title: "تم إرسال تذكير التجديد" });
    },
    onError: () => toast({ title: "فشل إرسال التذكير", variant: "destructive" }),
  });

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="إدارة المستأجرين" subtitle="عقود الإيجار والمدفوعات والتجديدات" />
        <TenantsSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="إدارة المستأجرين" subtitle="عقود الإيجار والمدفوعات والتجديدات" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Home, value: stats?.total ?? 0, label: "إجمالي العقود", bg: "bg-primary/10", color: "text-primary" },
          { icon: CheckCircle, value: stats?.active ?? 0, label: "نشطة", bg: "bg-primary/10", color: "text-primary" },
          { icon: Clock, value: stats?.expiring ?? 0, label: "قريبة الانتهاء", bg: "bg-[hsl(var(--warning)/0.1)]", color: "text-[hsl(var(--warning))]" },
          { icon: AlertTriangle, value: stats?.overduePayments ?? 0, label: "دفعات متأخرة", bg: "bg-destructive/10", color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tenancy List */}
      {allTenancies.length === 0 ? (
        <EmptyState icon={Home} title="لا توجد عقود إيجار" description="تظهر هنا عقود الإيجار عند إتمام صفقات إيجار" />
      ) : (
        <div className="space-y-3">
          {allTenancies.map((t) => {
            const leaseProgress = (() => {
              const start = new Date(t.leaseStart).getTime();
              const end = new Date(t.leaseEnd).getTime();
              const now = Date.now();
              if (now >= end) return 100;
              if (now <= start) return 0;
              return Math.round(((now - start) / (end - start)) * 100);
            })();

            const paidPayments = t.rentPayments.filter((p) => p.status === "PAID").length;
            const totalPayments = t.rentPayments.length;

            return (
              <Card key={t.id} className={cn("cursor-pointer hover:shadow-md transition-shadow", t.isExpiring && "border-[hsl(var(--warning)/0.3)]")} onClick={() => setSelectedTenancy(t)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Home size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm truncate">{t.property?.title || "عقار"}</p>
                        {t.isExpiring && t.daysUntilExpiry <= 7 && <Badge variant="destructive" className="text-[10px]">ينتهي خلال {t.daysUntilExpiry} يوم</Badge>}
                        {t.isExpiring && t.daysUntilExpiry > 7 && <Badge variant="outline" className="text-[10px] border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))]">ينتهي خلال {t.daysUntilExpiry} يوم</Badge>}
                        <Badge variant={t.status === "ACTIVE" ? "default" : "outline"} className="text-[10px]">
                          {t.status === "ACTIVE" ? "نشط" : t.status === "EXPIRED" ? "منتهي" : t.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        {t.property?.city && <span className="flex items-center gap-1"><MapPin size={10} />{t.property.city}</span>}
                        <span className="flex items-center gap-1"><Users size={10} />{t.tenant?.firstName} {t.tenant?.lastName}</span>
                        <span className="font-bold text-primary"><SarPrice value={t.monthlyRent} /> / شهر</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={leaseProgress} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground tabular-nums">{leaseProgress}%</span>
                        <span className="text-[10px] text-muted-foreground">{paidPayments}/{totalPayments} دفعة</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedTenancy} onOpenChange={() => setSelectedTenancy(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          {selectedTenancy && (() => {
            const t = selectedTenancy;
            return (
              <>
                <SheetHeader>
                  <SheetTitle>{t.property?.title || "عقد إيجار"}</SheetTitle>
                  <SheetDescription>{t.tenant?.firstName} {t.tenant?.lastName} · {t.property?.city}</SheetDescription>
                </SheetHeader>

                <div className="py-4 max-w-2xl mx-auto space-y-4">
                  {/* Lease info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">بداية العقد</p><p className="font-bold">{new Date(t.leaseStart).toLocaleDateString("ar-SA")}</p></div>
                    <div><p className="text-xs text-muted-foreground">نهاية العقد</p><p className="font-bold">{new Date(t.leaseEnd).toLocaleDateString("ar-SA")}</p></div>
                    <div><p className="text-xs text-muted-foreground">الإيجار الشهري</p><p className="font-bold text-primary"><SarPrice value={t.monthlyRent} /></p></div>
                    {t.ejarContractNo && <div><p className="text-xs text-muted-foreground">رقم عقد إيجار</p><p className="font-bold font-mono">{t.ejarContractNo}</p></div>}
                  </div>

                  {/* Tenant contact */}
                  {t.tenant?.phone && (
                    <div className="flex gap-2">
                      <Button variant="outline" className="gap-2 flex-1" onClick={() => window.open(`https://wa.me/${t.tenant!.phone.replace(/\D/g, "")}`)}>
                        <MessageSquare size={14} className="text-[#25D366]" />واتساب المستأجر
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => window.open(`tel:${t.tenant!.phone}`)}>
                        <Phone size={14} />اتصال
                      </Button>
                    </div>
                  )}

                  {/* Renewal reminder button (E6) */}
                  {t.isExpiring && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.1)]"
                      onClick={() => sendReminderMutation.mutate(t.id)}
                      disabled={sendReminderMutation.isPending}
                    >
                      <MessageSquare size={14} />
                      تذكير بالتجديد عبر واتساب
                      {t.renewalReminderSentAt && (
                        <span className="text-[10px] text-muted-foreground ms-auto">
                          آخر تذكير: {new Date(t.renewalReminderSentAt).toLocaleDateString("ar-SA")}
                        </span>
                      )}
                    </Button>
                  )}

                  <Separator />

                  {/* Payment history */}
                  <div>
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Banknote size={16} />سجل المدفوعات</h4>
                    <div className="space-y-2">
                      {t.rentPayments.map((p) => {
                        const isOverdue = p.status === "PENDING" && new Date(p.dueDate) < new Date();
                        const daysOverdue = (p as any).daysOverdue || (isOverdue ? Math.ceil((Date.now() - new Date(p.dueDate).getTime()) / 86400000) : 0);
                        return (
                          <div key={p.id} className={cn("flex items-center justify-between rounded-lg border p-3", isOverdue && "border-destructive/30 bg-destructive/5")}>
                            <div>
                              <p className="text-sm font-medium">{new Date(p.dueDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long" })}</p>
                              <p className={cn("text-xs", isOverdue ? "text-destructive font-bold" : "text-muted-foreground")}>
                                <SarPrice value={p.amount} />
                                {isOverdue && ` · متأخر ${daysOverdue} يوم`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isOverdue && <Badge variant="destructive" className="text-[10px]">متأخر</Badge>}
                              <Badge variant={p.status === "PAID" ? "default" : "outline"} className="text-[10px]">
                                {p.status === "PAID" ? "مدفوع" : p.status === "PENDING" ? "بانتظار" : p.status}
                              </Badge>
                              {p.status === "PENDING" && (
                                <Button size="sm" className="h-7 text-xs" onClick={() => markPaidMutation.mutate({ tenancyId: t.id, paymentId: p.id })}>
                                  تسجيل دفع
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
