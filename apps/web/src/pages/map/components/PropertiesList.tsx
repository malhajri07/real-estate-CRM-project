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
import { TABLE_STYLES, TYPOGRAPHY, BADGE_STYLES } from "@/config/platform-theme";
import type { PropertiesListProps, PropertySummary } from "../types";
import { formatCurrency, getStatusBadgeClasses } from "../utils/formatters";

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
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm relative z-50">
      <table className={cn(TABLE_STYLES.container, "min-w-[900px] w-full text-end")}>
        <thead className={cn(TABLE_STYLES.header, "bg-gray-50 border-b border-gray-200")}>
          <tr className={cn(TABLE_STYLES.headerCell, "text-xs font-medium text-gray-700 uppercase tracking-wider")}>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>الصورة</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>العقار</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>الموقع</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>النوع</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>الحالة</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>السعر</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>المساحة</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>الغرف</th>
            <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>الإجراءات</th>
          </tr>
        </thead>
        <tbody className={cn(TABLE_STYLES.body, "divide-y divide-gray-200")}>
          {properties.map((property) => {
            const isFavourite = favoriteIds.includes(property.id);
            const isActive = highlightedId === property.id;

            return (
              <tr
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
                <td className={cn(TABLE_STYLES.cell, "p-0 w-20 align-middle")}>
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
                      <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </td>

                {/* Property */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                  <div className={cn(TYPOGRAPHY.body, "font-semibold text-gray-900 text-end")}>{property.title}</div>
                </td>

                {/* Location */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                  <div className={cn(TYPOGRAPHY.body, "text-gray-900 text-end")}>
                    {property.city}
                    {property.district && `, ${property.district}`}
                  </div>
                  <div className={cn("mt-1", TYPOGRAPHY.caption, "text-gray-600 text-end")}>{property.address}</div>
                </td>

                {/* Type */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                  <div className={cn(TYPOGRAPHY.body, "text-gray-900 text-end")}>
                    {property.propertyType || property.transactionType || '-'}
                  </div>
                </td>

                {/* Status */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                  {property.status && (
                    <span className={cn(BADGE_STYLES.base, getStatusBadgeClasses(property.status))}>
                      {property.status}
                    </span>
                  )}
                </td>

                {/* Price */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                  <div className={cn(TYPOGRAPHY.body, "font-semibold text-[rgb(128_193_165)] text-end")}>
                    {formatCurrency(property.price)}
                  </div>
                </td>

                {/* Area */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                  {property.areaSqm ? `${property.areaSqm.toLocaleString()} متر²` : '-'}
                </td>

                {/* Rooms */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                  <div className={cn("flex items-center gap-2", TYPOGRAPHY.body, "text-gray-900 text-end")}>
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
                </td>

                {/* Actions */}
                <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                  <div className="flex items-center justify-end gap-1 relative z-50" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={cn(
                        "p-2 rounded-md transition-colors duration-150 relative z-50",
                        isFavourite 
                          ? "text-red-600 hover:text-red-800 hover:bg-red-50" 
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(property.id);
                      }}
                      title={isFavourite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                    >
                      <Heart size={14} className={isFavourite ? "fill-current" : ""} />
                    </button>
                    <button 
                      className="p-2 rounded-md text-slate-600 transition-colors duration-150 hover:text-slate-800 hover:bg-slate-50 relative z-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(property.id);
                      }}
                      title="عرض التفاصيل"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      className="p-2 rounded-md text-purple-600 transition-colors duration-150 hover:text-purple-800 hover:bg-purple-50 relative z-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareProperty(property, 'whatsapp');
                      }}
                      title="مشاركة العقار"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

