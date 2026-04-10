/**
 * PropertiesTable — Table view for the platform properties list.
 * Columns flow right-to-left for Arabic RTL. Zero table padding.
 *
 * Consumer: pages/platform/properties/index.tsx (table view mode).
 */
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
    <Table className="min-w-[900px] [&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-1.5 [&_th]:h-9">
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead>الصورة</TableHead>
          <TableHead>العقار</TableHead>
          <TableHead>الموقع</TableHead>
          <TableHead>النوع</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>السعر</TableHead>
          <TableHead>المساحة</TableHead>
          <TableHead>الغرف</TableHead>
          <TableHead className="w-[100px]">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((property) => (
          <TableRow
            key={property.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onNavigate(property.id)}
          >
            <TableCell>
              {(() => { const p = property as any; const imgs = Array.isArray(p.photoUrls) && p.photoUrls.length ? p.photoUrls : p.photos ? (typeof p.photos === "string" ? (() => { try { return JSON.parse(p.photos); } catch { return []; } })() : []) : []; return imgs.length > 0 ? (
                <img src={imgs[0]} alt={property.title} className="w-14 h-10 object-cover rounded" />
              ) : (
                <div className="w-14 h-10 bg-muted rounded flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              ); })()}
            </TableCell>
            <TableCell>
              <div className="font-bold text-sm line-clamp-1">{property.title}</div>
            </TableCell>
            <TableCell>
              <div className="text-sm">{property.city}</div>
              {property.district && <div className="text-[11px] text-muted-foreground">{property.district}</div>}
            </TableCell>
            <TableCell className="text-sm">{property.propertyType || (property as any).type}</TableCell>
            <TableCell>
              <Badge variant={getPropertyStatusVariant(property.status)} className="text-[10px]">{property.status}</Badge>
            </TableCell>
            <TableCell>
              <SarPrice value={property.price} className="font-bold text-primary text-sm" />
            </TableCell>
            <TableCell className="text-sm tabular-nums">
              {property.areaSqm != null ? `${typeof property.areaSqm === "number" ? property.areaSqm.toLocaleString("en-US") : property.areaSqm} م²` : "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5 text-sm">
                {property.bedrooms && <span className="flex items-center gap-0.5"><Bed size={12} />{property.bedrooms}</span>}
                {property.bathrooms && <span className="flex items-center gap-0.5"><Bath size={12} />{property.bathrooms}</span>}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onNavigate(property.id); }}>
                  <Eye size={13} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onShare(property, "whatsapp"); }}>
                  <Share2 size={13} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(property.id); }} disabled={isDeletePending}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
