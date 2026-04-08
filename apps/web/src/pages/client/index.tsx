/**
 * client/index.tsx — Client Portal Dashboard
 *
 * Read-only portal for buyers/sellers. Shows their deals,
 * upcoming viewings, and agent contact info.
 * Separate layout — no agent sidebar.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";
import {
  Home, Calendar, FileText, Phone, MessageSquare,
  MapPin, Building, Clock, CheckCircle, XCircle,
  LogOut, User,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SarPrice } from "@/components/ui/sar-symbol";
import { apiGet } from "@/lib/apiClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: "جديدة", color: "text-primary" },
  NEGOTIATION: { label: "قيد التفاوض", color: "text-[hsl(var(--warning))]" },
  UNDER_OFFER: { label: "عرض مقدم", color: "text-primary" },
  WON: { label: "مكتملة", color: "text-primary" },
  LOST: { label: "ملغاة", color: "text-destructive" },
};

interface ClientDashboardData {
  deals: {
    id: string;
    stage: string;
    agreedPrice: number | null;
    property: { title: string; city: string; district: string; type: string; price: number; photos: string } | null;
    listingType: string | null;
    agent: { name: string; phone: string } | null;
    createdAt: string;
    expectedCloseDate: string | null;
  }[];
  appointments: {
    id: string;
    scheduledAt: string;
    status: string;
    notes: string | null;
    property: { title: string; city: string; district: string } | null;
    agent: { name: string; phone: string } | null;
  }[];
}

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<ClientDashboardData>({
    queryKey: ["/api/client/dashboard"],
    queryFn: () => apiGet<ClientDashboardData>("api/client/dashboard"),
  });

  const deals = data?.deals ?? [];
  const appointments = data?.appointments ?? [];
  const upcomingAppointments = appointments.filter((a) => new Date(a.scheduledAt) > new Date());
  const userName = user?.firstName || "عميل";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={agarkomLogo} alt="عقاركم" className="h-10 w-auto" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <User size={14} />{userName}
            </span>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => { logout(); setLocation("/rbac-login"); }}>
              <LogOut size={14} />خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold">مرحباً {userName}</h1>
          <p className="text-muted-foreground">تابع صفقاتك ومواعيدك العقارية</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: FileText, value: deals.length, label: "الصفقات", color: "text-primary", bg: "bg-primary/10" },
            { icon: Calendar, value: upcomingAppointments.length, label: "مواعيد قادمة", color: "text-primary", bg: "bg-primary/10" },
            { icon: CheckCircle, value: deals.filter((d) => d.stage === "WON").length, label: "مكتملة", color: "text-primary", bg: "bg-accent" },
            { icon: Clock, value: deals.filter((d) => !["WON", "LOST"].includes(d.stage)).length, label: "قيد المعالجة", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.1)]" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums">{isLoading ? "—" : s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Deals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText size={18} />صفقاتي</CardTitle>
                <CardDescription>جميع الصفقات العقارية المرتبطة بحسابك</CardDescription>
              </CardHeader>
              <CardContent>
                {deals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home size={32} className="mx-auto mb-2 opacity-40" />
                    <p>لا توجد صفقات حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deals.map((deal) => {
                      const stage = STAGE_LABELS[deal.stage] || { label: deal.stage, color: "text-muted-foreground" };
                      return (
                        <div key={deal.id} className="flex items-start gap-4 rounded-xl border p-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Building size={20} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-sm truncate">{deal.property?.title || "عقار"}</p>
                              <Badge variant="outline" className={`text-[10px] ${stage.color}`}>{stage.label}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {deal.property?.city && <span className="flex items-center gap-1"><MapPin size={10} />{deal.property.city}</span>}
                              {deal.listingType && <span>{deal.listingType === "SALE" ? "شراء" : "إيجار"}</span>}
                              <span>{formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true, locale: ar })}</span>
                            </div>
                          </div>
                          <div className="text-end shrink-0">
                            {deal.agreedPrice && <p className="font-bold text-primary"><SarPrice value={deal.agreedPrice} /></p>}
                            {deal.agent && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`https://wa.me/${deal.agent!.phone?.replace(/\D/g, "")}`)}>
                                  <MessageSquare size={14} className="text-[#25D366]" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`tel:${deal.agent!.phone}`)}>
                                  <Phone size={14} />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar size={18} />المواعيد</CardTitle>
                <CardDescription>مواعيد المعاينة والزيارات</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar size={32} className="mx-auto mb-2 opacity-40" />
                    <p>لا توجد مواعيد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((appt) => (
                      <div key={appt.id} className="flex items-center gap-4 rounded-xl border p-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{appt.property?.title || "موعد معاينة"}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{new Date(appt.scheduledAt).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                            <span>{new Date(appt.scheduledAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                        <Badge variant={appt.status === "COMPLETED" ? "default" : appt.status === "CANCELLED" ? "destructive" : "outline"}>
                          {appt.status === "SCHEDULED" ? "مجدول" : appt.status === "COMPLETED" ? "مكتمل" : appt.status === "CANCELLED" ? "ملغي" : appt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
