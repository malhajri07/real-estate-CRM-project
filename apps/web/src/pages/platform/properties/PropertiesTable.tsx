import { Trash2, Edit, Eye, Bed, Bath, Square, Share2, Sofa } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <TableHeader>
        <TableRow>
          <TableHead className="text-end">الصورة</TableHead>
          <TableHead className="text-end">العقار</TableHead>
          <TableHead className="text-end">الموقع</TableHead>
          <TableHead className="text-end">النوع</TableHead>
          <TableHead className="text-end">الحالة</TableHead>
          <TableHead className="text-end">السعر</TableHead>
          <TableHead className="text-end">المساحة</TableHead>
          <TableHead className="text-end">الغرف</TableHead>
          <TableHead className="text-end">الإجراءات</TableHead>
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
              {property.photoUrls && property.photoUrls.length > 0 ? (
                <img
                  src={property.photoUrls[0]}
                  alt={property.title}
                  className="w-16 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="font-semibold line-clamp-1">{property.title}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Square size={12} />
                  {property.propertyType}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div>{property.city}, {property.state}</div>
              <div className="mt-1 text-xs text-muted-foreground">{property.address}</div>
            </TableCell>
            <TableCell>{property.propertyType}</TableCell>
            <TableCell>
              <Badge variant={getPropertyStatusVariant(property.status)}>
                {property.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="font-semibold text-emerald-600">
                {formatCurrency(property.price)}
              </div>
            </TableCell>
            <TableCell>
              {(property as any).areaSqm ? `${((property as any).areaSqm?.toLocaleString?.("en-US") ?? (property as any).areaSqm)} متر²` : "-"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
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
                {(property as any).livingRooms && (
                  <span className="flex items-center gap-1">
                    <Sofa size={12} />
                    {(property as any).livingRooms}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onNavigate(property.id); }}
                  title="عرض التفاصيل"
                >
                  <Eye size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onShare(property, "whatsapp"); }}
                  title="مشاركة العقار"
                >
                  <Share2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} title="تعديل العقار">
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onDelete(property.id); }}
                  disabled={isDeletePending}
                  title="حذف العقار"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
