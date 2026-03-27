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
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { getPropertyStatusVariant } from "@/lib/status-variants";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import PageHeader from "@/components/ui/page-header";
import type { Property } from "@shared/types";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { dir, language } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const { data: property, isLoading, error } = useQuery<Property>({
    queryKey: ["/api/listings", id],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${id}`);
      if (!response.ok) throw new Error('Property not found');
      return response.json();
    },
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

  if (isLoading) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title="تفاصيل العقار" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
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
            <div className="h-6 w-px bg-border"></div>
            <span className="text-xl font-semibold">{property.title}</span>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* Share Dropdown */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="rounded-xl">
                <Share2 size={16} className={"me-2"} />
                مشاركة
              </Button>

              {/* Share Dropdown Menu */}
              <div className="absolute top-full start-0 mt-2 bg-card rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[140px]">
                <div className="p-2 space-y-1">
                  <Button
                    variant="ghost"
                    onClick={() => shareProperty(property, 'whatsapp')}
                    className="w-full text-end px-3 py-2 text-sm hover:bg-muted/50 rounded-md flex items-center gap-2 text-foreground/80"
                  >
                    <svg className="w-4 h-4 fill-current text-primary" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382" />
                    </svg>
                    واتساب
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => shareProperty(property, 'twitter')}
                    className="w-full text-end px-3 py-2 text-sm hover:bg-muted/50 rounded-md flex items-center gap-2 text-foreground/80"
                  >
                    <svg className="w-4 h-4 fill-current text-blue-400" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    تويتر
                  </Button>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="rounded-xl">
              <Edit size={16} className={"me-2"} />
              تعديل
            </Button>
          </div>
        </div>
      </div>

      <main className="p-8 max-w-full">
        <div className="max-w-[1600px] mx-auto">
          <PageHeader title={property.title} subtitle={`${property.address}, ${property.city}`} />
        </div>
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                  <div className="grid grid-cols-3 gap-4">
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
                    <h3 className="font-semibold mb-3">الوصف</h3>
                    <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                  </div>
                )}

                {/* Property Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">تفاصيل العقار</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع العقار</span>
                        <span>{property.propertyType}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ الإضافة</span>
                        <span>{new Date(property.createdAt).toLocaleDateString(locale)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">آخر تحديث</span>
                        <span>{new Date(property.updatedAt).toLocaleDateString(locale)}</span>
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
                <CardTitle className="text-lg">الموقع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 w-full mb-4 bg-muted/50 rounded-lg flex items-center justify-center">
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
                <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <CardTitle className="text-lg">إحصائيات العقار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
