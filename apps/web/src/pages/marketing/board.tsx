/**
 * Listing Promotions — ترويج الإعلانات
 *
 * Agent bids to boost their listings in search results.
 * Higher bid = higher ranking. Like Google Ads for real estate.
 *
 * Flow: Pick listing → Set daily budget + bid → Choose targeting → Launch
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Megaphone, TrendingUp, Eye, MousePointerClick, Users,
  Plus, Search, Pause, Play, X, Zap, Target, MapPin,
  Building, ChevronDown, ArrowUp, ArrowDown, Sparkles,
  CircleDollarSign, BarChart3, CheckCircle, Clock, Ban,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PromotionsSkeleton } from "@/components/skeletons/page-skeletons";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { cn } from "@/lib/utils";
import { SarPrice } from "@/components/ui/sar-symbol";

// ── Types ──────────────────────────────────────────────────────────────

interface Promotion {
  id: string;
  listingId: string;
  status: string;
  dailyBudget: number;
  totalBudget: number | null;
  spentAmount: number;
  bidAmount: number;
  targetCities: string | null;
  targetTypes: string | null;
  impressions: number;
  clicks: number;
  inquiries: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  listing: {
    id: string;
    listingType: string;
    price: number | null;
    properties: {
      title: string | null;
      city: string | null;
      district: string | null;
      type: string | null;
      price: number | null;
      photos: string | null;
    };
  };
}

interface AgentListing {
  id: string;
  listingType: string;
  price: number | null;
  isPromoted: boolean;
  properties: {
    id: string;
    title: string | null;
    city: string | null;
    district: string | null;
    type: string | null;
    price: number | null;
    photos: string | null;
  };
}

// ── Constants ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Play; color: string }> = {
  ACTIVE: { label: "نشط", icon: Play, color: "text-primary" },
  PAUSED: { label: "متوقف", icon: Pause, color: "text-[hsl(var(--warning))]" },
  EXHAUSTED: { label: "ميزانية مستنفدة", icon: Ban, color: "text-destructive" },
  ENDED: { label: "منتهي", icon: Clock, color: "text-muted-foreground" },
  CANCELLED: { label: "ملغي", icon: X, color: "text-muted-foreground" },
  DRAFT: { label: "مسودة", icon: Clock, color: "text-muted-foreground" },
};

const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الطائف", "تبوك", "أبها", "نجران",
];

const BID_TIERS = [
  { value: 0.5, label: "أساسي", desc: "ظهور عادي", color: "text-muted-foreground" },
  { value: 1, label: "مميز", desc: "ظهور أعلى", color: "text-primary" },
  { value: 2, label: "متقدم", desc: "أولوية في النتائج", color: "text-primary" },
  { value: 5, label: "بريميوم", desc: "أعلى ترتيب + شارة مميز", color: "text-[hsl(var(--warning))]" },
];

// ── Component ──────────────────────────────────────────────────────────

export default function ListingPromotionsPage() {
  const { toast } = useToast();
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AgentListing | null>(null);
  const [dailyBudget, setDailyBudget] = useState("50");
  const [totalBudget, setTotalBudget] = useState("");
  const [bidAmount, setBidAmount] = useState("1");
  const [targetCities, setTargetCities] = useState<string[]>([]);
  const [listingSearch, setListingSearch] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────

  const { data: promotions, isLoading: promoLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
    queryFn: () => apiGet<Promotion[]>("api/promotions"),
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/promotions/stats"],
    queryFn: () => apiGet("api/promotions/stats"),
  });

  const { data: agentListings } = useQuery<AgentListing[]>({
    queryKey: ["/api/promotions/listings"],
    queryFn: () => apiGet<AgentListing[]>("api/promotions/listings"),
    enabled: createOpen,
  });

  const isLoading = promoLoading;

  // ── Mutations ────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost("api/promotions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      setCreateOpen(false);
      resetForm();
      toast({ title: "تم إطلاق الترويج", description: "إعلانك سيظهر في أعلى نتائج البحث" });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err?.message || "فشل إنشاء الترويج", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiPatch(`api/promotions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({ title: "تم التحديث" });
    },
  });

  // ── Computed ─────────────────────────────────────────────────────────

  const allPromos = promotions ?? [];
  const activePromos = allPromos.filter((p) => p.status === "ACTIVE");
  const totalImpressions = stats?.totalImpressions ?? 0;
  const totalClicks = stats?.totalClicks ?? 0;
  const totalInquiries = stats?.totalInquiries ?? 0;
  const totalSpent = stats?.totalSpent ?? 0;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0";

  const filteredListings = useMemo(() => {
    if (!agentListings) return [];
    if (!listingSearch.trim()) return agentListings;
    const q = listingSearch.toLowerCase();
    return agentListings.filter((l) =>
      (l.properties?.title || "").toLowerCase().includes(q) ||
      (l.properties?.city || "").toLowerCase().includes(q)
    );
  }, [agentListings, listingSearch]);

  // ── Helpers ──────────────────────────────────────────────────────────

  const resetForm = () => {
    setSelectedListing(null);
    setDailyBudget("50");
    setTotalBudget("");
    setBidAmount("1");
    setTargetCities([]);
    setListingSearch("");
  };

  const getPhoto = (photos: string | null): string | null => {
    if (!photos) return null;
    try {
      const arr = JSON.parse(photos);
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    } catch { return null; }
  };

  const handleCreate = () => {
    if (!selectedListing) {
      toast({ title: "اختر إعلان أولاً", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      listingId: selectedListing.id,
      dailyBudget: Number(dailyBudget),
      totalBudget: totalBudget ? Number(totalBudget) : undefined,
      bidAmount: Number(bidAmount),
      targetCities: targetCities.length > 0 ? targetCities : undefined,
    });
  };

  const toggleCity = (city: string) => {
    setTargetCities((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);
  };

  // ── Render ──────────────────────────────────────────────────────────

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="ترويج الإعلانات" subtitle="ارفع ترتيب إعلاناتك في نتائج البحث" />
        <PromotionsSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="ترويج الإعلانات" subtitle="ارفع ترتيب إعلاناتك في نتائج البحث — كلما زادت المزايدة ارتفع الترتيب">
        <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus size={16} />
          ترويج جديد
        </Button>
      </PageHeader>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Megaphone, value: activePromos.length, label: "ترويج نشط", color: "text-primary", bg: "bg-primary/10" },
          { icon: Eye, value: totalImpressions.toLocaleString(), label: "ظهور", color: "text-primary", bg: "bg-primary/10" },
          { icon: MousePointerClick, value: `${totalClicks} (${ctr}%)`, label: "نقرة (CTR)", color: "text-primary", bg: "bg-accent" },
          { icon: Users, value: totalInquiries, label: "استفسار", color: "text-primary", bg: "bg-primary/10" },
          { icon: CircleDollarSign, value: Number(totalSpent).toLocaleString(), label: "إجمالي الإنفاق", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.1)]" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xl font-black tabular-nums">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── How it works (first time) ── */}
      {allPromos.length === 0 && (
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              كيف يعمل ترويج الإعلانات؟
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "اختر إعلانك", desc: "حدد العقار الذي تريد ترويجه من قائمة إعلاناتك النشطة", icon: Building },
                { step: "2", title: "حدد الميزانية", desc: "اختر ميزانية يومية وإجمالية — أنت تتحكم بالإنفاق", icon: CircleDollarSign },
                { step: "3", title: "زايد على الترتيب", desc: "كلما زادت مزايدتك، ارتفع ترتيب إعلانك في نتائج البحث", icon: TrendingUp },
                { step: "4", title: "تابع الأداء", desc: "شاهد الظهور والنقرات والاستفسارات في لوحة التحكم", icon: BarChart3 },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-black mx-auto mb-2">{item.step}</div>
                  <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <Button className="mt-6 gap-1.5" onClick={() => { resetForm(); setCreateOpen(true); }}>
              <Plus size={16} />
              ابدأ أول ترويج
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Active Promotions ── */}
      {allPromos.length > 0 && (
        <div className="space-y-3">
          {allPromos.map((promo) => {
            const prop = promo.listing?.properties;
            const statusCfg = STATUS_CONFIG[promo.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusCfg.icon;
            const photo = getPhoto(prop?.photos || null);
            const budgetUsed = promo.totalBudget ? (Number(promo.spentAmount) / Number(promo.totalBudget)) * 100 : 0;
            const ctrLocal = promo.impressions > 0 ? ((promo.clicks / promo.impressions) * 100).toFixed(1) : "0";

            return (
              <Card key={promo.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="h-20 w-28 rounded-lg bg-muted shrink-0 overflow-hidden">
                      {photo ? (
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Building size={24} /></div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm truncate">{prop?.title || "بدون عنوان"}</h3>
                        <Badge variant="outline" className={cn("gap-1 text-[10px]", statusCfg.color)}>
                          <StatusIcon size={10} />
                          {statusCfg.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        {prop?.city && <span className="flex items-center gap-1"><MapPin size={10} />{prop.city}</span>}
                        {prop?.type && <span className="flex items-center gap-1"><Building size={10} />{prop.type}</span>}
                        <span className="flex items-center gap-1"><Zap size={10} />مزايدة: <SarPrice value={promo.bidAmount} /></span>
                      </div>

                      {/* Performance metrics */}
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-lg font-black tabular-nums">{promo.impressions.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">ظهور</p>
                        </div>
                        <div>
                          <p className="text-lg font-black tabular-nums">{promo.clicks}</p>
                          <p className="text-[10px] text-muted-foreground">نقرة ({ctrLocal}%)</p>
                        </div>
                        <div>
                          <p className="text-lg font-black tabular-nums">{promo.inquiries}</p>
                          <p className="text-[10px] text-muted-foreground">استفسار</p>
                        </div>
                        <div>
                          <p className="text-lg font-black tabular-nums"><SarPrice value={promo.spentAmount} /></p>
                          <p className="text-[10px] text-muted-foreground">إنفاق</p>
                        </div>
                      </div>

                      {/* Budget progress */}
                      {promo.totalBudget && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span>الميزانية: <SarPrice value={promo.spentAmount} /> / <SarPrice value={promo.totalBudget} /></span>
                            <span>{budgetUsed.toFixed(0)}%</span>
                          </div>
                          <Progress value={budgetUsed} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {promo.status === "ACTIVE" && (
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => updateMutation.mutate({ id: promo.id, status: "PAUSED" })}>
                          <Pause size={12} />إيقاف
                        </Button>
                      )}
                      {promo.status === "PAUSED" && (
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => updateMutation.mutate({ id: promo.id, status: "ACTIVE" })}>
                          <Play size={12} />تشغيل
                        </Button>
                      )}
                      {(promo.status === "ACTIVE" || promo.status === "PAUSED") && (
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-destructive" onClick={() => updateMutation.mutate({ id: promo.id, status: "CANCELLED" })}>
                          <X size={12} />إلغاء
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Promotion Sheet ── */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Megaphone size={20} />
              ترويج إعلان جديد
            </SheetTitle>
            <SheetDescription>
              اختر الإعلان، حدد ميزانيتك ومزايدتك — كلما زادت المزايدة ارتفع ترتيبك
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 max-w-3xl mx-auto space-y-6">
            {/* Step 1: Pick listing */}
            <div>
              <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                اختر الإعلان
              </h4>

              <div className="relative mb-3">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث في إعلاناتك..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  className="ps-9"
                />
              </div>

              <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                {!agentListings ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">جاري التحميل...</div>
                ) : filteredListings.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">لا توجد إعلانات نشطة</div>
                ) : (
                  filteredListings.map((listing) => {
                    const photo = getPhoto(listing.properties?.photos || null);
                    const isSelected = selectedListing?.id === listing.id;
                    return (
                      <button
                        key={listing.id}
                        type="button"
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg text-start transition-colors w-full",
                          isSelected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted/50",
                          listing.isPromoted && "opacity-50"
                        )}
                        onClick={() => !listing.isPromoted && setSelectedListing(listing)}
                        disabled={listing.isPromoted}
                      >
                        <div className="h-12 w-16 rounded bg-muted shrink-0 overflow-hidden">
                          {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><Building size={16} className="text-muted-foreground" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{listing.properties?.title || "بدون عنوان"}</p>
                          <p className="text-xs text-muted-foreground">
                            {listing.properties?.city} · {listing.properties?.type}
                            {listing.price ? <> · <SarPrice value={listing.price} /></> : ""}
                          </p>
                        </div>
                        {listing.isPromoted && <Badge variant="outline" className="text-[10px] shrink-0">مروّج</Badge>}
                        {isSelected && <CheckCircle size={18} className="text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <Separator />

            {/* Step 2: Budget + Bid */}
            <div>
              <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                الميزانية والمزايدة
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الميزانية اليومية *</label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={10}
                      value={dailyBudget}
                      onChange={(e) => setDailyBudget(e.target.value)}
                      className="pe-12"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ر.س/يوم</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">الحد الأقصى الذي ستنفقه يومياً</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">الميزانية الإجمالية (اختياري)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={50}
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(e.target.value)}
                      placeholder="مثال: 1000"
                      className="pe-8"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ر.س</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">يتوقف الترويج عند استنفاد الميزانية</p>
                </div>
              </div>

              {/* Bid tiers */}
              <label className="text-xs font-bold text-muted-foreground mb-2 block">مستوى المزايدة</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BID_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    className={cn(
                      "rounded-lg border p-3 text-center transition-colors",
                      Number(bidAmount) === tier.value
                        ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setBidAmount(String(tier.value))}
                  >
                    <p className="text-lg font-black tabular-nums">{tier.value} <span className="text-xs font-normal">ر.س</span></p>
                    <p className={cn("text-xs font-bold", tier.color)}>{tier.label}</p>
                    <p className="text-[10px] text-muted-foreground">{tier.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">أو أدخل مبلغ مخصص:</p>
              <Input
                type="number"
                min={0.1}
                step={0.1}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="max-w-[200px] mt-1"
              />
            </div>

            <Separator />

            {/* Step 3: Targeting (optional) */}
            <div>
              <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                الاستهداف
                <Badge variant="outline" className="text-[10px]">اختياري</Badge>
              </h4>

              <p className="text-xs text-muted-foreground mb-2">اختر المدن التي تريد ظهور إعلانك فيها (اتركها فارغة للظهور في كل المدن)</p>
              <div className="flex flex-wrap gap-2">
                {SAUDI_CITIES.map((city) => (
                  <Button
                    key={city}
                    type="button"
                    size="sm"
                    variant={targetCities.includes(city) ? "default" : "outline"}
                    className="h-8 text-xs rounded-full"
                    onClick={() => toggleCity(city)}
                  >
                    <MapPin size={12} className="me-1" />
                    {city}
                  </Button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedListing && (
              <>
                <Separator />
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-sm mb-2">ملخص الترويج</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">الإعلان</p>
                        <p className="font-bold truncate">{selectedListing.properties?.title || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">الميزانية اليومية</p>
                        <p className="font-bold"><SarPrice value={Number(dailyBudget)} /> / يوم</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">المزايدة</p>
                        <p className="font-bold"><SarPrice value={Number(bidAmount)} /> / ظهور</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">الاستهداف</p>
                        <p className="font-bold">{targetCities.length > 0 ? targetCities.join("، ") : "كل المدن"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <SheetFooter className="max-w-3xl mx-auto pt-4 border-t">
            <Button
              className="gap-2 flex-1 md:flex-none"
              onClick={handleCreate}
              disabled={createMutation.isPending || !selectedListing}
            >
              <Megaphone size={16} />
              {createMutation.isPending ? "جاري الإطلاق..." : "إطلاق الترويج"}
            </Button>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
