/**
 * property-detail.tsx - Property Detail Page
 *
 * Location: apps/web/src/ → Pages/ → Platform Pages → property-detail.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 *
 * Property detail page. Displays:
 * - Tabbed interface: Overview | Gallery | Location | Similar | History
 * - Property information and details
 * - Property images with gallery grid
 * - Property actions (edit, delete, share)
 * - Contact agent card
 * - Price history placeholder
 * - Share buttons (WhatsApp, Twitter, Copy link)
 * - Print/PDF button
 *
 * Route: /home/platform/properties/:id
 *
 * Related Files:
 * - apps/web/src/pages/properties.tsx - Properties listing page
 * - apps/api/routes/listings.ts - Property API routes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight, Bed, Bath, Square, MapPin, Calendar, Edit, Trash2, Share2,
  Printer, Copy, Building2, Layers, ParkingCircle, TreePine, Waves,
  ArrowUpDown, Home, Eye, Phone, Mail, MessageCircle, Clock, TrendingUp,
  TrendingDown, Minus, ChevronLeft, ChevronRight, X, Star, Heart,
  ExternalLink, Image as ImageIcon, ShieldCheck, FileText, Compass,
  Zap, Droplets, ChevronDown, Save,
  GraduationCap, Pill, ShoppingBag, ShoppingCart, Fuel,
  UtensilsCrossed, MoonStar, Stethoscope, Landmark, Users, type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoCarousel } from "@/components/ui/photo-carousel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { getPropertyStatusVariant } from "@/lib/status-variants";
import { formatAdminDate } from "@/lib/formatters";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import PageHeader from "@/components/ui/page-header";
import { PropertyDetailSkeleton } from "@/components/skeletons/page-skeletons";
import { apiGet, apiPut } from "@/lib/apiClient";
import { SarPrice } from "@/components/ui/sar-symbol";
import type { Property } from "@shared/types";
import { FACADE_LABELS, LEGAL_LABELS } from "@shared/constants/saudi-data";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { useNearbyPlaces } from "@/hooks/useNearbyPlaces";
import { cn } from "@/lib/utils";

// ── Price History Mock Data ────────────────────────────────────────────────
const PRICE_HISTORY_PLACEHOLDER = [
  { date: "2026-01-15", price: 0, change: 0 },
  { date: "2025-10-01", price: 0, change: 0 },
  { date: "2025-06-20", price: 0, change: 0 },
];

// ── Similar Properties Placeholder ─────────────────────────────────────────
const SIMILAR_PROPERTIES_PLACEHOLDER = [
  { id: "sim-1", title: "شقة مماثلة - حي النرجس", city: "الرياض", price: 850000, bedrooms: 3, bathrooms: 2, area: 180 },
  { id: "sim-2", title: "شقة مماثلة - حي الياسمين", city: "الرياض", price: 920000, bedrooms: 3, bathrooms: 2, area: 200 },
  { id: "sim-3", title: "شقة مماثلة - حي العليا", city: "الرياض", price: 780000, bedrooms: 2, bathrooms: 2, area: 150 },
  { id: "sim-4", title: "شقة مماثلة - حي الملقا", city: "الرياض", price: 1050000, bedrooms: 4, bathrooms: 3, area: 220 },
];

// ── Edit form schema ──────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "apartment", label: "شقة" }, { value: "villa", label: "فيلا" },
  { value: "duplex", label: "دوبلكس" }, { value: "land", label: "أرض" },
  { value: "commercial", label: "تجاري" }, { value: "office", label: "مكتب" },
  { value: "warehouse", label: "مستودع" }, { value: "building", label: "عمارة" },
  { value: "chalet", label: "شاليه" }, { value: "farm", label: "مزرعة" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "متاح" }, { value: "PENDING", label: "قيد الانتظار" },
  { value: "SOLD", label: "مباع" }, { value: "RENTED", label: "مؤجر" },
  { value: "WITHDRAWN", label: "مسحوب" },
];

const FACADE_OPTIONS = [
  { value: "", label: "غير محدد" },
  { value: "NORTH", label: "شمال" }, { value: "SOUTH", label: "جنوب" },
  { value: "EAST", label: "شرق" }, { value: "WEST", label: "غرب" },
  { value: "NORTH_EAST", label: "شمال شرق" }, { value: "NORTH_WEST", label: "شمال غرب" },
  { value: "SOUTH_EAST", label: "جنوب شرق" }, { value: "SOUTH_WEST", label: "جنوب غرب" },
];

const LEGAL_OPTIONS = [
  { value: "", label: "غير محدد" },
  { value: "FREE", label: "صك حر" }, { value: "MORTGAGED", label: "مرهون" },
  { value: "UNDER_DISPUTE", label: "تحت النزاع" }, { value: "ENDOWMENT", label: "وقف" },
];

const editSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
  propertyType: z.string().optional(),
  status: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  price: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  areaSqm: z.string().optional(),
  facadeDirection: z.string().optional(),
  buildingAge: z.string().optional(),
  legalStatus: z.string().optional(),
  deedNumber: z.string().optional(),
  availableServices: z.string().optional(),
  regaAdLicenseNumber: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

// ── Component ─────────────────────────────────────────────────────────────

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { dir, language } = useLanguage();
  const showSkeleton = useMinLoadTime();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const [activeTab, setActiveTab] = useState("overview");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  const { data: property, isLoading, error } = useQuery<Property>({
    queryKey: ["/api/listings", id],
    queryFn: () => apiGet<Property>(`/api/listings/${id}`),
    enabled: !!id,
  });

  /** Similar properties — same city + type from DB (E8). Replaces placeholder. */
  const { data: similarProperties } = useQuery<any[]>({
    queryKey: ["/api/listings", id, "similar"],
    queryFn: () => apiGet<any[]>(`/api/listings/${id}/similar`),
    enabled: !!id,
  });

  /** Interested count — number of favorites on this property (E8). */
  const { data: interestedData } = useQuery<{ count: number }>({
    queryKey: ["/api/listings", id, "interested-count"],
    queryFn: () => apiGet<{ count: number }>(`/api/listings/${id}/interested-count`),
    enabled: !!id,
  });

  /** Price change history (E8). Source: property_price_history table. */
  const { data: priceHistory } = useQuery<{ oldPrice: number; newPrice: number; changedAt: string }[]>({
    queryKey: ["/api/listings", id, "price-history"],
    queryFn: () => apiGet(`/api/listings/${id}/price-history`),
    enabled: !!id,
  });

  // ── Edit form ───────────────────────────────────────────────────────────
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "", description: "", propertyType: "", status: "", city: "", district: "",
      address: "", price: "", bedrooms: "", bathrooms: "", areaSqm: "",
      facadeDirection: "", buildingAge: "", legalStatus: "", deedNumber: "",
      availableServices: "", regaAdLicenseNumber: "",
    },
  });

  // Sync form when property loads or edit opens
  useEffect(() => {
    if (property && editOpen) {
      const p = property as any;
      editForm.reset({
        title: p.title || "",
        description: p.description || "",
        propertyType: p.propertyType || p.type || "",
        status: p.status || "",
        city: p.city || "",
        district: p.district || "",
        address: p.address || "",
        price: p.price != null ? String(p.price) : "",
        bedrooms: p.bedrooms != null ? String(p.bedrooms) : "",
        bathrooms: p.bathrooms != null ? String(p.bathrooms) : "",
        areaSqm: p.areaSqm != null ? String(p.areaSqm) : "",
        facadeDirection: p.facadeDirection || "",
        buildingAge: p.buildingAge != null ? String(p.buildingAge) : "",
        legalStatus: p.legalStatus || "",
        deedNumber: p.deedNumber || "",
        availableServices: p.availableServices || "",
        regaAdLicenseNumber: p.regaAdLicenseNumber || (p.listings?.[0]?.regaAdLicenseNumber) || "",
      });
    }
  }, [property, editOpen, editForm]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      return apiPut(`/api/listings/${id}`, {
        title: data.title,
        description: data.description || undefined,
        propertyType: data.propertyType || undefined,
        status: data.status || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
        address: data.address || undefined,
        price: data.price ? Number(data.price) : undefined,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
        squareFeet: data.areaSqm ? Number(data.areaSqm) : undefined,
        facadeDirection: data.facadeDirection || undefined,
        buildingAge: data.buildingAge ? Number(data.buildingAge) : undefined,
        legalStatus: data.legalStatus || undefined,
        deedNumber: data.deedNumber || undefined,
        availableServices: data.availableServices || undefined,
        regaAdLicenseNumber: data.regaAdLicenseNumber || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      setEditOpen(false);
      toast({ title: "تم التحديث", description: "تم تحديث بيانات العقار بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث العقار", variant: "destructive" });
    },
  });

  const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    const numAmount = toNumber(amount);
    if (numAmount === null) return "—";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount) + '';
  };

  const shareProperty = (property: Property, platform: 'whatsapp' | 'twitter' | 'copy') => {
    const propertyUrl = `${window.location.origin}/home/platform/properties/${property.id}`;
    const shareText = `🏠 ${property.title}\n📍 ${property.address}, ${property.city}\n💰 ${formatCurrency(property.price)}\n\nاكتشف المزيد:`;

    if (platform === 'copy') {
      navigator.clipboard.writeText(propertyUrl).then(() => {
        toast({ title: "تم النسخ", description: "تم نسخ رابط العقار إلى الحافظة" });
      });
      return;
    }

    let shareUrl = '';
    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${propertyUrl}`)}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(propertyUrl)}`;
    }

    window.open(shareUrl, '_blank');
    toast({
      title: "تم المشاركة",
      description: `تم فتح نافذة المشاركة على ${platform === 'whatsapp' ? 'واتساب' : 'تويتر'}`
    });
  };

  const handlePrint = () => {
    window.print();
    toast({ title: "طباعة", description: "تم فتح نافذة الطباعة" });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const parseFeatures = (features: string[] | string | null | undefined): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return features.split(",").map(f => f.trim()).filter(Boolean);
    }
  };

  // Hooks must be called before any early returns
  const latitude = toNumber(property?.latitude);
  const longitude = toNumber(property?.longitude);
  const features = parseFeatures(property?.features);
  const photos = (() => {
    if (property?.photoUrls && Array.isArray(property.photoUrls) && property.photoUrls.length > 0) return property.photoUrls;
    const raw = (property as any)?.photos;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  })();
  const { closestByCategory, isLoading: nearbyLoading } = useNearbyPlaces(latitude, longitude, id);

  // All landmark colors derived from theme chart palette (hue 160 family)
  const LANDMARK_ICONS: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
    mosque:      { icon: MoonStar,         bg: "bg-[hsl(var(--chart-1)/0.12)]", color: "text-[hsl(var(--chart-1))]" },
    school:      { icon: GraduationCap,    bg: "bg-[hsl(var(--chart-2)/0.12)]", color: "text-[hsl(var(--chart-2))]" },
    hospital:    { icon: Stethoscope,      bg: "bg-[hsl(var(--chart-3)/0.12)]", color: "text-[hsl(var(--chart-3))]" },
    pharmacy:    { icon: Pill,             bg: "bg-[hsl(var(--chart-4)/0.12)]", color: "text-[hsl(var(--chart-4))]" },
    mall:        { icon: ShoppingBag,      bg: "bg-[hsl(var(--chart-5)/0.15)]", color: "text-[hsl(var(--chart-5))]" },
    supermarket: { icon: ShoppingCart,     bg: "bg-[hsl(var(--chart-1)/0.08)]", color: "text-[hsl(var(--chart-1))]" },
    park:        { icon: TreePine,         bg: "bg-[hsl(var(--chart-2)/0.08)]", color: "text-[hsl(var(--chart-2))]" },
    fuel:        { icon: Fuel,             bg: "bg-[hsl(var(--chart-3)/0.08)]", color: "text-[hsl(var(--chart-3))]" },
    restaurant:  { icon: UtensilsCrossed,  bg: "bg-[hsl(var(--chart-4)/0.08)]", color: "text-[hsl(var(--chart-4))]" },
    bank:        { icon: Landmark,         bg: "bg-[hsl(var(--chart-5)/0.10)]", color: "text-[hsl(var(--chart-5))]" },
  };

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="تفاصيل العقار" />
        <PropertyDetailSkeleton />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="تفاصيل العقار" />
        <QueryErrorFallback
          message="لم يتم العثور على العقار"
          onRetry={() => setLocation('/home/platform/properties')}
        />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      {/* Breadcrumb + Actions bar */}
      <div className="flex items-center justify-between print:hidden">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/home/platform">الرئيسية</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/home/platform/properties">العقارات</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage className="truncate max-w-[200px]">{property.title}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={16} className="me-1.5" />
            طباعة
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 size={16} className="me-1.5" />
                مشاركة
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => shareProperty(property, 'whatsapp')}>
                <MessageCircle size={16} className="me-2" />
                واتساب
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareProperty(property, 'twitter')}>
                <ExternalLink size={16} className="me-2" />
                تويتر
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareProperty(property, 'copy')}>
                <Copy size={16} className="me-2" />
                نسخ الرابط
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit size={16} className="me-1.5" />
            تعديل
          </Button>
        </div>
      </div>

      <PageHeader title={property.title} subtitle={[property.district, property.city].filter(Boolean).join("، ") || property.address} />

      {/* ══════════ Print-Only: All sections in one view ══════════ */}
      <div className="hidden print:block space-y-6 print:text-sm">
        {/* Print header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-black">{property.title}</h1>
            <p className="text-muted-foreground">{[property.district, property.city].filter(Boolean).join("، ") || property.address}</p>
          </div>
          <div className="text-end">
            <div className="text-2xl font-bold text-primary"><SarPrice value={property.price} /></div>
            <div className="flex items-center gap-1.5">
              {(interestedData?.count ?? 0) > 0 && (
                <Badge variant="outline" className="text-xs gap-0.5">
                  <Users size={12} /> {interestedData!.count} مهتم
                </Badge>
              )}
              <Badge variant={getPropertyStatusVariant(property.status)}>{property.status}</Badge>
            </div>
          </div>
        </div>

        {/* Print photo */}
        {photos.length > 0 && (
          <img src={photos[0]} alt={property.title} className="w-full h-48 object-cover rounded-xl" />
        )}

        {/* Print specs grid */}
        <div className="grid grid-cols-4 gap-4 border rounded-xl p-4">
          {property.bedrooms != null && (
            <div className="text-center"><p className="text-lg font-bold">{property.bedrooms}</p><p className="text-xs text-muted-foreground">غرف نوم</p></div>
          )}
          {property.bathrooms != null && (
            <div className="text-center"><p className="text-lg font-bold">{Number(property.bathrooms)}</p><p className="text-xs text-muted-foreground">حمامات</p></div>
          )}
          {property.areaSqm != null && (
            <div className="text-center"><p className="text-lg font-bold">{Number(property.areaSqm).toLocaleString("en-US")}</p><p className="text-xs text-muted-foreground">م²</p></div>
          )}
          {property.areaSqm != null && property.price != null && (
            <div className="text-center"><p className="text-lg font-bold"><SarPrice value={Math.round(Number(property.price) / Number(property.areaSqm))} /></p><p className="text-xs text-muted-foreground">/م²</p></div>
          )}
        </div>

        {/* Print description */}
        {property.description && (
          <div>
            <h3 className="font-bold mb-1">الوصف</h3>
            <p className="text-muted-foreground leading-relaxed">{property.description}</p>
          </div>
        )}

        {/* Print details — two columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 border rounded-xl p-4">
          {[
            { label: "نوع العقار", value: property.propertyType || (property as any).type },
            { label: "التصنيف", value: property.category || (property as any).propertyCategory },
            { label: "المدينة", value: property.city },
            { label: "الحي", value: property.district },
            { label: "العنوان", value: property.address },
            { label: "واجهة العقار", value: (property as any).facadeDirection ? FACADE_LABELS[(property as any).facadeDirection] || (property as any).facadeDirection : null },
            { label: "عمر المبنى", value: (property as any).buildingAge ? `${(property as any).buildingAge} سنة` : null },
            { label: "الحالة القانونية", value: (property as any).legalStatus ? LEGAL_LABELS[(property as any).legalStatus] : null },
            { label: "رقم الصك", value: (property as any).deedNumber },
            { label: "تاريخ الإضافة", value: formatAdminDate(property.createdAt) },
          ].filter(d => d.value).map((d, i) => (
            <div key={i} className="flex justify-between py-1 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground">{d.label}</span>
              <span className="font-bold">{d.value}</span>
            </div>
          ))}
        </div>

        {/* Print services */}
        {(property as any).availableServices && (
          <div>
            <h3 className="font-bold mb-1">الخدمات المتوفرة</h3>
            <p>{String((property as any).availableServices).split(",").map(s => ({electricity:"كهرباء",water:"مياه",sewage:"صرف صحي",gas:"غاز",fiber:"ألياف بصرية"} as Record<string,string>)[s.trim()] || s.trim()).join(" · ")}</p>
          </div>
        )}

        {/* Print REGA compliance */}
        <div className="border rounded-xl p-4 text-xs">
          <p className="font-bold mb-2">بيانات الترخيص — الهيئة العامة للعقار (REGA)</p>
          <div className="grid grid-cols-2 gap-2">
            <span>رخصة فال: {(property as any).falLicenseNumber || (property as any).listings?.[0]?.falLicenseNumber || "—"}</span>
            <span>ترخيص الإعلان: {(property as any).regaAdLicenseNumber || (property as any).listings?.[0]?.regaAdLicenseNumber || "—"}</span>
          </div>
        </div>

        {/* Print footer */}
        <div className="border-t pt-3 text-xs text-muted-foreground text-center">
          <p>تم الطباعة من منصة عقاركم — {new Date().toLocaleDateString("ar-SA")} — rega.gov.sa</p>
        </div>
      </div>

      {/* ══════════ Screen-Only: Tabbed Interface ══════════ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full print:hidden">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="gallery">المعرض</TabsTrigger>
          <TabsTrigger value="location">الموقع</TabsTrigger>
          <TabsTrigger value="similar">عقارات مشابهة</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Images Carousel */}
              {photos.length > 0 ? (
                <Card className="overflow-hidden">
                  <PhotoCarousel photos={photos} alt={property.title} className="aspect-video" showIndicators={true} />
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>لا توجد صور متاحة</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{property.title}</CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin size={16} />
                        <span>{[property.district, property.city].filter(Boolean).join("، ") || property.address}</span>
                      </div>
                    </div>
                    <Badge variant={getPropertyStatusVariant(property.status)} className="rounded-full px-4 py-2">
                      {property.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price and Key Features */}
                  <div>
                    <div className="text-3xl font-bold text-primary mb-4"><SarPrice value={property.price} /></div>
                    <div className="grid grid-cols-3 gap-6">
                      {property.bedrooms && (<div className="flex items-center gap-2 text-muted-foreground"><Bed size={20} /><span>{property.bedrooms} غرف نوم</span></div>)}
                      {property.bathrooms && (<div className="flex items-center gap-2 text-muted-foreground"><Bath size={20} /><span>{property.bathrooms} حمام</span></div>)}
                      {property.areaSqm != null && (<div className="flex items-center gap-2 text-muted-foreground"><Square size={20} /><span>{typeof property.areaSqm === "number" ? property.areaSqm.toLocaleString("en-US") : property.areaSqm} متر²</span></div>)}
                    </div>
                  </div>

                  {/* Description */}
                  {property.description && (
                    <div>
                      <h3 className="font-bold mb-3">الوصف</h3>
                      <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                    </div>
                  )}

                  {/* Full Property Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold mb-3">تفاصيل العقار</h3>
                      <div className="space-y-2">
                        {[
                          { icon: Home, label: "نوع العقار", value: property.propertyType || "غير محدد" },
                          { icon: Layers, label: "الفئة", value: property.category || (property as any).propertyCategory || "غير محدد" },
                          { icon: Bed, label: "غرف النوم", value: property.bedrooms ?? "—" },
                          { icon: Bath, label: "الحمامات", value: property.bathrooms ?? "—" },
                          { icon: Building2, label: "غرف المعيشة", value: property.livingRooms ?? "—" },
                          { icon: Square, label: "المساحة (م²)", value: property.areaSqm != null ? `${property.areaSqm} م²` : "—" },
                        ].map((row, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-muted-foreground flex items-center gap-2"><row.icon size={14} /> {row.label}</span>
                            <span className="font-medium">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-3">معلومات إضافية</h3>
                      <div className="space-y-2">
                        {(() => {
                          const p = property as any;
                          // Using FACADE_LABELS from shared constants
                          // Using LEGAL_LABELS from shared constants
                          return [
                            { icon: Layers, label: "نوع الإدراج", value: property.listingType || "غير محدد" },
                            { icon: Eye, label: "الحالة", value: property.status, badge: true },
                            { icon: Compass, label: "واجهة العقار", value: FACADE_LABELS[p.facadeDirection] || p.facadeDirection || "غير محدد" },
                            { icon: Calendar, label: "عمر المبنى", value: p.buildingAge ? `${p.buildingAge} سنة` : "غير محدد" },
                            { icon: FileText, label: "الحالة القانونية", value: LEGAL_LABELS[p.legalStatus] || "غير محدد" },
                            { icon: MapPin, label: "الحي", value: property.district || "غير محدد" },
                            { icon: Calendar, label: "تاريخ الإضافة", value: formatAdminDate(property.createdAt) },
                          ].map((row, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><row.icon size={14} /> {row.label}</span>
                              {row.badge ? <Badge variant={getPropertyStatusVariant(property.status)}>{row.value}</Badge> : <span className="font-medium">{row.value}</span>}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Available Services */}
                    {(property as any).availableServices && (
                      <div className="md:col-span-2">
                        <h3 className="font-bold mb-3 flex items-center gap-2"><Zap size={16} /> الخدمات المتوفرة</h3>
                        <div className="flex flex-wrap gap-2">
                          {String((property as any).availableServices).split(",").map((svc: string, idx: number) => {
                            const t = svc.trim();
                            if (!t) return null;
                            const labels: Record<string,string> = {electricity:"كهرباء",water:"مياه",sewage:"صرف صحي",gas:"غاز",fiber:"ألياف بصرية"};
                            return <Badge key={idx} variant="secondary" className="rounded-full px-3 py-1 text-sm gap-1">{t === "electricity" ? <Zap size={12} /> : (t === "water" || t === "sewage") ? <Droplets size={12} /> : null}{labels[t] || t}</Badge>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features / Amenities */}
                  {features.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-3">المميزات والمرافق</h3>
                      <div className="flex flex-wrap gap-2">
                        {features.map((feature, idx) => <Badge key={idx} variant="secondary" className="rounded-full px-3 py-1 text-sm">{feature}</Badge>)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Agent Card */}
              <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Phone size={18} />
                        تواصل مع الوكيل
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{property.agent?.firstName ?? "الوكيل"} {property.agent?.lastName ?? ""}</p>
                          <p className="text-sm text-muted-foreground">{property.agent?.email ?? "غير متوفر"}</p>
                        </div>
                      </div>
                      <Separator />
                      <Button className="w-full" size="lg">
                        <Phone size={16} className="me-2" />
                        اتصال بالوكيل
                      </Button>
                      <Button variant="outline" className="w-full" size="lg">
                        <MessageCircle size={16} className="me-2" />
                        واتساب
                      </Button>
                      <Button variant="outline" className="w-full" size="lg">
                        <Mail size={16} className="me-2" />
                        إرسال بريد
                      </Button>
                    </CardContent>
                  </Card>

                  {/* REGA Compliance Card */}
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <ShieldCheck size={18} className="text-primary" />
                        الامتثال التنظيمي
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* FAL License */}
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">رخصة فال</span>
                        <span className="font-bold text-sm tabular-nums">
                          {(property as any).falLicenseNumber || (property as any).listing?.falLicenseNumber || "—"}
                        </span>
                      </div>
                      {/* REGA Ad License */}
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">ترخيص الإعلان</span>
                        <span className="font-bold text-sm tabular-nums">
                          {(property as any).regaAdLicenseNumber || (property as any).listing?.regaAdLicenseNumber || "—"}
                        </span>
                      </div>
                      {/* Deed Number */}
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">رقم الصك</span>
                        <span className="font-bold text-sm tabular-nums">
                          {(property as any).deedNumber || "—"}
                        </span>
                      </div>
                      {/* Legal Status */}
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-xs text-muted-foreground">الحالة القانونية</span>
                        <Badge variant="outline" className="text-xs">
                          {(property as any).legalStatus === "FREE" ? "صك حر" :
                           (property as any).legalStatus === "MORTGAGED" ? "مرهون" :
                           (property as any).legalStatus === "UNDER_DISPUTE" ? "تحت النزاع" :
                           (property as any).legalStatus === "ENDOWMENT" ? "وقف" : "غير محدد"}
                        </Badge>
                      </div>

                      {/* Compliance status */}
                      {(() => {
                        const hasFal = !!(property as any).falLicenseNumber || !!(property as any).listing?.falLicenseNumber;
                        const hasAd = !!(property as any).regaAdLicenseNumber || !!(property as any).listing?.regaAdLicenseNumber;
                        const isCompliant = hasFal && hasAd;
                        return (
                          <div className={cn(
                            "rounded-lg p-3 text-xs",
                            isCompliant ? "bg-primary/10 text-primary" : "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]"
                          )}>
                            {isCompliant
                              ? "✓ مرخص من الهيئة العامة للعقار (REGA)"
                              : "⚠ بيانات الترخيص غير مكتملة — يجب إضافة رقم رخصة فال ورقم ترخيص الإعلان"}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Location Map (compact) */}
                  {/* Map */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold">الموقع</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {latitude !== null && longitude !== null ? (
                        <iframe
                          title="موقع العقار"
                          className="h-48 w-full rounded-xl border-0"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.008},${latitude - 0.006},${longitude + 0.008},${latitude + 0.006}&layer=mapnik&marker=${latitude},${longitude}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-48 w-full bg-muted/50 rounded-xl flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {[property.district, property.city].filter(Boolean).join("، ") || property.address}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Nearby Places (compact) */}
                  {closestByCategory.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">القريب منك</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {nearbyLoading ? (
                          <div className="grid grid-cols-2 gap-2">
                            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                          </div>
                        ) : closestByCategory.filter(c => c.place).length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-3">لا تتوفر بيانات</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {closestByCategory.filter(c => c.place).slice(0, 6).map((item) => {
                              const style = LANDMARK_ICONS[item.key] || LANDMARK_ICONS.bank;
                              const Icon = style.icon;
                              return (
                                <div key={item.key} className={cn("flex items-center gap-2 p-2.5 rounded-xl", style.bg)}>
                                  <Icon size={16} className={cn("shrink-0", style.color)} />
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold truncate">{item.place!.name}</p>
                                    <p className={cn("text-[10px] font-bold", style.color)}>{item.place!.distanceFormatted}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">إجراءات سريعة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full">
                        <Calendar size={16} className="me-2" />
                        جدولة معاينة
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Heart size={16} className="me-2" />
                        إضافة إلى المفضلة
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Mail size={16} className="me-2" />
                        طلب معلومات إضافية
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Property Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">إحصائيات العقار</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المشاهدات</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الاستفسارات</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المعاينات</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">أيام في السوق</span>
                        <span className="font-medium">
                          {Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24))} يوم
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* ── Gallery Tab ──────────────────────────────────────── */}
            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon size={20} />
                    معرض الصور ({photos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {photos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-4 opacity-40" />
                      <h3 className="text-lg font-bold mb-2">لا توجد صور</h3>
                      <p className="text-sm">لم يتم رفع أي صور لهذا العقار بعد</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square bg-muted"
                          onClick={() => openLightbox(idx)}
                        >
                          <img
                            src={photo}
                            alt={`${property.title} - صورة ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                            <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-2 start-2">
                            <Badge variant="secondary" className="text-xs">
                              {idx + 1}/{photos.length}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lightbox */}
              {lightboxOpen && photos.length > 0 && (
                <div className="fixed inset-0 z-[100] bg-foreground/90 flex items-center justify-center print:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 end-4 text-white hover:bg-white/20 z-10"
                    onClick={() => setLightboxOpen(false)}
                  >
                    <X size={24} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute start-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={() => setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                  >
                    <ChevronLeft size={32} />
                  </Button>

                  <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                    <img
                      src={photos[lightboxIndex]}
                      alt={`${property.title} - صورة ${lightboxIndex + 1}`}
                      className="max-w-full max-h-[85vh] object-contain rounded-xl"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={() => setLightboxIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                  >
                    <ChevronRight size={32} />
                  </Button>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
                    {lightboxIndex + 1} / {photos.length}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Location Tab ─────────────────────────────────────── */}
            <TabsContent value="location">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin size={20} />
                      تفاصيل الموقع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">العنوان</span>
                        <span className="font-medium">{property.address}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">المدينة</span>
                        <span className="font-medium">{property.city}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">المنطقة</span>
                        <span className="font-medium">{property.state || "غير محدد"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">الحي</span>
                        <span className="font-medium">{property.district || "غير محدد"}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">الرمز البريدي</span>
                        <span className="font-medium">{property.zipCode || "غير محدد"}</span>
                      </div>
                      {latitude !== null && longitude !== null && (
                        <>
                          <div className="flex justify-between items-center py-3 border-b border-border/50">
                            <span className="text-muted-foreground">خط العرض</span>
                            <span className="font-medium font-mono">{latitude.toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between items-center py-3 border-b border-border/50">
                            <span className="text-muted-foreground">خط الطول</span>
                            <span className="font-medium font-mono">{longitude.toFixed(6)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Quick links */}
                    {latitude !== null && longitude !== null && (
                      <div className="mt-6 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')}
                        >
                          <ExternalLink size={14} className="me-2" />
                          فتح في خرائط جوجل
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin size={20} />
                      خريطة الموقع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latitude !== null && longitude !== null ? (
                      <iframe
                        title="موقع العقار"
                        className="h-[400px] w-full rounded-2xl border-0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.008},${longitude + 0.01},${latitude + 0.008}&layer=mapnik&marker=${latitude},${longitude}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-[400px] w-full bg-muted/50 rounded-2xl flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-muted-foreground">إحداثيات الموقع غير متوفرة</p>
                        </div>
                      </div>
                    )}
                    {latitude !== null && longitude !== null && (
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')}>
                          <ExternalLink size={14} className="me-2" />خرائط جوجل
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`, '_blank')}>
                          <ExternalLink size={14} className="me-2" />OpenStreetMap
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Nearby Places — categorized with unique icons */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin size={20} />
                    المعالم والخدمات القريبة
                    {nearbyLoading && <Skeleton className="h-4 w-20 rounded" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {latitude === null || longitude === null ? (
                    <p className="text-sm text-muted-foreground text-center py-8">لا تتوفر إحداثيات لعرض المعالم القريبة</p>
                  ) : nearbyLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {closestByCategory.map((item) => {
                        const style = LANDMARK_ICONS[item.key] || LANDMARK_ICONS.bank;
                        const Icon = style.icon;
                        const hasPlace = !!item.place;
                        return (
                          <div
                            key={item.key}
                            className={cn(
                              "flex flex-col items-center text-center p-3 rounded-xl transition-shadow",
                              hasPlace ? style.bg + " hover:shadow-md cursor-pointer" : "bg-muted/20 opacity-40",
                            )}
                            onClick={() => hasPlace && window.open(`https://www.openstreetmap.org/?mlat=${item.place!.lat}&mlon=${item.place!.lon}#map=18/${item.place!.lat}/${item.place!.lon}`, '_blank')}
                          >
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-2", hasPlace ? style.bg : "bg-muted/30")}>
                              <Icon size={20} className={cn(hasPlace ? style.color : "text-muted-foreground")} />
                            </div>
                            <p className="text-xs font-bold truncate w-full">{hasPlace ? item.place!.name : item.labelAr}</p>
                            <p className={cn("text-[11px] font-bold mt-0.5", hasPlace ? style.color : "text-muted-foreground")}>
                              {hasPlace ? item.place!.distanceFormatted : "—"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Similar Properties Tab ────────────────────────────── */}
            <TabsContent value="similar">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home size={20} />
                    عقارات مشابهة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(similarProperties || []).length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-full text-center py-8">لا توجد عقارات مشابهة</p>
                    )}
                    {(similarProperties || []).map((similar: any) => (
                      <Card
                        key={similar.id}
                        className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                        onClick={() => setLocation(`/listing/${similar.id}`)}
                      >
                        <div className="h-40 bg-muted/50 flex items-center justify-center">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <CardContent className="p-4 space-y-2">
                          <h4 className="font-bold text-sm line-clamp-1">{similar.title}</h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            <span>{similar.city}</span>
                          </div>
                          <div className="text-lg font-bold text-primary">
                            <SarPrice value={similar.price} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Bed size={12} /> {similar.bedrooms}</span>
                            <span className="flex items-center gap-1"><Bath size={12} /> {similar.bathrooms}</span>
                            <span className="flex items-center gap-1"><Square size={12} /> {(similar as any).areaSqm || "—"} م²</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button variant="outline" className="rounded-xl" onClick={() => setLocation('/home/platform/properties')}>
                      عرض المزيد من العقارات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── History Tab ──────────────────────────────────────── */}
            <TabsContent value="history">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp size={20} />
                      سجل الأسعار
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {/* Current Price */}
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <div>
                          <p className="text-xs text-muted-foreground">السعر الحالي</p>
                          <div className="text-xl font-bold text-primary"><SarPrice value={property.price} /></div>
                        </div>
                        <Badge variant="default" className="rounded-full">حالي</Badge>
                      </div>

                      {/* Real price history from DB (E8) */}
                      <div className="mt-4 space-y-3">
                        {(priceHistory || []).length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">لا توجد تغييرات سعرية مسجلة</p>
                        ) : (
                          priceHistory!.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 border border-border/50 rounded-xl">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                {entry.newPrice < entry.oldPrice ? <TrendingDown size={16} className="text-destructive" /> : <TrendingUp size={16} className="text-primary" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  <SarPrice value={entry.oldPrice} /> → <SarPrice value={entry.newPrice} />
                                </p>
                                <p className="text-xs text-muted-foreground">{new Date(entry.changedAt).toLocaleDateString("ar-SA")}</p>
                              </div>
                              <Badge variant={entry.newPrice < entry.oldPrice ? "destructive" : "default"} className="text-[10px]">
                                {entry.newPrice < entry.oldPrice ? "انخفاض" : "ارتفاع"}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock size={20} />
                      سجل الحالة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current status */}
                      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Eye size={16} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">الحالة الحالية</p>
                            <Badge variant={getPropertyStatusVariant(property.status)}>{property.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            منذ {formatAdminDate(property.updatedAt)}
                          </p>
                        </div>
                      </div>

                      {/* History entries placeholder */}
                      <div className="relative">
                        <div className="absolute start-5 top-0 bottom-0 w-px bg-border" />
                        {[
                          { status: "تم الإنشاء", date: formatAdminDate(property.createdAt), icon: Building2 },
                          { status: "تم النشر", date: formatAdminDate(property.createdAt), icon: Eye },
                          { status: "آخر تحديث", date: formatAdminDate(property.updatedAt), icon: Edit },
                        ].map((entry, idx) => (
                          <div key={idx} className="relative flex items-center gap-3 p-3 ms-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border z-10">
                              <entry.icon size={14} className="text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{entry.status}</p>
                              <p className="text-xs text-muted-foreground">{entry.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Log */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar size={20} />
                    سجل النشاط
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { action: "تم إنشاء العقار", date: formatAdminDate(property.createdAt), type: "create" },
                      { action: "تم تحديث بيانات العقار", date: formatAdminDate(property.updatedAt), type: "update" },
                    ].map((log, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border border-border/50 rounded-xl">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          log.type === "create" ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"
                        )}>
                          {log.type === "create" ? <Building2 size={14} /> : <Edit size={14} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{log.action}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{log.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit Property Sheet (bottom drawer) ─────────────────────── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Edit className="h-5 w-5" /> تعديل العقار</SheetTitle>
            <SheetDescription>قم بتحديث بيانات العقار ثم اضغط حفظ</SheetDescription>
          </SheetHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))} className="py-4 max-w-4xl mx-auto space-y-6">

              {/* Row 1: Basic Info */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">المعلومات الأساسية</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField control={editForm.control} name="title" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>العنوان *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="description" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>الوصف</FormLabel>
                      <FormControl><Textarea {...field} rows={2} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="propertyType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع العقار</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-9 text-sm font-normal">
                            {PROPERTY_TYPES.find(t => t.value === field.value)?.label || field.value || "اختر"}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                          {PROPERTY_TYPES.map(t => (<DropdownMenuItem key={t.value} onClick={() => editForm.setValue("propertyType", t.value)}>{t.label}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-9 text-sm font-normal">
                            {STATUS_OPTIONS.find(s => s.value === field.value)?.label || field.value || "اختر"}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                          {STATUS_OPTIONS.map(s => (<DropdownMenuItem key={s.value} onClick={() => editForm.setValue("status", s.value)}>{s.label}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Row 2: Location + Price/Specs side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الموقع</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={editForm.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>المدينة</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={editForm.control} name="district" render={({ field }) => (
                      <FormItem><FormLabel>الحي</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <FormField control={editForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>العنوان التفصيلي</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">السعر والمواصفات</p>
                  <FormField control={editForm.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر</FormLabel>
                      <FormControl>
                        <div className="relative"><Input {...field} type="number" className="pe-12" /><span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold"></span></div>
                      </FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={editForm.control} name="bedrooms" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> غرف</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                    )} />
                    <FormField control={editForm.control} name="bathrooms" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> حمامات</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                    )} />
                    <FormField control={editForm.control} name="areaSqm" render={({ field }) => (
                      <FormItem><FormLabel className="flex items-center gap-1"><Square className="h-3.5 w-3.5" /> م²</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Row 3: REGA + Services + Images */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* REGA fields */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> التنظيمية</p>
                  <FormField control={editForm.control} name="facadeDirection" render={({ field }) => (
                    <FormItem>
                      <FormLabel>واجهة العقار</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-9 text-sm font-normal">
                            {FACADE_OPTIONS.find(f => f.value === field.value)?.label || "اختر"}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                          {FACADE_OPTIONS.map(f => (<DropdownMenuItem key={f.value} onClick={() => editForm.setValue("facadeDirection", f.value)}>{f.label}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={editForm.control} name="buildingAge" render={({ field }) => (
                      <FormItem><FormLabel>عمر المبنى</FormLabel><FormControl><Input {...field} type="number" placeholder="سنة" /></FormControl></FormItem>
                    )} />
                    <FormField control={editForm.control} name="deedNumber" render={({ field }) => (
                      <FormItem><FormLabel>رقم الصك</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <FormField control={editForm.control} name="legalStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة القانونية</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-9 text-sm font-normal">
                            {LEGAL_OPTIONS.find(l => l.value === field.value)?.label || "اختر"}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                          {LEGAL_OPTIONS.map(l => (<DropdownMenuItem key={l.value} onClick={() => editForm.setValue("legalStatus", l.value)}>{l.label}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="regaAdLicenseNumber" render={({ field }) => (
                    <FormItem><FormLabel>ترخيص الإعلان (REGA)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Services — button selection */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> الخدمات المتوفرة</p>
                  <FormField control={editForm.control} name="availableServices" render={({ field }) => {
                    const current = (field.value || "").split(",").map(s => s.trim()).filter(Boolean);
                    const toggle = (key: string) => {
                      const updated = current.includes(key) ? current.filter(s => s !== key) : [...current, key];
                      editForm.setValue("availableServices", updated.join(","));
                    };
                    return (
                      <FormItem>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: "electricity", label: "كهرباء", icon: Zap },
                            { key: "water", label: "مياه", icon: Droplets },
                            { key: "sewage", label: "صرف صحي", icon: Droplets },
                            { key: "gas", label: "غاز", icon: Zap },
                            { key: "fiber", label: "ألياف بصرية", icon: Zap },
                          ].map(svc => {
                            const active = current.includes(svc.key);
                            return (
                              <Button
                                key={svc.key}
                                type="button"
                                size="sm"
                                variant={active ? "default" : "outline"}
                                className="gap-1.5"
                                onClick={() => toggle(svc.key)}
                              >
                                <svc.icon className="h-3.5 w-3.5" />
                                {svc.label}
                              </Button>
                            );
                          })}
                        </div>
                      </FormItem>
                    );
                  }} />
                </div>

                {/* Image upload */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> صور العقار</p>
                  <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer">
                    <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-bold">اسحب الصور أو انقر للرفع</p>
                    <p className="text-[10px] mt-1">PNG, JPG حتى 10 ميجابايت</p>
                    <input type="file" accept="image/*" multiple className="hidden" />
                  </div>
                  {photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {photos.slice(0, 5).map((url, i) => (
                        <img key={i} src={url} alt={`صورة ${i + 1}`} className="h-16 w-16 rounded-lg object-cover shrink-0 border" />
                      ))}
                      {photos.length > 5 && (
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          +{photos.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={updateMutation.isPending} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
