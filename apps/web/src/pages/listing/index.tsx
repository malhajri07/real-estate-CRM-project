/**
 * listing/index.tsx - Public Property Listing Page
 *
 * Full-featured public property detail page with:
 * - Public header and footer
 * - Photo gallery
 * - Property details (type, bedrooms, bathrooms, area, features)
 * - Agent contact card
 * - Location info
 * - Similar properties
 * - Share and report actions
 *
 * Route: /listing/:id (public, no auth required)
 */

import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicHeader from "@/components/layout/PublicHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiGet, apiPost } from "@/lib/apiClient";
import { formatPrice } from "@/lib/formatters";
import { toast } from "sonner";
import {
  Bed, Bath, Maximize, MapPin, Building2, Phone, MessageCircle,
  Mail, Share2, Flag, ArrowRight, Heart, Calendar, Star, Copy,
  Check, ChevronLeft, Sofa, Home, Tag, Layers, Shield,
} from "lucide-react";
import { PROPERTY_TYPE_LABELS, LISTING_STATUS_LABELS, LISTING_TYPE_LABELS } from "@/constants/labels";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function PublicListingPage() {
  const { id } = useParams<{ id: string }>();
  const { dir, language } = useLanguage();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const isAr = language === "ar";

  const { data: property, isLoading, error } = useQuery<any>({
    queryKey: ["/api/listings", id],
    queryFn: () => apiGet(`/api/listings/${id}`),
  });

  const { data: similarRaw } = useQuery<any>({
    queryKey: ["/api/listings", id, "similar"],
    queryFn: async () => {
      try {
        const all = await apiGet<any>("/api/listings?pageSize=6");
        return (all as any)?.items?.filter((p: any) => p.id !== id)?.slice(0, 4) || [];
      } catch { return []; }
    },
  });
  const similar = Array.isArray(similarRaw) ? similarRaw : [];

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(isAr ? "تم نسخ الرابط" : "Link copied");
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  if (isLoading) {
    return (
      <div dir={dir}>
        <PublicHeader />
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div dir={dir}>
        <PublicHeader />
        <div className="max-w-6xl mx-auto p-6 text-center py-20">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-black text-foreground mb-2">{isAr ? "العقار غير متوفر" : "Property not found"}</h2>
          <p className="text-muted-foreground mb-6">{isAr ? "لم يتم العثور على هذا العقار أو تم حذفه" : "This property was not found or has been removed"}</p>
          <Button onClick={() => navigate("/map")}>{isAr ? "عرض العقارات" : "Browse Properties"}</Button>
        </div>
      </div>
    );
  }

  const p = property;
  const photos: string[] = Array.isArray(p.photoUrls) ? p.photoUrls : p.photos ? (typeof p.photos === "string" ? JSON.parse(p.photos) : p.photos) : [];
  const price = p.price ? formatPrice(Number(p.price)) : "—";
  const agent = p.agent || p.users;
  const agentName = agent ? `${agent.firstName || ""} ${agent.lastName || ""}`.trim() : "";
  const agentInitials = agentName ? `${agent?.firstName?.[0] || ""}${agent?.lastName?.[0] || ""}`.toUpperCase() : "W";
  const org = agent?.organization || p.organization;

  const features = [
    p.bedrooms && { icon: Bed, label: isAr ? "غرف النوم" : "Bedrooms", value: p.bedrooms },
    p.bathrooms && { icon: Bath, label: isAr ? "دورات المياه" : "Bathrooms", value: Number(p.bathrooms) },
    p.livingRooms && { icon: Sofa, label: isAr ? "الصالات" : "Living Rooms", value: p.livingRooms },
    p.areaSqm && { icon: Maximize, label: isAr ? "المساحة" : "Area", value: `${Number(p.areaSqm).toLocaleString("en-US")} م²` },
  ].filter(Boolean) as { icon: any; label: string; value: any }[];

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Back + Share bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/map")} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            {isAr ? "العودة للبحث" : "Back to search"}
          </Button>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setFavorited(!favorited)}>
                  <Heart className={cn("h-4 w-4", favorited && "fill-destructive text-destructive")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isAr ? "حفظ" : "Save"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={shareWhatsApp}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isAr ? "مشاركة" : "Share"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الرابط" : "Copy link")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Title + Price header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary">{PROPERTY_TYPE_LABELS[p.type] || PROPERTY_TYPE_LABELS[p.propertyType] || p.type}</Badge>
            {p.listingType && <Badge variant="outline">{LISTING_TYPE_LABELS[p.listingType] || p.listingType}</Badge>}
            <Badge>{LISTING_STATUS_LABELS[p.status] || p.status}</Badge>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">{p.title || (isAr ? "عقار بدون عنوان" : "Untitled Property")}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{[p.district, p.city, p.state].filter(Boolean).join("، ") || p.address || "—"}</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-primary">{price}</span>
            {p.listingType === "rent" && <span className="text-muted-foreground ms-1">/ {isAr ? "شهرياً" : "month"}</span>}
          </div>
        </div>

        {/* Photo Gallery */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden">
            {photos.slice(0, 6).map((url, i) => (
              <img key={i} src={url} alt={`${p.title} - ${i + 1}`} className={cn("w-full object-cover", i === 0 ? "col-span-2 row-span-2 h-80" : "h-40")} loading="lazy" />
            ))}
          </div>
        ) : (
          <Card className="h-64 flex items-center justify-center bg-muted/30">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="font-bold">{isAr ? "لا توجد صور" : "No photos available"}</p>
            </div>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features Grid */}
            {features.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <f.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-foreground">{f.value}</p>
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "الوصف" : "Description"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {p.description || (isAr ? "لا يوجد وصف متاح" : "No description available")}
                </p>
              </CardContent>
            </Card>

            {/* Property Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "تفاصيل العقار" : "Property Details"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                  {[
                    { label: isAr ? "النوع" : "Type", value: PROPERTY_TYPE_LABELS[p.type] || p.type, icon: Home },
                    { label: isAr ? "التصنيف" : "Category", value: p.category || "—", icon: Tag },
                    { label: isAr ? "الحالة" : "Status", value: LISTING_STATUS_LABELS[p.status] || p.status, icon: Layers },
                    { label: isAr ? "المدينة" : "City", value: p.city || "—", icon: MapPin },
                    { label: isAr ? "الحي" : "District", value: p.district || "—", icon: MapPin },
                    { label: isAr ? "العنوان" : "Address", value: p.address || "—", icon: MapPin },
                    p.bedrooms != null && { label: isAr ? "غرف النوم" : "Bedrooms", value: p.bedrooms, icon: Bed },
                    p.bathrooms != null && { label: isAr ? "دورات المياه" : "Bathrooms", value: Number(p.bathrooms), icon: Bath },
                    p.areaSqm != null && { label: isAr ? "المساحة (م²)" : "Area (sqm)", value: Number(p.areaSqm).toLocaleString("en-US"), icon: Maximize },
                  ].filter(Boolean).map((detail: any, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <detail.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">{detail.label}</span>
                      <span className="text-sm font-bold text-foreground ms-auto">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            {(p.latitude || p.longitude) && (
              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "الموقع" : "Location"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-bold">{p.city || ""}{p.district ? `، ${p.district}` : ""}</p>
                      <Button variant="link" size="sm" className="mt-2" onClick={() => window.open(`https://www.google.com/maps?q=${p.latitude},${p.longitude}`, "_blank")}>
                        {isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Agent + Actions */}
          <div className="space-y-6">
            {/* Price Card (sticky) */}
            <Card className="lg:sticky lg:top-20">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">{price}</p>
                  {p.listingType === "rent" && <p className="text-sm text-muted-foreground">{isAr ? "شهرياً" : "per month"}</p>}
                </div>

                <Separator />

                {/* Agent Card */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{isAr ? "الوسيط العقاري" : "Listed by"}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{agentInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground">{agentName || (isAr ? "وسي�� عقاري" : "Real Estate Agent")}</p>
                      {org?.tradeName && <p className="text-xs text-muted-foreground">{org.tradeName}</p>}
                      {agent?.agent_profiles?.licenseNo && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{isAr ? "رخصة" : "License"}: {agent.agent_profiles.licenseNo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {agent?.phone && (
                      <Button variant="outline" className="gap-1.5" onClick={() => window.open(`tel:${agent.phone}`, "_self")}>
                        <Phone className="h-4 w-4" /> {isAr ? "اتصال" : "Call"}
                      </Button>
                    )}
                    {agent?.phone && (
                      <Button className="gap-1.5" onClick={() => window.open(`https://wa.me/${agent.phone.replace(/[^0-9]/g, "")}`, "_blank")}>
                        <MessageCircle className="h-4 w-4" /> {isAr ? "واتساب" : "WhatsApp"}
                      </Button>
                    )}
                    {agent?.email && (
                      <Button variant="outline" className="gap-1.5 col-span-2" onClick={() => window.open(`mailto:${agent.email}`, "_self")}>
                        <Mail className="h-4 w-4" /> {isAr ? "بريد إلكتروني" : "Email"}
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Schedule Viewing */}
                <Button className="w-full gap-2" size="lg" onClick={() => navigate("/rbac-login")}>
                  <Calendar className="h-4 w-4" />
                  {isAr ? "حجز موعد معاينة" : "Schedule a Viewing"}
                </Button>

                {/* Report */}
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={async () => {
                    try {
                      await apiPost("/api/reports", { listingId: id, reason: "محتوى غير مناسب" });
                      toast.success(isAr ? "تم إرسال البلاغ" : "Report submitted");
                    } catch {
                      toast.error(isAr ? "فشل إرسال البلاغ" : "Failed to submit report");
                    }
                  }}
                >
                  <Flag className="h-4 w-4" />
                  {isAr ? "الإبلاغ عن هذا الإعلان" : "Report this listing"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Properties */}
        {similar.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-foreground mb-4">{isAr ? "عقارات مشابهة" : "Similar Properties"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similar.map((item: any) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/listing/${item.id}`)}>
                  <div className="h-40 bg-muted/30 flex items-center justify-center">
                    {item.photoUrls?.[0] ? (
                      <img src={item.photoUrls[0]} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground opacity-30" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="font-bold text-foreground truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.city}</p>
                    <p className="text-primary font-black mt-1">{formatPrice(Number(item.price))}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <LandingFooter content={{ footerDescription: "", footerCopyright: `© ${new Date().getFullYear()} عقاركم. جميع الحقوق محفوظة.` } as any} footerGroups={[]} />
    </div>
  );
}
