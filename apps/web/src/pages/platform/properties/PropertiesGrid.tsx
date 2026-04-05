import { Trash2, Edit, Eye, Bed, Bath, Square, Share2, Sofa, ImageIcon } from "lucide-react";
import { SarPrice } from "@/components/ui/sar-symbol";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PhotoCarousel } from "@/components/ui/photo-carousel";
import type { Property } from "@shared/types";
import { getPropertyStatusVariant } from "@/lib/status-variants";

export interface PropertiesGridProps {
  properties: Property[];
  formatCurrency: (amount: string | number | null | undefined) => string;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (property: Property, platform: "whatsapp" | "twitter") => void;
  isDeletePending: boolean;
}

export default function PropertiesGrid({
  properties,
  formatCurrency,
  onNavigate,
  onDelete,
  onShare,
  isDeletePending,
}: PropertiesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <Card
          key={property.id}
          className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
          onClick={() => onNavigate(property.id)}
        >
          {(() => {
            const p = property as any;
            const imgs: string[] = Array.isArray(p.photoUrls) && p.photoUrls.length > 0 ? p.photoUrls
              : p.photos ? (typeof p.photos === "string" ? (() => { try { return JSON.parse(p.photos); } catch { return []; } })() : Array.isArray(p.photos) ? p.photos : [])
              : [];
            return imgs.length > 0 ? (
            <PhotoCarousel
              photos={imgs}
              alt={property.title}
              className="aspect-video"
              showIndicators={imgs.length > 1}
              loading="lazy"
            />
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center border-b">
              <div className="text-center text-muted-foreground">
                <Avatar className="w-16 h-16 mx-auto mb-2">
                  <AvatarFallback className="bg-muted/60">
                    <ImageIcon className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">لا توجد صور</p>
                <p className="text-xs">صورة العقار غير متوفرة</p>
              </div>
            </div>
          );
          })()}
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg text-foreground line-clamp-1 tracking-tight">
                {property.title}
              </h3>
              <Badge variant={getPropertyStatusVariant(property.status)}>
                {property.status}
              </Badge>
            </div>

            <p className="text-muted-foreground text-sm mb-4">
              {property.address}, {property.city}, {property.state}
            </p>

            <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-muted-foreground mb-4">
              {property.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed size={14} />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath size={14} />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              {property.livingRooms != null && property.livingRooms !== 0 && (
                <div className="flex items-center gap-1">
                  <Sofa size={14} />
                  <span>{property.livingRooms}</span>
                </div>
              )}
              {property.areaSqm != null && (
                <div className="flex items-center gap-1">
                  <Square size={14} />
                  <span>{typeof property.areaSqm === "number" ? property.areaSqm.toLocaleString("en-US") : property.areaSqm} متر²</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <SarPrice value={property.price} className="text-primary font-bold text-lg" />

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onNavigate(property.id); }}
                  title="عرض التفاصيل"
                >
                  <Eye size={16} />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} title="مشاركة العقار">
                      <Share2 size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top">
                    <DropdownMenuItem onClick={() => onShare(property, "whatsapp")}>
                      <svg className="w-4 h-4 fill-current text-primary" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382" />
                      </svg>
                      واتساب
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShare(property, "twitter")}>
                      <svg className="w-4 h-4 fill-current text-accent-foreground" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      تويتر
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} title="تعديل العقار">
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onDelete(property.id); }}
                  disabled={isDeletePending}
                  title="حذف العقار"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            {property.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {property.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
