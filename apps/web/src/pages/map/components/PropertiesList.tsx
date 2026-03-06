/**
 * PropertiesList.tsx - Properties List Component
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → components/ → PropertiesList.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Properties list component. Displays:
 * - Data-table view of filtered properties
 * - Property information and actions
 * - Matches properties page table style
 * 
 * Related Files:
 * - apps/web/src/pages/map/index.tsx - Map page
 * - apps/web/src/pages/properties.tsx - Properties page
 */

/**
 * PropertiesList Component
 * 
 * Display a data-table view of the filtered properties matching the properties page table style.
 */

import { MapPin, Bed, Bath, Heart, Eye, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { PropertiesListProps, PropertySummary } from "../types";
import { formatCurrency } from "../utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'orange' | 'purple';

function getMapPropertyStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active': return 'warning';
    case 'pending': return 'info';
    case 'sold': return 'success';
    case 'withdrawn': return 'destructive';
    default: return 'secondary';
  }
}

export function PropertiesList({
  properties,
  favoriteIds,
  highlightedId,
  onHighlight,
  onToggleFavorite,
  onNavigate,
}: PropertiesListProps) {
  // Display empty state if no properties
  if (!properties.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center text-muted-foreground">
        <MapPin className="h-10 w-10 text-muted-foreground/50" />
        <p className="max-w-sm text-balance text-sm">
          لم يتم العثور على عقارات مطابقة للمعايير الحالية. حاول تعديل البحث أو إعادة تعيين عوامل التصفية.
        </p>
      </div>
    );
  }

  const shareProperty = (property: PropertySummary, platform: 'whatsapp' | 'twitter') => {
    const propertyUrl = `${window.location.origin}/home/platform/properties/${property.id}`;
    const shareText = `🏠 ${property.title}\n📍 ${property.address}, ${property.city}\n💰 ${formatCurrency(property.price)}\n\nاكتشف المزيد:`;
    
    let shareUrl = '';
    
    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${propertyUrl}`)}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(propertyUrl)}`;
    }
    
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm relative z-50">
      <Table className="min-w-[900px] text-end">
        <TableHeader className="bg-slate-50 border-b border-border">
          <TableRow className="text-xs font-medium text-slate-700 uppercase tracking-wider">
            <TableHead className="px-6 py-3 text-end">الصورة</TableHead>
            <TableHead className="px-6 py-3 text-end">العقار</TableHead>
            <TableHead className="px-6 py-3 text-end">الموقع</TableHead>
            <TableHead className="px-6 py-3 text-end">النوع</TableHead>
            <TableHead className="px-6 py-3 text-end">الحالة</TableHead>
            <TableHead className="px-6 py-3 text-end">السعر</TableHead>
            <TableHead className="px-6 py-3 text-end">المساحة</TableHead>
            <TableHead className="px-6 py-3 text-end">الغرف</TableHead>
            <TableHead className="px-6 py-3 text-end">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-200">
          {properties.map((property) => {
            const isFavourite = favoriteIds.includes(property.id);
            const isActive = highlightedId === property.id;

            return (
              <TableRow
                key={property.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-slate-50/50",
                  isActive && "bg-slate-100"
                )}
                onMouseEnter={() => onHighlight(property)}
                onMouseLeave={() => onHighlight(null)}
                onClick={() => onNavigate(property.id)}
              >
                {/* Image */}
                <TableCell className="p-0 w-20 align-middle text-sm text-slate-700">
                  <div className="relative w-20 h-20 min-h-[80px]">
                    {property.photoUrls && property.photoUrls.length > 0 ? (
                      <img 
                        src={property.photoUrls[0]} 
                        alt={property.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          logger.warn('Image failed to load', {
                            context: 'PropertiesList',
                            data: { 
                              propertyId: property.id, 
                              photoUrl: property.photoUrls?.[0] 
                            }
                          });
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-slate-100 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Property */}
                <TableCell className="px-6 py-4 text-end text-sm">
                  <div className="font-semibold text-slate-900">{property.title}</div>
                </TableCell>

                {/* Location */}
                <TableCell className="px-6 py-4 text-end text-sm">
                  <div className="text-slate-900">
                    {property.city}
                    {property.district && `, ${property.district}`}
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-600">{property.address}</div>
                </TableCell>

                {/* Type */}
                <TableCell className="px-6 py-4 text-end text-sm">
                  <div className="text-slate-900">
                    {property.propertyType || property.transactionType || '-'}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="px-6 py-4 text-end text-sm">
                  {property.status && (
                    <Badge variant={getMapPropertyStatusVariant(property.status)}>
                      {property.status}
                    </Badge>
                  )}
                </TableCell>

                {/* Price */}
                <TableCell className="px-6 py-4 text-end text-sm">
                  <div className="font-semibold text-[rgb(128_193_165)]">
                    {formatCurrency(property.price)}
                  </div>
                </TableCell>

                {/* Area */}
                <TableCell className="px-6 py-4 text-end text-sm">
                  {property.areaSqm ? `${property.areaSqm.toLocaleString("en-US")} متر²` : '-'}
                </TableCell>

                {/* Rooms */}
                <TableCell className="px-6 py-4 text-end text-sm">
                  <div className="flex items-center gap-2 text-slate-900">
                    {property.bedrooms && (
                      <span className="flex items-center gap-1">
                        <Bed size={12} />
                        {property.bedrooms}
                      </span>
                    )}
                    {property.bathrooms && (
                      <span className="flex items-center gap-1">
                        <Bath size={12} />
                        {property.bathrooms}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="px-6 py-4 text-end text-sm">
                  <div className="flex items-center justify-end gap-1 relative z-50" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-md transition-colors duration-150 relative z-50",
                        isFavourite 
                          ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(property.id);
                      }}
                      title={isFavourite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                    >
                      <Heart size={14} className={isFavourite ? "fill-current" : ""} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md text-slate-600 transition-colors duration-150 hover:text-slate-800 hover:bg-slate-50 relative z-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(property.id);
                      }}
                      title="عرض التفاصيل"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md text-purple-600 transition-colors duration-150 hover:text-purple-800 hover:bg-purple-50 relative z-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareProperty(property, 'whatsapp');
                      }}
                      title="مشاركة العقار"
                    >
                      <Share2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

