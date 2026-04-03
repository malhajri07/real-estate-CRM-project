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

import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import {
  ArrowRight, Bed, Bath, Square, MapPin, Calendar, Edit, Trash2, Share2,
  Printer, Copy, Building2, Layers, ParkingCircle, TreePine, Waves,
  ArrowUpDown, Home, Eye, Phone, Mail, MessageCircle, Clock, TrendingUp,
  TrendingDown, Minus, ChevronLeft, ChevronRight, X, Star, Heart,
  ExternalLink, Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoCarousel } from "@/components/ui/photo-carousel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { getPropertyStatusVariant } from "@/lib/status-variants";
import { formatAdminDate } from "@/lib/formatters";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import PageHeader from "@/components/ui/page-header";
import { apiGet } from "@/lib/apiClient";
import type { Property } from "@shared/types";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
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

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { dir, language } = useLanguage();
  const showSkeleton = useMinLoadTime();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const [activeTab, setActiveTab] = useState("overview");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: property, isLoading, error } = useQuery<Property>({
    queryKey: ["/api/listings", id],
    queryFn: () => apiGet<Property>(`/api/listings/${id}`),
    enabled: !!id,
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
    }).format(numAmount) + ' ﷼';
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

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title="تفاصيل العقار" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title="تفاصيل العقار" />
        <QueryErrorFallback
          message="لم يتم العثور على العقار"
          onRetry={() => setLocation('/home/platform/properties')}
        />
      </div>
    );
  }

  const latitude = toNumber(property.latitude);
  const longitude = toNumber(property.longitude);
  const features = parseFeatures(property.features);
  const photos = property.photoUrls ?? [];

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b print:hidden">
        <div className="flex items-center justify-between p-4 max-w-[1600px] mx-auto">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button
              variant="ghost"
              onClick={() => setLocation('/home/platform/properties')}
              className="rounded-xl ui-transition"
            >
              <ArrowRight size={18} className="rotate-180" />
              العودة إلى العقارات
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-xl font-bold">{property.title}</span>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* Print/PDF */}
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handlePrint}>
              <Printer size={16} className="me-2" />
              طباعة
            </Button>

            {/* Share Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Share2 size={16} className="me-2" />
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

            <Button variant="outline" size="sm" className="rounded-xl">
              <Edit size={16} className="me-2" />
              تعديل
            </Button>
          </div>
        </div>
      </div>

      <main className="p-8 max-w-full">
        <div className="max-w-[1600px] mx-auto">
          <Breadcrumb className="mb-4 print:hidden">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/home/platform">الرئيسية</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/home/platform/properties">العقارات</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{property.title}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <PageHeader title={property.title} subtitle={`${property.address}, ${property.city}`} />
        </div>

        {/* ── Tabbed Interface ─────────────────────────────────────── */}
        <div className="max-w-[1600px] mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 print:hidden">
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
                    <Card className="ui-surface overflow-hidden">
                      <PhotoCarousel
                        photos={photos}
                        alt={property.title}
                        className="aspect-video"
                        showIndicators={true}
                      />
                    </Card>
                  ) : (
                    <Card className="ui-surface">
                      <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                          <p>لا توجد صور متاحة</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Property Details */}
                  <Card className="ui-surface">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl mb-2">{property.title}</CardTitle>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
                            <MapPin size={16} />
                            <span>{property.address}, {property.city}, {property.state}</span>
                          </div>
                        </div>
                        <Badge variant={getPropertyStatusVariant(property.status)} className="rounded-full px-4 py-2">
                          {property.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Price and Key Features */}
                      <div className="mb-6">
                        <div className="text-3xl font-bold text-primary mb-4">
                          {formatCurrency(property.price)}
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          {property.bedrooms && (
                            <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
                              <Bed size={20} />
                              <span>{property.bedrooms} غرف نوم</span>
                            </div>
                          )}
                          {property.bathrooms && (
                            <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
                              <Bath size={20} />
                              <span>{property.bathrooms} حمام</span>
                            </div>
                          )}
                          {property.areaSqm != null && (
                            <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
                              <Square size={20} />
                              <span>{typeof property.areaSqm === "number" ? property.areaSqm.toLocaleString("en-US") : property.areaSqm} متر²</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {property.description && (
                        <div className="mb-6">
                          <h3 className="font-bold mb-3">الوصف</h3>
                          <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                        </div>
                      )}

                      {/* Full Property Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-bold mb-3">تفاصيل العقار</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Home size={14} /> نوع العقار</span>
                              <span className="font-medium">{property.propertyType || "غير محدد"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Layers size={14} /> الفئة</span>
                              <span className="font-medium">{property.category || property.propertyCategory || "غير محدد"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Bed size={14} /> غرف النوم</span>
                              <span className="font-medium">{property.bedrooms ?? "—"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Bath size={14} /> الحمامات</span>
                              <span className="font-medium">{property.bathrooms ?? "—"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Building2 size={14} /> غرف المعيشة</span>
                              <span className="font-medium">{property.livingRooms ?? "—"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Square size={14} /> المساحة (م²)</span>
                              <span className="font-medium">{property.areaSqm != null ? `${property.areaSqm} متر²` : "—"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Square size={14} /> المساحة (قدم²)</span>
                              <span className="font-medium">{property.squareFeet != null ? `${property.squareFeet} قدم²` : "—"}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold mb-3">معلومات إضافية</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Building2 size={14} /> نوع الملكية</span>
                              <span className="font-medium">{property.ownerType || "غير محدد"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Eye size={14} /> الحالة</span>
                              <Badge variant={getPropertyStatusVariant(property.status)}>{property.status}</Badge>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Layers size={14} /> نوع الإدراج</span>
                              <span className="font-medium">{property.listingType || "غير محدد"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Eye size={14} /> الظهور</span>
                              <span className="font-medium">{property.visibility || "عام"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Calendar size={14} /> تاريخ الإضافة</span>
                              <span className="font-medium">{formatAdminDate(property.createdAt)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><Calendar size={14} /> آخر تحديث</span>
                              <span className="font-medium">{formatAdminDate(property.updatedAt)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground flex items-center gap-2"><MapPin size={14} /> الحي</span>
                              <span className="font-medium">{property.district || "غير محدد"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Features / Amenities */}
                      {features.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-bold mb-3">المميزات والمرافق</h3>
                          <div className="flex flex-wrap gap-2">
                            {features.map((feature, idx) => (
                              <Badge key={idx} variant="secondary" className="rounded-full px-3 py-1 text-sm">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Contact Agent Card */}
                  <Card className="ui-surface border-primary/20">
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
                      <Button className="w-full ui-transition" size="lg">
                        <Phone size={16} className="me-2" />
                        اتصال بالوكيل
                      </Button>
                      <Button variant="outline" className="w-full ui-transition" size="lg">
                        <MessageCircle size={16} className="me-2" />
                        واتساب
                      </Button>
                      <Button variant="outline" className="w-full ui-transition" size="lg">
                        <Mail size={16} className="me-2" />
                        إرسال بريد
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Location Map (compact) */}
                  <Card className="ui-surface">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">الموقع</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 w-full mb-4 bg-muted/50 rounded-2xl flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">خريطة الموقع</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {property.address}, {property.city}, {property.state}
                      </div>
                      {latitude !== null && longitude !== null && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {latitude.toFixed(4)}, {longitude.toFixed(4)}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="ui-surface">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">إجراءات سريعة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full ui-transition">
                        <Calendar size={16} className="me-2" />
                        جدولة معاينة
                      </Button>
                      <Button variant="outline" className="w-full ui-transition">
                        <Heart size={16} className="me-2" />
                        إضافة إلى المفضلة
                      </Button>
                      <Button variant="outline" className="w-full ui-transition">
                        <Mail size={16} className="me-2" />
                        طلب معلومات إضافية
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Property Stats */}
                  <Card className="ui-surface">
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
              <Card className="ui-surface">
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
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
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
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center print:hidden">
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
                <Card className="ui-surface">
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

                <Card className="ui-surface">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin size={20} />
                      خريطة الموقع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full bg-muted/50 rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium text-muted-foreground mb-2">خريطة تفاعلية</p>
                        <p className="text-sm text-muted-foreground">
                          {latitude !== null && longitude !== null
                            ? `الإحداثيات: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                            : "إحداثيات الموقع غير متوفرة"
                          }
                        </p>
                        {latitude !== null && longitude !== null && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 rounded-xl"
                            onClick={() => window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')}
                          >
                            <ExternalLink size={14} className="me-2" />
                            عرض على الخريطة
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Nearby landmarks placeholder */}
              <Card className="ui-surface mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 size={20} />
                    المعالم القريبة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: "المسجد الأقرب", distance: "—", icon: Building2 },
                      { name: "أقرب مدرسة", distance: "—", icon: Building2 },
                      { name: "أقرب مستشفى", distance: "—", icon: Building2 },
                      { name: "أقرب مركز تجاري", distance: "—", icon: Building2 },
                      { name: "أقرب حديقة", distance: "—", icon: TreePine },
                      { name: "أقرب محطة وقود", distance: "—", icon: Building2 },
                    ].map((landmark, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <landmark.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{landmark.name}</p>
                          <p className="text-xs text-muted-foreground">{landmark.distance}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Similar Properties Tab ────────────────────────────── */}
            <TabsContent value="similar">
              <Card className="ui-surface">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home size={20} />
                    عقارات مشابهة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SIMILAR_PROPERTIES_PLACEHOLDER.map((similar) => (
                      <Card
                        key={similar.id}
                        className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
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
                            {formatCurrency(similar.price)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Bed size={12} /> {similar.bedrooms}</span>
                            <span className="flex items-center gap-1"><Bath size={12} /> {similar.bathrooms}</span>
                            <span className="flex items-center gap-1"><Square size={12} /> {similar.area} م²</span>
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
                <Card className="ui-surface">
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
                          <p className="text-xl font-bold text-primary">{formatCurrency(property.price)}</p>
                        </div>
                        <Badge variant="default" className="rounded-full">حالي</Badge>
                      </div>

                      {/* Past prices placeholder */}
                      <div className="mt-4 space-y-3">
                        {[
                          { date: "يناير 2026", label: "تحديث السعر" },
                          { date: "أكتوبر 2025", label: "تحديث السعر" },
                          { date: "يونيو 2025", label: "السعر الأول" },
                        ].map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 border border-border/50 rounded-xl">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                              <Clock size={16} className="text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{entry.label}</p>
                              <p className="text-xs text-muted-foreground">{entry.date}</p>
                            </div>
                            <span className="text-sm text-muted-foreground">—</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-4">
                        سجل الأسعار المفصل سيتوفر قريبا
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Status History */}
                <Card className="ui-surface">
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
              <Card className="ui-surface mt-6">
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
                          log.type === "create" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
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
        </div>
      </main>
    </div>
  );
}
