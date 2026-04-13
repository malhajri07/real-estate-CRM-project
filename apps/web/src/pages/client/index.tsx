/**
 * client/index.tsx — Client Portal (Buyer/Seller)
 *
 * Tabbed portal for buyers and sellers:
 * - Overview: deals + appointments + stats
 * - Viewings: past viewings with notes/ratings (buyer)
 * - My Requests: property search requests (buyer)
 * - My Properties: listed properties with performance stats (seller)
 * - Offers: submitted offers with status (buyer)
 * - Documents: contracts/receipts across all deals
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";
import {
  Home, Calendar, FileText, Phone, MessageSquare,
  MapPin, Building, Clock, CheckCircle, XCircle,
  LogOut, User, Search, Plus, Eye, Heart, Inbox,
  Star, Send, ChevronLeft, ChevronRight, Download,
  TrendingUp, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { SarPrice } from "@/components/ui/sar-symbol";
import { apiGet, apiPost } from "@/lib/apiClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";

// ── Constants ──────────────────────────────────────────────────────────────

const STAGES = ["NEW", "NEGOTIATION", "UNDER_OFFER", "WON"] as const;
const STAGE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "جديدة", color: "text-primary", bg: "bg-primary" },
  NEGOTIATION: { label: "تفاوض", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))]" },
  UNDER_OFFER: { label: "عرض مقدم", color: "text-accent-foreground", bg: "bg-accent-foreground" },
  WON: { label: "مكتملة", color: "text-primary", bg: "bg-primary" },
  LOST: { label: "ملغاة", color: "text-destructive", bg: "bg-destructive" },
};

const SAUDI_CITIES = ["الرياض", "جدة", "الدمام", "مكة", "المدينة", "الخبر", "تبوك", "أبها", "الطائف"];

const OFFER_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "قيد المراجعة", variant: "outline" },
  ACCEPTED: { label: "مقبول", variant: "default" },
  REJECTED: { label: "مرفوض", variant: "destructive" },
  EXPIRED: { label: "منتهي", variant: "secondary" },
  WITHDRAWN: { label: "ملغي", variant: "secondary" },
};

// ── Types ──────────────────────────────────────────────────────────────────

interface ClientDashboardData {
  deals: { id: string; stage: string; agreedPrice: number | null; property: { title: string; city: string; district: string; type: string; price: number; photos: string } | null; listingType: string | null; agent: { name: string; phone: string } | null; createdAt: string; expectedCloseDate: string | null }[];
  appointments: { id: string; scheduledAt: string; status: string; notes: string | null; property: { title: string; city: string; district: string } | null; agent: { name: string; phone: string } | null }[];
}

// ── Deal Progress Stepper Component ────────────────────────────────────────

function DealProgressStepper({ stage }: { stage: string }) {
  const currentIdx = STAGES.indexOf(stage as any);
  const isLost = stage === "LOST";

  return (
    <div className="flex items-center w-full gap-1">
      {STAGES.map((s, i) => {
        const info = STAGE_LABELS[s];
        const isActive = i === currentIdx;
        const isDone = i < currentIdx || stage === "WON";
        return (
          <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              isDone ? "bg-primary text-primary-foreground" :
              isActive ? "ring-2 ring-primary bg-primary/10 text-primary" :
              "bg-muted text-muted-foreground"
            )}>
              {isDone ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={cn("text-[10px] font-bold", isActive ? info.color : "text-muted-foreground")}>{info.label}</span>
            {i < STAGES.length - 1 && (
              <div className={cn("absolute h-0.5 w-full", isDone ? "bg-primary" : "bg-border")} style={{ display: "none" }} />
            )}
          </div>
        );
      })}
      {isLost && (
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className="h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
            <XCircle size={16} />
          </div>
          <span className="text-[10px] font-bold text-destructive">ملغاة</span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ClientPortal() {
  const { user, logout, hasRole } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isBuyer = hasRole(["BUYER" as any]);
  const isSeller = hasRole(["SELLER" as any]);

  // Sheets
  const [requestOpen, setRequestOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerPropertyId, setOfferPropertyId] = useState("");
  const [reqCity, setReqCity] = useState("");
  const [reqType, setReqType] = useState("Buy");
  const [reqMinPrice, setReqMinPrice] = useState("");
  const [reqMaxPrice, setReqMaxPrice] = useState("");
  const [reqBedrooms, setReqBedrooms] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerConditions, setOfferConditions] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<ClientDashboardData>({
    queryKey: ["/api/client/dashboard"],
    queryFn: () => apiGet<ClientDashboardData>("api/client/dashboard"),
  });

  const { data: myRequests } = useQuery<any[]>({
    queryKey: ["/api/client/my-requests"],
    queryFn: () => apiGet("api/client/my-requests"),
    enabled: isBuyer,
  });

  const { data: myProperties } = useQuery<any[]>({
    queryKey: ["/api/client/my-properties"],
    queryFn: () => apiGet("api/client/my-properties"),
    enabled: isSeller,
  });

  const { data: myOffers } = useQuery<any[]>({
    queryKey: ["/api/client/offers"],
    queryFn: () => apiGet("api/client/offers"),
    enabled: isBuyer,
  });

  const { data: myViewings } = useQuery<any[]>({
    queryKey: ["/api/client/viewings"],
    queryFn: () => apiGet("api/client/viewings"),
    enabled: isBuyer,
  });

  const { data: myDocuments } = useQuery<any[]>({
    queryKey: ["/api/client/documents"],
    queryFn: () => apiGet("api/client/documents"),
  });

  const { data: agentActivity } = useQuery<any>({
    queryKey: ["/api/client/agent-activity"],
    queryFn: () => apiGet("api/client/agent-activity"),
    enabled: isSeller,
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const submitRequest = useMutation({
    mutationFn: (d: any) => apiPost("api/client/property-request", d),
    onSuccess: () => {
      setRequestOpen(false);
      setReqCity(""); setReqType("Buy"); setReqMinPrice(""); setReqMaxPrice(""); setReqBedrooms(""); setReqNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/client/my-requests"] });
    },
  });

  const submitOffer = useMutation({
    mutationFn: (d: any) => apiPost("api/client/offers", d),
    onSuccess: () => {
      setOfferOpen(false);
      setOfferPrice(""); setOfferConditions(""); setOfferMessage(""); setOfferPropertyId("");
      queryClient.invalidateQueries({ queryKey: ["/api/client/offers"] });
    },
  });

  const submitViewingNote = useMutation({
    mutationFn: (d: any) => apiPost("api/client/viewing-note", d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/client/viewings"] }),
  });

  // ── Derived data ─────────────────────────────────────────────────────────

  const deals = data?.deals ?? [];
  const appointments = data?.appointments ?? [];
  const upcomingAppointments = appointments.filter((a) => new Date(a.scheduledAt) > new Date());
  const userName = user?.firstName || "عميل";

  // Determine default tab
  const defaultTab = isSeller ? "overview" : "overview";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={agarkomLogo} alt="عقاركم" className="h-10 w-auto" />
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px]">{isBuyer ? "مشتري" : isSeller ? "بائع" : "عميل"}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <User size={14} />{userName}
            </span>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => { logout(); setLocation("/rbac-login"); }}>
              <LogOut size={14} />خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome + Stats */}
        <div>
          <h1 className="text-2xl font-bold">مرحباً {userName}</h1>
          <p className="text-muted-foreground">{isBuyer ? "تابع بحثك وصفقاتك العقارية" : isSeller ? "تابع عقاراتك وصفقاتك" : "بوابة العميل"}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: FileText, value: deals.length, label: "الصفقات", color: "text-primary", bg: "bg-primary/10" },
            { icon: Calendar, value: upcomingAppointments.length, label: "مواعيد قادمة", color: "text-primary", bg: "bg-primary/10" },
            { icon: CheckCircle, value: deals.filter((d) => d.stage === "WON").length, label: "مكتملة", color: "text-primary", bg: "bg-accent" },
            ...(isBuyer ? [{ icon: Send, value: myOffers?.length ?? 0, label: "عروضي", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.1)]" }] : []),
            ...(isSeller ? [{ icon: Building, value: myProperties?.length ?? 0, label: "عقاراتي", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.1)]" }] : []),
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

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full justify-start flex-wrap">
            <TabsTrigger value="overview" className="gap-1.5"><Home size={14} />نظرة عامة</TabsTrigger>
            {isBuyer && <TabsTrigger value="viewings" className="gap-1.5"><Eye size={14} />المعاينات</TabsTrigger>}
            {isBuyer && <TabsTrigger value="requests" className="gap-1.5"><Search size={14} />طلباتي</TabsTrigger>}
            {isBuyer && <TabsTrigger value="offers" className="gap-1.5"><Send size={14} />عروضي</TabsTrigger>}
            {isSeller && <TabsTrigger value="properties" className="gap-1.5"><Building size={14} />عقاراتي</TabsTrigger>}
            {isSeller && <TabsTrigger value="agent" className="gap-1.5"><User size={14} />نشاط الوسيط</TabsTrigger>}
            <TabsTrigger value="documents" className="gap-1.5"><FileText size={14} />المستندات</TabsTrigger>
          </TabsList>

          {/* ═══════════ OVERVIEW TAB ═══════════ */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
            ) : (
              <>
                {/* Deal Progress Cards */}
                {deals.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground"><Home size={32} className="mx-auto mb-2 opacity-40" /><p>لا توجد صفقات حالياً</p></CardContent></Card>
                ) : (
                  deals.map((deal) => {
                    const stage = STAGE_LABELS[deal.stage] || { label: deal.stage, color: "text-muted-foreground", bg: "bg-muted" };
                    return (
                      <Card key={deal.id}>
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Building size={20} className="text-primary" />
                              </div>
                              <div>
                                <p className="font-bold">{deal.property?.title || "عقار"}</p>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  {deal.property?.city && <span className="flex items-center gap-1"><MapPin size={10} />{deal.property.city}</span>}
                                  <span>{formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true, locale: ar })}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-end">
                              {deal.agreedPrice && <p className="font-bold text-primary"><SarPrice value={deal.agreedPrice} /></p>}
                              {deal.agent && (
                                <div className="flex items-center gap-1 mt-1">
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
                          {/* Deal Progress Stepper */}
                          <DealProgressStepper stage={deal.stage} />
                        </CardContent>
                      </Card>
                    );
                  })
                )}

                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Calendar size={16} />مواعيد قادمة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {upcomingAppointments.slice(0, 3).map((appt) => (
                        <div key={appt.id} className="flex items-center gap-3 rounded-xl border p-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Calendar size={16} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{appt.property?.title || "موعد معاينة"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(appt.scheduledAt).toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric" })}
                              {" · "}
                              {new Date(appt.scheduledAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <Badge variant="outline">مجدول</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLocation("/map")}><MapPin size={14} />تصفح العقارات</Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLocation("/tools/mortgage")}><Home size={14} />حاسبة التمويل</Button>
                  {isBuyer && <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLocation("/favorites")}><Heart size={14} />المفضلة</Button>}
                  {isBuyer && <Button size="sm" className="gap-1.5" onClick={() => setRequestOpen(true)}><Plus size={14} />طلب عقار</Button>}
                  {isSeller && <Button size="sm" className="gap-1.5" onClick={() => setLocation("/post-listing")}><Plus size={14} />إضافة إعلان</Button>}
                </div>
              </>
            )}
          </TabsContent>

          {/* ═══════════ VIEWINGS TAB (Buyer) ═══════════ */}
          {isBuyer && (
            <TabsContent value="viewings" className="space-y-4 mt-4">
              {!myViewings || myViewings.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground"><Eye size={32} className="mx-auto mb-2 opacity-40" /><p>لا توجد معاينات سابقة</p></CardContent></Card>
              ) : (
                myViewings.map((v: any) => (
                  <Card key={v.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Eye size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{v.property?.title || "معاينة"}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {v.property?.city && <span className="flex items-center gap-1"><MapPin size={10} />{v.property.city}</span>}
                              <span>{new Date(v.scheduledAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}</span>
                              {v.agent && <span>الوسيط: {v.agent.name}</span>}
                            </div>
                          </div>
                        </div>
                        <Badge variant={v.status === "COMPLETED" ? "default" : "outline"}>
                          {v.status === "COMPLETED" ? "مكتمل" : v.status === "CANCELLED" ? "ملغي" : "مجدول"}
                        </Badge>
                      </div>

                      {/* Rating stars */}
                      {v.feedback?.overallRating ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">تقييمك:</span>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={16} className={s <= v.feedback.overallRating ? "text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" : "text-border"} />
                          ))}
                          {v.feedback.comments && <span className="text-xs text-muted-foreground ms-2">"{v.feedback.comments}"</span>}
                        </div>
                      ) : v.status === "COMPLETED" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">قيّم هذه المعاينة:</span>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} onClick={() => submitViewingNote.mutate({ appointmentId: v.id, overallRating: s })} className="hover:scale-110 transition-transform">
                              <Star size={18} className="text-border hover:text-[hsl(var(--warning))] hover:fill-[hsl(var(--warning))]" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}

          {/* ═══════════ REQUESTS TAB (Buyer) ═══════════ */}
          {isBuyer && (
            <TabsContent value="requests" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setRequestOpen(true)} className="gap-1.5"><Plus size={14} />طلب جديد</Button>
              </div>
              {!myRequests || myRequests.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground"><Inbox size={32} className="mx-auto mb-2 opacity-40" /><p>لا توجد طلبات بعد</p><p className="text-xs mt-1">أنشئ طلبًا ليتواصل معك الوسطاء</p></CardContent></Card>
              ) : (
                myRequests.map((req: any) => (
                  <Card key={req.id}>
                    <CardContent className="p-4 flex items-center gap-4">
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
                        {req.claims?.length > 0 && <p className="text-[10px] text-primary font-bold mt-1">{req.claims.length} وسيط مهتم</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}

          {/* ═══════════ OFFERS TAB (Buyer) ═══════════ */}
          {isBuyer && (
            <TabsContent value="offers" className="space-y-4 mt-4">
              {!myOffers || myOffers.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground"><Send size={32} className="mx-auto mb-2 opacity-40" /><p>لا توجد عروض مقدمة</p><p className="text-xs mt-1">تصفح العقارات وقدم عرضك</p></CardContent></Card>
              ) : (
                myOffers.map((offer: any) => {
                  const status = OFFER_STATUS[offer.status] || { label: offer.status, variant: "outline" as const };
                  return (
                    <Card key={offer.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[hsl(var(--warning)/0.1)] flex items-center justify-center shrink-0">
                          <Send size={18} className="text-[hsl(var(--warning))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{offer.property?.title || "عقار"}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {offer.property?.city && <span className="flex items-center gap-1"><MapPin size={10} />{offer.property.city}</span>}
                            <span>السعر المطلوب: <SarPrice value={Number(offer.property?.price || 0)} /></span>
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="font-bold text-primary"><SarPrice value={Number(offer.offerPrice)} /></p>
                          <Badge variant={status.variant} className="text-[10px] mt-1">{status.label}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          )}

          {/* ═══════════ PROPERTIES TAB (Seller) ═══════════ */}
          {isSeller && (
            <TabsContent value="properties" className="space-y-4 mt-4">
              {!myProperties || myProperties.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Building size={32} className="mx-auto mb-2 opacity-40" />
                    <p>لا توجد عقارات مسجلة</p>
                    <Button size="sm" className="mt-3 gap-1.5" onClick={() => setLocation("/post-listing")}><Plus size={14} />إضافة إعلان</Button>
                  </CardContent>
                </Card>
              ) : (
                myProperties.map((prop: any) => (
                  <Card key={prop.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Building size={20} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-bold">{prop.title || "عقار"}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {prop.city && <span className="flex items-center gap-1"><MapPin size={10} />{prop.city}{prop.district ? ` · ${prop.district}` : ""}</span>}
                              {prop.type && <span>{prop.type}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          {prop.price && <p className="font-bold text-primary"><SarPrice value={Number(prop.price)} /></p>}
                          <Badge variant={prop.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                            {prop.status === "ACTIVE" ? "نشط" : prop.status === "SOLD" ? "مباع" : prop.status || "—"}
                          </Badge>
                        </div>
                      </div>
                      {/* Performance stats */}
                      <div className="flex items-center gap-6 px-3 py-2 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-1.5 text-xs"><Eye size={14} className="text-muted-foreground" /><span className="font-bold">{prop.views ?? 0}</span><span className="text-muted-foreground">مشاهدة</span></div>
                        <div className="flex items-center gap-1.5 text-xs"><Heart size={14} className="text-muted-foreground" /><span className="font-bold">{prop.favoriteCount ?? 0}</span><span className="text-muted-foreground">مفضلة</span></div>
                        <div className="flex items-center gap-1.5 text-xs"><MessageSquare size={14} className="text-muted-foreground" /><span className="font-bold">{prop.inquiryCount ?? 0}</span><span className="text-muted-foreground">استفسار</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}

          {/* ═══════════ AGENT ACTIVITY TAB (Seller) ═══════════ */}
          {isSeller && (
            <TabsContent value="agent" className="space-y-4 mt-4">
              {!agentActivity || agentActivity.activities?.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground"><User size={32} className="mx-auto mb-2 opacity-40" /><p>لا يوجد نشاط للوسيط هذا الأسبوع</p></CardContent></Card>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <Card><CardContent className="p-4 text-center"><p className="text-2xl font-black">{agentActivity.summary?.totalActions ?? 0}</p><p className="text-xs text-muted-foreground">إجراء</p></CardContent></Card>
                    <Card><CardContent className="p-4 text-center"><p className="text-2xl font-black">{agentActivity.summary?.viewings ?? 0}</p><p className="text-xs text-muted-foreground">معاينة</p></CardContent></Card>
                    <Card><CardContent className="p-4 text-center"><p className="text-2xl font-black">{agentActivity.summary?.calls ?? 0}</p><p className="text-xs text-muted-foreground">مكالمة</p></CardContent></Card>
                  </div>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">سجل نشاط الوسيط (آخر 7 أيام)</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {agentActivity.activities?.slice(0, 15).map((a: any) => (
                        <div key={a.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-border last:border-0">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <TrendingUp size={12} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1"><span className="font-bold">{a.agentName}</span> <span className="text-muted-foreground">{a.action}</span> <span className="text-muted-foreground">{a.entity}</span></div>
                          <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: ar })}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          )}

          {/* ═══════════ DOCUMENTS TAB ═══════════ */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            {!myDocuments || myDocuments.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText size={32} className="mx-auto mb-2 opacity-40" /><p>لا توجد مستندات</p></CardContent></Card>
            ) : (
              myDocuments.map((doc: any) => (
                <Card key={doc.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{doc.fileName}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{doc.propertyTitle}</span>
                        {doc.fileType && <span>{doc.fileType.toUpperCase()}</span>}
                        <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: ar })}</span>
                      </div>
                    </div>
                    {doc.fileUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(doc.fileUrl, "_blank")}>
                        <Download size={14} />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* ═══════════ SHEETS ═══════════ */}

        {/* Submit Property Request (Buyer) */}
        <Sheet open={requestOpen} onOpenChange={setRequestOpen}>
          <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>طلب بحث عن عقار</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-bold">المدينة *</label>
                <Select value={reqCity} onValueChange={setReqCity}>
                  <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                  <SelectContent>{SAUDI_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">نوع الطلب *</label>
                <Select value={reqType} onValueChange={setReqType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Buy">شراء</SelectItem><SelectItem value="Rent">إيجار</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><label className="text-sm font-bold">الميزانية من</label><Input type="number" value={reqMinPrice} onChange={(e) => setReqMinPrice(e.target.value)} placeholder="500,000" dir="ltr" /></div>
                <div className="space-y-2"><label className="text-sm font-bold">الميزانية إلى</label><Input type="number" value={reqMaxPrice} onChange={(e) => setReqMaxPrice(e.target.value)} placeholder="2,000,000" dir="ltr" /></div>
              </div>
              <div className="space-y-2"><label className="text-sm font-bold">عدد الغرف (أقل)</label><Input type="number" value={reqBedrooms} onChange={(e) => setReqBedrooms(e.target.value)} placeholder="3" dir="ltr" /></div>
              <div className="space-y-2"><label className="text-sm font-bold">ملاحظات</label><Input value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} placeholder="مثال: أبحث عن فيلا قريبة من مدرسة..." /></div>
            </div>
            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => setRequestOpen(false)}>إلغاء</Button>
              <Button disabled={!reqCity || submitRequest.isPending} onClick={() => submitRequest.mutate({ city: reqCity, type: reqType, minPrice: reqMinPrice || undefined, maxPrice: reqMaxPrice || undefined, minBedrooms: reqBedrooms || undefined, notes: reqNotes || undefined })}>
                {submitRequest.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Submit Offer (Buyer) */}
        <Sheet open={offerOpen} onOpenChange={setOfferOpen}>
          <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>تقديم عرض</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-6">
              <div className="space-y-2"><label className="text-sm font-bold">السعر المعروض (ر.س) *</label><Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="1,200,000" dir="ltr" /></div>
              <div className="space-y-2"><label className="text-sm font-bold">الشروط</label><Input value={offerConditions} onChange={(e) => setOfferConditions(e.target.value)} placeholder="مثال: التمويل جاهز، أحتاج فحص..." /></div>
              <div className="space-y-2"><label className="text-sm font-bold">رسالة للمالك</label><Textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder="رسالة اختيارية..." rows={3} /></div>
            </div>
            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => setOfferOpen(false)}>إلغاء</Button>
              <Button disabled={!offerPrice || submitOffer.isPending} onClick={() => submitOffer.mutate({ propertyId: offerPropertyId, offerPrice, conditions: offerConditions || undefined, message: offerMessage || undefined })}>
                {submitOffer.isPending ? "جاري الإرسال..." : "تقديم العرض"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
