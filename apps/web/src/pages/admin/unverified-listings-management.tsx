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
import { useState } from "react";
import { CheckCircle2, XCircle, Eye, Phone, Mail, MapPin, Bed, Bath, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminSheet,
  AdminSheetContent,
  AdminSheetHeader,
  AdminSheetTitle,
  AdminSheetDescription,
} from "@/components/admin";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY, BUTTON_PRIMARY_CLASSES, BADGE_STYLES, LOADING_STYLES, EMPTY_STYLES } from "@/config/platform-theme";
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
  const [selectedListing, setSelectedListing] = useState<UnverifiedListing | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debug: Log component mount
  console.log('UnverifiedListingsManagement component mounted');

  const { data: listings, isLoading } = useQuery<UnverifiedListing[]>({
    queryKey: ["/api/unverified-listings", statusFilter],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/unverified-listings?status=${statusFilter}`);
      return response.json();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/unverified-listings/${id}/accept`);
      return response.json();
    },
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
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/unverified-listings/${id}/reject`, {
        reason: "Rejected by agent",
      });
      return response.json();
    },
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

  const formatPrice = (price: number, currency: string = "SAR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
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
    <div className={PAGE_WRAPPER} dir="rtl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={TYPOGRAPHY.pageTitle}>إعلانات غير موثقة</h1>
            <p className={TYPOGRAPHY.pageSubtitle}>مراجعة وقبول أو رفض الإعلانات المقدمة</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              <option value="Pending">قيد المراجعة</option>
              <option value="Approved">موافق عليها</option>
              <option value="Rejected">مرفوضة</option>
              <option value="">الكل</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className={cn(LOADING_STYLES.container, "flex-col gap-3")}>
            <Loader2 className={LOADING_STYLES.spinner} />
            <p className={TYPOGRAPHY.pageSubtitle}>جار التحميل...</p>
          </div>
        ) : !listings || listings.length === 0 ? (
          <Card className={CARD_STYLES.container}>
            <CardContent className={EMPTY_STYLES.container}>
              <p className={TYPOGRAPHY.pageSubtitle}>لا توجد إعلانات {statusFilter ? `بحالة ${statusFilter}` : ""}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className={CARD_STYLES.container}>
            <CardContent className={cn(CARD_STYLES.content, "p-0")}>
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
                          <span className="text-xs text-gray-500">{listing.listingType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {listing.city && <span className="text-sm">{listing.city}</span>}
                          {listing.district && <span className="text-xs text-gray-500">{listing.district}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(listing.price, listing.currency)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {listing.contactName && <span className="text-sm">{listing.contactName}</span>}
                          <span className="text-xs text-gray-500">{listing.mobileNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(listing.listedDate)}</TableCell>
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
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                {acceptMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReject(listing)}
                                disabled={rejectMutation.isPending}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {rejectMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
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
              <span className="font-mono text-sm text-gray-500">{selectedListing?.propertyId}</span>
            </AdminSheetDescription>
          </AdminSheetHeader>

          {selectedListing && (
            <div className="space-y-8 py-6">
              {/* Images */}
              {selectedListing.imageGallery && selectedListing.imageGallery.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">الصور</h3>
                  <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <PhotoCarousel
                      photos={selectedListing.imageGallery ?? []}
                      alt={selectedListing.title ?? "صور الإعلان"}
                      autoHeight
                    />
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">نوع العقار</label>
                  <p className="text-base font-semibold text-gray-900">{selectedListing.propertyType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">نوع العرض</label>
                  <Badge variant="outline" className="text-base font-normal">{selectedListing.listingType}</Badge>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-500 block mb-1">السعر</label>
                  <p className="text-xl font-bold text-emerald-600">{formatPrice(selectedListing.price, selectedListing.currency)}</p>
                </div>
                {selectedListing.paymentFrequency && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">تكرار الدفع</label>
                    <p className="text-base font-medium text-gray-900">{selectedListing.paymentFrequency}</p>
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  الموقع
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-100">
                  {selectedListing.region && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">المنطقة</label>
                      <p className="text-base">{selectedListing.region}</p>
                    </div>
                  )}
                  {selectedListing.city && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">المدينة</label>
                      <p className="text-base">{selectedListing.city}</p>
                    </div>
                  )}
                  {selectedListing.district && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">الحي</label>
                      <p className="text-base">{selectedListing.district}</p>
                    </div>
                  )}
                  {selectedListing.streetAddress && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">العنوان التفصيلي</label>
                      <p className="text-base">{selectedListing.streetAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">المواصفات</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {selectedListing.bedrooms !== null && selectedListing.bedrooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Bed className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">{selectedListing.bedrooms} غرف</span>
                    </div>
                  )}
                  {selectedListing.bathrooms !== null && selectedListing.bathrooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Bath className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">{selectedListing.bathrooms} حمامات</span>
                    </div>
                  )}
                  {selectedListing.areaSqm !== null && selectedListing.areaSqm !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Square className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">{selectedListing.areaSqm} م²</span>
                    </div>
                  )}
                  {selectedListing.livingRooms !== null && selectedListing.livingRooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-medium">صالات المعيشة: {selectedListing.livingRooms}</span>
                    </div>
                  )}
                  {selectedListing.kitchens !== null && selectedListing.kitchens !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-medium">مطابخ: {selectedListing.kitchens}</span>
                    </div>
                  )}
                  {selectedListing.buildingYear && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-medium">سنة البناء: {selectedListing.buildingYear}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">المرافق</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.hasParking && <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100">موقف سيارة</Badge>}
                  {selectedListing.hasElevator && <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100">مصعد</Badge>}
                  {selectedListing.hasMaidsRoom && <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100">غرفة خادمة</Badge>}
                  {selectedListing.hasDriverRoom && <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100">غرفة سائق</Badge>}
                  {selectedListing.furnished && <Badge variant="secondary" className="px-3 py-1 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100">مفروش</Badge>}
                  {selectedListing.balcony && <Badge variant="secondary" className="px-3 py-1 text-sm bg-green-50 text-green-700 hover:bg-green-100">شرفة</Badge>}
                  {selectedListing.swimmingPool && <Badge variant="secondary" className="px-3 py-1 text-sm bg-cyan-50 text-cyan-700 hover:bg-cyan-100">مسبح</Badge>}
                  {selectedListing.centralAc && <Badge variant="secondary" className="px-3 py-1 text-sm bg-orange-50 text-orange-700 hover:bg-orange-100">تكييف مركزي</Badge>}
                </div>
              </div>

              {/* Description */}
              {selectedListing.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">الوصف</h3>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {selectedListing.description}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">معلومات التواصل</h3>
                <div className="grid grid-cols-2 gap-6 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                  {selectedListing.contactName && (
                    <div>
                      <label className="text-sm font-medium text-slate-400 mb-1 block">الاسم</label>
                      <p className="text-lg font-semibold">{selectedListing.contactName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      رقم الجوال
                    </label>
                    <p className="text-lg font-semibold font-mono dir-ltr text-right">{selectedListing.mobileNumber}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedListing.status === "Pending" && (
                <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t p-6 mt-6 -mx-6 mb-[-1.5rem] flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedListing)}
                    disabled={rejectMutation.isPending}
                    className="h-11 px-6 rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {rejectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الرفض...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        رفض
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleAccept(selectedListing)}
                    disabled={acceptMutation.isPending}
                    className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                  >
                    {acceptMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري القبول...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
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

