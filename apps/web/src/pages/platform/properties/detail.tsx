/**
 * property-detail.tsx - Property Detail Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → property-detail.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Property detail page. Displays:
 * - Property information and details
 * - Property images
 * - Property actions (edit, delete, share)
 * 
 * Route: /home/platform/properties/:id
 * 
 * Related Files:
 * - apps/web/src/pages/properties.tsx - Properties listing page
 * - apps/api/routes/listings.ts - Property API routes
 */

import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowRight, Bed, Bath, Square, MapPin, Calendar, Edit, Trash2, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoCarousel } from "@/components/ui/photo-carousel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
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

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { dir, language } = useLanguage();
  const showSkeleton = useMinLoadTime();
  const locale = language === "ar" ? "ar-SA" : "en-US";

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

  const shareProperty = (property: Property, platform: 'whatsapp' | 'twitter') => {
    const propertyUrl = `${window.location.origin}/home/platform/properties/${property.id}`;
    const shareText = `🏠 ${property.title}\n📍 ${property.address}, ${property.city}\n💰 ${formatCurrency(property.price)}\n\nاكتشف المزيد:`;

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

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
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
            {/* Share Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Share2 size={16} className="me-2" />
                  مشاركة
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => shareProperty(property, 'whatsapp')}>واتساب</DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareProperty(property, 'twitter')}>تويتر</DropdownMenuItem>
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
          <Breadcrumb className="mb-4">
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
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images Carousel */}
            {property.photoUrls && property.photoUrls.length > 0 ? (
              <Card className="ui-surface overflow-hidden">
                <PhotoCarousel
                  photos={property.photoUrls}
                  alt={property.title}
                  className="aspect-video"
                  showIndicators={true}
                />
              </Card>
            ) : (
              <Card className="ui-surface">
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  لا توجد صور متاحة
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

                {/* Property Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold mb-3">تفاصيل العقار</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع العقار</span>
                        <span>{property.propertyType}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ الإضافة</span>
                        <span>{formatAdminDate(property.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">آخر تحديث</span>
                        <span>{formatAdminDate(property.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Map */}
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

            {/* Contact Actions */}
            <Card className="ui-surface">
              <CardHeader>
                <CardTitle className="text-lg font-bold">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full ui-transition">
                  جدولة معاينة
                </Button>
                <Button variant="outline" className="w-full ui-transition">
                  طلب معلومات إضافية
                </Button>
                <Button variant="outline" className="w-full ui-transition">
                  إضافة إلى المفضلة
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
