import { SarPrice } from "@/components/ui/sar-symbol";
import { Trash2, Edit, Eye, Bed, Bath, Square, Share2, Sofa } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Property } from "@shared/types";
import { getPropertyStatusVariant } from "@/lib/status-variants";

export interface PropertiesTableProps {
  properties: Property[];
  formatCurrency: (amount: string | number | null | undefined) => string;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (property: Property, platform: "whatsapp" | "twitter") => void;
  isDeletePending: boolean;
}

export default function PropertiesTable({
  properties,
  formatCurrency,
  onNavigate,
  onDelete,
  onShare,
  isDeletePending,
}: PropertiesTableProps) {
  return (
    <Table className="min-w-[900px]">
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-[120px]">{"الإجراءات"}</TableHead>
          <TableHead>{"الغرف"}</TableHead>
          <TableHead>{"المساحة"}</TableHead>
          <TableHead>{"السعر"}</TableHead>
          <TableHead>{"الحالة"}</TableHead>
          <TableHead>{"النوع"}</TableHead>
          <TableHead>{"الموقع"}</TableHead>
          <TableHead>{"العقار"}</TableHead>
          <TableHead>{"الصورة"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((property) => (
          <TableRow
            key={property.id}
            className="cursor-pointer"
            onClick={() => onNavigate(property.id)}
          >
            <TableCell>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onNavigate(property.id); }}>
                      <Eye size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>عرض</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onShare(property, "whatsapp"); }}>
                      <Share2 size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>مشاركة</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <Edit size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>تعديل</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(property.id); }} disabled={isDeletePending}>
                      <Trash2 size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>حذف</TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {property.bedrooms && (
                  <span className="flex items-center gap-1"><Bed size={12} />{property.bedrooms}</span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1"><Bath size={12} />{property.bathrooms}</span>
                )}
                {property.livingRooms != null && property.livingRooms !== 0 && (
                  <span className="flex items-center gap-1"><Sofa size={12} />{property.livingRooms}</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {property.areaSqm != null ? `${typeof property.areaSqm === "number" ? property.areaSqm.toLocaleString("en-US") : property.areaSqm} متر²` : "-"}
            </TableCell>
            <TableCell>
              <SarPrice value={property.price} className="font-bold text-primary" />
            </TableCell>
            <TableCell>
              <Badge variant={getPropertyStatusVariant(property.status)}>{property.status}</Badge>
            </TableCell>
            <TableCell>{property.propertyType}</TableCell>
            <TableCell>
              <div>{property.city}{property.state ? `, ${property.state}` : ""}</div>
              <div className="mt-1 text-xs text-muted-foreground">{property.address}</div>
            </TableCell>
            <TableCell>
              <div className="font-bold line-clamp-1">{property.title}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Square size={12} />{property.propertyType}</span>
              </div>
            </TableCell>
            <TableCell>
              {(() => { const p = property as any; const imgs = Array.isArray(p.photoUrls) && p.photoUrls.length ? p.photoUrls : p.photos ? (typeof p.photos === "string" ? (() => { try { return JSON.parse(p.photos); } catch { return []; } })() : []) : []; return imgs.length > 0 ? (
                <img src={imgs[0]} alt={property.title} className="w-16 h-12 object-cover rounded" />
              ) : (
                <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              ); })()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
