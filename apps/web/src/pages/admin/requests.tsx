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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY, BUTTON_PRIMARY_CLASSES, TABLE_STYLES, INPUT_STYLES, BADGE_STYLES } from "@/config/platform-theme";
import { cn } from "@/lib/utils";
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
  const { toast } = useToast();
  const [data, setData] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/requests");
      const json = await res.json();
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
      const res = await apiRequest("PATCH", `/api/requests/${id}/status`, { status });
      if (!res.ok) throw new Error();
      toast({ title: "تم التحديث" });
      fetchData();
    } catch {
      toast({ title: "خطأ", description: "تعذر تحديث الحالة" });
    }
  };

  const onExport = () => {
    window.open('/api/requests/export', '_blank');
  };

  return (
    <main className={PAGE_WRAPPER} dir="rtl">
      <Card className={CARD_STYLES.container}>
        <CardHeader className={CARD_STYLES.header}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className={TYPOGRAPHY.pageTitle}>إدارة الطلبات العقارية</CardTitle>
              <p className={TYPOGRAPHY.pageSubtitle}>عرض وإدارة طلبات العملاء العقارية</p>
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
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="بحث بالاسم/البريد/المدينة" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                className={cn(INPUT_STYLES.search, "pr-10")}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-slate-200">
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
          <div className="overflow-x-auto">
            <table className={TABLE_STYLES.container}>
              <thead className={TABLE_STYLES.header}>
                <tr>
                  <th className={TABLE_STYLES.headerCell}>التاريخ</th>
                  <th className={TABLE_STYLES.headerCell}>العميل</th>
                  <th className={TABLE_STYLES.headerCell}>النوع</th>
                  <th className={TABLE_STYLES.headerCell}>المدن</th>
                  <th className={TABLE_STYLES.headerCell}>الأنواع</th>
                  <th className={TABLE_STYLES.headerCell}>السعر</th>
                  <th className={TABLE_STYLES.headerCell}>الغرف/حمامات</th>
                  <th className={TABLE_STYLES.headerCell}>المساحة</th>
                  <th className={TABLE_STYLES.headerCell}>الحالة</th>
                  <th className={TABLE_STYLES.headerCell}>إجراء</th>
                </tr>
              </thead>
              <tbody className={TABLE_STYLES.body}>
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className={TABLE_STYLES.cell}>
                      <span className="whitespace-nowrap text-slate-500">
                        {new Date(r.requestDate || r.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                    </td>
                    <td className={TABLE_STYLES.cell}>
                      <div className="font-semibold text-slate-900">{r.customerName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {r.customerEmail}
                        {r.customerPhone && <span className="block">{r.customerPhone}</span>}
                      </div>
                    </td>
                    <td className={TABLE_STYLES.cell}>
                      <Badge variant="outline" className="bg-slate-50">
                        {r.requestType === 'rent' ? `إيجار${r.pricePeriod ? ` (${r.pricePeriod === 'monthly' ? 'شهري' : 'سنوي'})` : ''}` : 'شراء'}
                      </Badge>
                    </td>
                    <td className={TABLE_STYLES.cell}>
                      <div className="max-w-[150px] truncate" title={r.cities?.join(', ')}>
                        {r.cities?.join(', ') || '-'}
                      </div>
                    </td>
                    <td className={TABLE_STYLES.cell}>
                      <div className="max-w-[150px] truncate" title={r.propertyTypes?.join(', ')}>
                        {r.propertyTypes?.join(', ') || '-'}
                      </div>
                    </td>
                    <td className={TABLE_STYLES.cell}>
                      <span className="font-medium text-emerald-600 whitespace-nowrap">
                        {r.minPrice || r.maxPrice ? `${Number(r.minPrice || 0).toLocaleString()} - ${Number(r.maxPrice || 0).toLocaleString()}` : '-'}
                      </span>
                    </td>
                    <td className={TABLE_STYLES.cell}>
                      <span className="text-slate-600 whitespace-nowrap">
                        {r.minBedrooms || r.minBathrooms ? `${r.minBedrooms || 0} غرف • ${r.minBathrooms || 0} حمام` : '-'}
                      </span>
                    </td>
                    <td className={TABLE_STYLES.cell}>
                      <span className="text-slate-600 whitespace-nowrap">
                        {r.minArea || r.maxArea ? `${r.minArea || 0} - ${r.maxArea || 0} م²` : '-'}
                      </span>
                    </td>
                    <td className={TABLE_STYLES.cell}>
                      <Badge className={cn(
                        BADGE_STYLES.base,
                        r.status === 'new' ? BADGE_STYLES.warning :
                        r.status === 'contacted' ? BADGE_STYLES.info :
                        BADGE_STYLES.secondary
                      )}>
                        {r.status === 'new' ? 'جديد' : r.status === 'contacted' ? 'تم التواصل' : 'مغلق'}
                      </Badge>
                    </td>
                    <td className={TABLE_STYLES.cell}>
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
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="إغلاق الطلب"
                        >
                          ✕
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center text-slate-500" colSpan={10}>
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 opacity-20" />
                        <p>لا توجد طلبات مطابقة للبحث</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
