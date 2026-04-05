/**
 * unverified-listings-management.tsx - Unverified Listings Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → unverified-listings-management.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Unverified listings management page for authenticated users. Provides:
 * - Unverified listing listing
 * - Listing approval/rejection
 * - Listing detail view
 * 
 * Route: /home/platform/unverified-listings
 * 
 * Related Files:
 * - apps/web/src/pages/unverified-listing.tsx - Public listing submission
 * - apps/api/routes/unverified-listings.ts - Unverified listings API routes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageSectionHeader } from "@/components/ui/page-section-header";
import { useState } from "react";
import { CheckCircle2, XCircle, Eye, Phone, Mail, MapPin, Bed, Bath, Square } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import EmptyState from "@/components/ui/empty-state";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";
import {
  AdminSheet,
  AdminSheetContent,
  AdminSheetHeader,
  AdminSheetTitle,
  AdminSheetDescription,
} from "@/components/admin";
import { apiGet, apiPost } from "@/lib/apiClient";
import { formatPrice } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { DELETE_BUTTON_STYLES } from "@/config/design-tokens";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { PhotoCarousel } from "@/components/ui/photo-carousel";

interface UnverifiedListing {
  id: string;
  propertyId: string;
  title: string;
  description?: string;
  propertyType: string;
  listingType: string;
  country?: string;
  region?: string;
  city?: string;
  district?: string;
  streetAddress?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  kitchens?: number;
  floorNumber?: number;
  totalFloors?: number;
  areaSqm?: number;
  buildingYear?: number;
  hasParking: boolean;
  hasElevator: boolean;
  hasMaidsRoom: boolean;
  hasDriverRoom: boolean;
  furnished: boolean;
  balcony: boolean;
  swimmingPool: boolean;
  centralAc: boolean;
  price: number;
  currency?: string;
  paymentFrequency?: string;
  mainImageUrl?: string;
  imageGallery?: string[];
  videoClipUrl?: string;
  contactName?: string;
  mobileNumber: string;
  isVerified: boolean;
  isActive: boolean;
  status: string;
  viewsCount?: number;
  favoritesCount?: number;
  listedDate: Date | string;
  updatedAt: Date | string;
}

export default function UnverifiedListingsManagement() {
  const showSkeleton = useMinLoadTime();
  const [selectedListing, setSelectedListing] = useState<UnverifiedListing | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery<UnverifiedListing[]>({
    queryKey: ["/api/unverified-listings", statusFilter],
    queryFn: async () => apiGet<UnverifiedListing[]>(`api/unverified-listings?status=${statusFilter}`),
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => apiPost(`api/unverified-listings/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unverified-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      toast({
        title: "نجح",
        description: "تم قبول الإعلان بنجاح وأصبح جزءاً من المجموعة",
      });
      setDetailDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "فشل في قبول الإعلان",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) =>
      apiPost(`api/unverified-listings/${id}/reject`, { reason: "Rejected by agent" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unverified-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      toast({
        title: "نجح",
        description: "تم رفض الإعلان بنجاح",
      });
      setDetailDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "فشل في رفض الإعلان",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (listing: UnverifiedListing) => {
    setSelectedListing(listing);
    setDetailDialogOpen(true);
  };

  const handleAccept = (listing: UnverifiedListing) => {
    acceptMutation.mutate(listing.id);
  };

  const handleReject = (listing: UnverifiedListing) => {
    if (confirm("هل أنت متأكد من رفض هذا الإعلان؟")) {
      rejectMutation.mutate(listing.id);
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "غير متوفر";
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
      Pending: { label: "قيد المراجعة", variant: "secondary" },
      Approved: { label: "موافق عليه", variant: "default" },
      Rejected: { label: "مرفوض", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className={PAGE_WRAPPER}>
      <div className="space-y-6">
        <PageSectionHeader
          title="إعلانات غير موثقة"
          subtitle="مراجعة وقبول أو رفض الإعلانات المقدمة"
          actions={
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">قيد المراجعة</SelectItem>
                <SelectItem value="Approved">موافق عليها</SelectItem>
                <SelectItem value="Rejected">مرفوضة</SelectItem>
                <SelectItem value="all">الكل</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {(isLoading || showSkeleton) ? (
          <AdminPageSkeleton />
        ) : !listings || listings.length === 0 ? (
          <EmptyState
            title={`لا توجد إعلانات${statusFilter ? ` بحالة ${statusFilter}` : ""}`}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الإعلان</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>الجهة المعلنة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-mono text-sm">{listing.propertyId}</TableCell>
                      <TableCell className="font-medium">{listing.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{listing.propertyType}</span>
                          <span className="text-xs text-muted-foreground">{listing.listingType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {listing.city && <span className="text-sm">{listing.city}</span>}
                          {listing.district && <span className="text-xs text-muted-foreground">{listing.district}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{formatPrice(listing.price, listing.currency)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {listing.contactName && <span className="text-sm">{listing.contactName}</span>}
                          <span className="text-xs text-muted-foreground">{listing.mobileNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(listing.listedDate)}</TableCell>
                      <TableCell>{getStatusBadge(listing.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(listing)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {listing.status === "Pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAccept(listing)}
                                disabled={acceptMutation.isPending}
                                className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                              >
                                {acceptMutation.isPending ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(listing)}
                                disabled={rejectMutation.isPending}
                                className={`h-8 w-8 p-0 ${DELETE_BUTTON_STYLES}`}
                              >
                                {rejectMutation.isPending ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Drawer */}
      <AdminSheet open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <AdminSheetContent side="start" className="w-full sm:max-w-3xl overflow-y-auto">
          <AdminSheetHeader>
            <AdminSheetTitle className="text-2xl font-bold">{selectedListing?.title}</AdminSheetTitle>
            <AdminSheetDescription>
              <span className="font-mono text-sm text-muted-foreground">{selectedListing?.propertyId}</span>
            </AdminSheetDescription>
          </AdminSheetHeader>

          {selectedListing && (
            <div className="space-y-6 py-6">
              {/* Images */}
              {selectedListing.imageGallery && selectedListing.imageGallery.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-foreground border-b pb-2">الصور</h3>
                  <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                    <PhotoCarousel
                      photos={selectedListing.imageGallery ?? []}
                      alt={selectedListing.title ?? "صور الإعلان"}
                      autoHeight
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-muted/30 p-6 rounded-2xl border border-border">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground block mb-1">نوع العقار</Label>
                  <p className="text-base font-bold text-foreground">{selectedListing.propertyType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground block mb-1">نوع العرض</Label>
                  <Badge variant="outline" className="text-base font-normal">{selectedListing.listingType}</Badge>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-sm font-medium text-muted-foreground block mb-1">السعر</Label>
                  <p className="text-xl font-bold text-primary">{formatPrice(selectedListing.price, selectedListing.currency)}</p>
                </div>
                {selectedListing.paymentFrequency && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground block mb-1">تكرار الدفع</Label>
                    <p className="text-base font-medium text-foreground">{selectedListing.paymentFrequency}</p>
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  الموقع
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-xl border border-border">
                  {selectedListing.region && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">المنطقة</Label>
                      <p className="text-base">{selectedListing.region}</p>
                    </div>
                  )}
                  {selectedListing.city && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">المدينة</Label>
                      <p className="text-base">{selectedListing.city}</p>
                    </div>
                  )}
                  {selectedListing.district && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">الحي</Label>
                      <p className="text-base">{selectedListing.district}</p>
                    </div>
                  )}
                  {selectedListing.streetAddress && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">العنوان التفصيلي</Label>
                      <p className="text-base">{selectedListing.streetAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-foreground">المواصفات</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {selectedListing.bedrooms !== null && selectedListing.bedrooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                      <Bed className="h-5 w-5 text-muted-foreground/70" />
                      <span className="text-sm font-medium">{selectedListing.bedrooms} غرف</span>
                    </div>
                  )}
                  {selectedListing.bathrooms !== null && selectedListing.bathrooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                      <Bath className="h-5 w-5 text-muted-foreground/70" />
                      <span className="text-sm font-medium">{selectedListing.bathrooms} حمامات</span>
                    </div>
                  )}
                  {selectedListing.areaSqm !== null && selectedListing.areaSqm !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                      <Square className="h-5 w-5 text-muted-foreground/70" />
                      <span className="text-sm font-medium">{selectedListing.areaSqm} م²</span>
                    </div>
                  )}
                  {selectedListing.livingRooms !== null && selectedListing.livingRooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="text-sm font-medium">صالات المعيشة: {selectedListing.livingRooms}</span>
                    </div>
                  )}
                  {selectedListing.kitchens !== null && selectedListing.kitchens !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="text-sm font-medium">مطابخ: {selectedListing.kitchens}</span>
                    </div>
                  )}
                  {selectedListing.buildingYear && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                      <span className="text-sm font-medium">سنة البناء: {selectedListing.buildingYear}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-foreground">المرافق</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.hasParking && <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/5 text-primary hover:bg-primary/10">موقف سيارة</Badge>}
                  {selectedListing.hasElevator && <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/5 text-primary hover:bg-primary/10">مصعد</Badge>}
                  {selectedListing.hasMaidsRoom && <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/5 text-primary hover:bg-primary/10">غرفة خادمة</Badge>}
                  {selectedListing.hasDriverRoom && <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/5 text-primary hover:bg-primary/10">غرفة سائق</Badge>}
                  {selectedListing.furnished && <Badge variant="secondary" className="px-3 py-1 text-sm bg-secondary text-secondary-foreground hover:bg-secondary">مفروش</Badge>}
                  {selectedListing.balcony && <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/10">شرفة</Badge>}
                  {selectedListing.swimmingPool && <Badge variant="secondary" className="px-3 py-1 text-sm bg-accent text-accent-foreground hover:bg-accent">مسبح</Badge>}
                  {selectedListing.centralAc && <Badge variant="secondary" className="px-3 py-1 text-sm bg-warning/10 text-warning hover:bg-warning/20">تكييف مركزي</Badge>}
                </div>
              </div>

              {/* Description */}
              {selectedListing.description && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-foreground">الوصف</h3>
                  <div className="bg-muted/30 p-6 rounded-2xl border border-border text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {selectedListing.description}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-foreground">معلومات التواصل</h3>
                <div className="grid grid-cols-2 gap-6 bg-foreground text-white p-6 rounded-2xl shadow-lg">
                  {selectedListing.contactName && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground/70 mb-1 block">الاسم</Label>
                      <p className="text-lg font-bold">{selectedListing.contactName}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground/70 mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      رقم الجوال
                    </Label>
                    <p className="text-lg font-bold font-mono dir-ltr text-right">{selectedListing.mobileNumber}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedListing.status === "Pending" && (
                <div className="sticky bottom-0 bg-card border-t p-6 mt-6 -mx-6 mb-[-1.5rem] flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedListing)}
                    disabled={rejectMutation.isPending}
                    className={`h-11 px-6 rounded-xl ${DELETE_BUTTON_STYLES} border-destructive/20`}
                  >
                    {rejectMutation.isPending ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        جاري الرفض...
                      </>
                    ) : (
                      <>
                        <XCircle className="me-2 h-4 w-4" />
                        رفض
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleAccept(selectedListing)}
                    disabled={acceptMutation.isPending}
                    className="h-11 px-8 rounded-xl bg-primary/10 hover:bg-primary/10 text-white shadow-lg shadow-primary/20"
                  >
                    {acceptMutation.isPending ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        جاري القبول...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="me-2 h-4 w-4" />
                        قبول وإضافة للمجموعة
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </AdminSheetContent>
      </AdminSheet>
    </div>
  );
}

