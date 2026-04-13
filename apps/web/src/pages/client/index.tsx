/**
 * client/index.tsx — Client Portal Dashboard
 *
 * Read-only portal for buyers/sellers. Shows their deals,
 * upcoming viewings, and agent contact info.
 * Separate layout — no agent sidebar.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";
import {
  Home, Calendar, FileText, Phone, MessageSquare,
  MapPin, Building, Clock, CheckCircle, XCircle,
  LogOut, User, Search, Plus, Eye, Heart, Inbox,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { SarPrice } from "@/components/ui/sar-symbol";
import { apiGet, apiPost } from "@/lib/apiClient";
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
  const { user, logout, hasRole } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isBuyer = hasRole(["BUYER" as any]);
  const isSeller = hasRole(["SELLER" as any]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqCity, setReqCity] = useState("");
  const [reqType, setReqType] = useState("Buy");
  const [reqMinPrice, setReqMinPrice] = useState("");
  const [reqMaxPrice, setReqMaxPrice] = useState("");
  const [reqBedrooms, setReqBedrooms] = useState("");
  const [reqNotes, setReqNotes] = useState("");

  const { data, isLoading } = useQuery<ClientDashboardData>({
    queryKey: ["/api/client/dashboard"],
    queryFn: () => apiGet<ClientDashboardData>("api/client/dashboard"),
  });

  // Buyer's property requests
  const { data: myRequests } = useQuery<any[]>({
    queryKey: ["/api/client/my-requests"],
    queryFn: () => apiGet("api/client/my-requests"),
    enabled: isBuyer,
  });

  // Seller's properties
  const { data: myProperties } = useQuery<any[]>({
    queryKey: ["/api/client/my-properties"],
    queryFn: () => apiGet("api/client/my-properties"),
    enabled: isSeller,
  });

  const submitRequest = useMutation({
    mutationFn: (data: any) => apiPost("api/client/property-request", data),
    onSuccess: () => {
      setRequestOpen(false);
      setReqCity(""); setReqType("Buy"); setReqMinPrice(""); setReqMaxPrice(""); setReqBedrooms(""); setReqNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/client/my-requests"] });
    },
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

            {/* ── Buyer: My Property Requests ────────────────────────── */}
            {isBuyer && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Search size={18} />طلباتي العقارية</CardTitle>
                      <CardDescription>طلبات البحث عن عقار المرسلة للوسطاء</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setRequestOpen(true)} className="gap-1.5">
                      <Plus size={14} />طلب جديد
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!myRequests || myRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Inbox size={32} className="mx-auto mb-2 opacity-40" />
                      <p>لا توجد طلبات بعد</p>
                      <p className="text-xs mt-1">أنشئ طلبًا ليتواصل معك الوسطاء</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myRequests.map((req: any) => (
                        <div key={req.id} className="flex items-center gap-4 rounded-xl border p-4">
                          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                            <Search size={18} className="text-accent-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{req.type === "Buy" ? "شراء" : "إيجار"} — {req.city}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {req.minPrice && <span>من <SarPrice value={Number(req.minPrice)} /></span>}
                              {req.maxPrice && <span>إلى <SarPrice value={Number(req.maxPrice)} /></span>}
                              {req.minBedrooms && <span>{req.minBedrooms}+ غرف</span>}
                            </div>
                          </div>
                          <div className="text-end shrink-0">
                            <Badge variant={req.status === "OPEN" ? "default" : "secondary"}>{req.status === "OPEN" ? "مفتوح" : req.status}</Badge>
                            {req.claims?.length > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-1">{req.claims.length} وسيط مهتم</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Seller: My Properties ──────────────────────────────── */}
            {isSeller && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building size={18} />عقاراتي</CardTitle>
                  <CardDescription>العقارات المعروضة وإحصائياتها</CardDescription>
                </CardHeader>
                <CardContent>
                  {!myProperties || myProperties.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building size={32} className="mx-auto mb-2 opacity-40" />
                      <p>لا توجد عقارات مسجلة</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myProperties.map((prop: any) => (
                        <div key={prop.id} className="flex items-center gap-4 rounded-xl border p-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Building size={20} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{prop.title || "عقار"}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {prop.city && <span className="flex items-center gap-1"><MapPin size={10} />{prop.city}{prop.district ? ` · ${prop.district}` : ""}</span>}
                              {prop.type && <span>{prop.type}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs shrink-0">
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-muted-foreground"><Eye size={12} />{prop.views ?? 0}</div>
                              <p className="text-[9px] text-muted-foreground">مشاهدة</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-muted-foreground"><Heart size={12} />{prop.favoriteCount ?? 0}</div>
                              <p className="text-[9px] text-muted-foreground">مفضلة</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-muted-foreground"><MessageSquare size={12} />{prop.inquiryCount ?? 0}</div>
                              <p className="text-[9px] text-muted-foreground">استفسار</p>
                            </div>
                          </div>
                          <div className="text-end shrink-0">
                            {prop.price && <p className="font-bold text-primary text-sm"><SarPrice value={Number(prop.price)} /></p>}
                            <Badge variant={prop.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                              {prop.status === "ACTIVE" ? "نشط" : prop.status === "SOLD" ? "مباع" : prop.status || "—"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick links */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLocation("/map")}>
                <MapPin size={14} />تصفح العقارات
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLocation("/tools/mortgage")}>
                <Home size={14} />حاسبة التمويل
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLocation("/tools/roi")}>
                <CheckCircle size={14} />العائد الاستثماري
              </Button>
              {isBuyer && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLocation("/favorites")}>
                  <Heart size={14} />المفضلة
                </Button>
              )}
            </div>
          </>
        )}

        {/* ── Submit Property Request Sheet (Buyer) ────────────────── */}
        <Sheet open={requestOpen} onOpenChange={setRequestOpen}>
          <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>طلب بحث عن عقار</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-bold">المدينة *</label>
                <Select value={reqCity} onValueChange={setReqCity}>
                  <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                  <SelectContent>
                    {["الرياض", "جدة", "الدمام", "مكة", "المدينة", "الخبر", "تبوك", "أبها", "الطائف"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">نوع الطلب *</label>
                <Select value={reqType} onValueChange={setReqType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buy">شراء</SelectItem>
                    <SelectItem value="Rent">إيجار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-bold">الميزانية من</label>
                  <Input type="number" value={reqMinPrice} onChange={(e) => setReqMinPrice(e.target.value)} placeholder="500,000" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">الميزانية إلى</label>
                  <Input type="number" value={reqMaxPrice} onChange={(e) => setReqMaxPrice(e.target.value)} placeholder="2,000,000" dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">عدد الغرف (أقل)</label>
                <Input type="number" value={reqBedrooms} onChange={(e) => setReqBedrooms(e.target.value)} placeholder="3" dir="ltr" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">ملاحظات إضافية</label>
                <Input value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} placeholder="مثال: أبحث عن فيلا قريبة من مدرسة..." />
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => setRequestOpen(false)}>إلغاء</Button>
              <Button
                disabled={!reqCity || submitRequest.isPending}
                onClick={() => submitRequest.mutate({ city: reqCity, type: reqType, minPrice: reqMinPrice || undefined, maxPrice: reqMaxPrice || undefined, minBedrooms: reqBedrooms || undefined, notes: reqNotes || undefined })}
              >
                {submitRequest.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
