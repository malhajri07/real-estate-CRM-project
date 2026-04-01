/**
 * admin-requests.tsx - Admin Requests Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → admin-requests.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin requests management page. Provides:
 * - Admin request listing
 * - Request management
 * 
 * Route: /home/platform/admin-requests or /admin/requests
 * 
 * Related Files:
 * - apps/web/src/pages/admin/ - Admin management pages
 */

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPatch } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { formatAdminDate } from "@/lib/formatters";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { DELETE_BUTTON_STYLES } from "@/config/design-tokens";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { Badge } from "@/components/ui/badge";
import { Search, Download, RefreshCw } from "lucide-react";

type RequestItem = {
  id: string;
  createdAt: string;
  requestDate?: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  requestType: string;
  pricePeriod?: string;
  propertyTypes?: string[];
  cities?: string[];
  neighborhoods?: string[];
  minPrice?: string | number;
  maxPrice?: string | number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  furnishing?: string;
  orientation?: string;
  hasElevator?: boolean;
  hasParking?: boolean;
  timeframe?: string;
  notes?: string;
};

export default function AdminRequestsPage() {
  const showSkeleton = useMinLoadTime();
  const { toast } = useToast();
  const [data, setData] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const json = await apiGet<RequestItem[]>("api/requests");
      setData(json);
    } catch (e) {
      toast({ title: "خطأ", description: "تعذر تحميل الطلبات" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return data.filter(r => {
      const matchStatus = statusFilter === 'all' ? true : (r.status === statusFilter);
      const q = query.trim().toLowerCase();
      const matchQ = q ? (
        r.customerName?.toLowerCase().includes(q) ||
        r.customerEmail?.toLowerCase().includes(q) ||
        r.cities?.join(',').toLowerCase().includes(q) ||
        r.propertyTypes?.join(',').toLowerCase().includes(q)
      ) : true;
      return matchStatus && matchQ;
    });
  }, [data, statusFilter, query]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiPatch(`api/requests/${id}/status`, { status });
      toast({ title: "تم التحديث" });
      fetchData();
    } catch {
      toast({ title: "خطأ", description: "تعذر تحديث الحالة" });
    }
  };

  const onExport = () => {
    window.open('/api/requests/export', '_blank');
  };

  if (loading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight mb-6">إدارة الطلبات العقارية</h1>
        <AdminPageSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">إدارة الطلبات العقارية</CardTitle>
              <CardDescription>عرض وإدارة طلبات العملاء العقارية</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onExport} className="gap-2">
                <Download className="h-4 w-4" />
                تصدير CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchData} 
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                {loading ? 'جاري التحديث...' : 'تحديث'}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم/البريد/المدينة"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pe-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="contacted">تم التواصل</SelectItem>
                <SelectItem value="closed">مغلق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المدن</TableHead>
                <TableHead>الأنواع</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الغرف/حمامات</TableHead>
                <TableHead>المساحة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {formatAdminDate(r.requestDate || r.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{r.customerName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {r.customerEmail}
                      {r.customerPhone && <span className="block">{r.customerPhone}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {r.requestType === 'rent' ? `إيجار${r.pricePeriod ? ` (${r.pricePeriod === 'monthly' ? 'شهري' : 'سنوي'})` : ''}` : 'شراء'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px] truncate" title={r.cities?.join(', ')}>
                      {r.cities?.join(', ') || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px] truncate" title={r.propertyTypes?.join(', ')}>
                      {r.propertyTypes?.join(', ') || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-primary whitespace-nowrap">
                      {r.minPrice || r.maxPrice ? `${Number(r.minPrice || 0).toLocaleString("en-US")} - ${Number(r.maxPrice || 0).toLocaleString("en-US")}` : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap">
                      {r.minBedrooms || r.minBathrooms ? `${r.minBedrooms || 0} غرف • ${r.minBathrooms || 0} حمام` : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap">
                      {r.minArea || r.maxArea ? `${r.minArea || 0} - ${r.maxArea || 0} م²` : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      r.status === 'new' ? 'warning' :
                      r.status === 'contacted' ? 'info' :
                      'secondary'
                    }>
                      {r.status === 'new' ? 'جديد' : r.status === 'contacted' ? 'تم التواصل' : 'مغلق'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => updateStatus(r.id, 'contacted')}
                        disabled={r.status === 'contacted'}
                        className="h-8 text-xs"
                      >
                        تواصل
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => updateStatus(r.id, 'closed')}
                        className={`h-8 w-8 p-0 ${DELETE_BUTTON_STYLES}`}
                        title="إغلاق الطلب"
                      >
                        ✕
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell className="py-12 text-center text-muted-foreground" colSpan={10}>
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>لا توجد طلبات مطابقة للبحث</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
