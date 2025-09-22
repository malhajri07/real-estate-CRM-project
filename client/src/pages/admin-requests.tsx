import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
      const res = await fetch('/api/requests');
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
      const res = await fetch(`/api/requests/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
      });
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
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col pr-72">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">إدارة الطلبات العقارية</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onExport}>تصدير CSV</Button>
              <Button variant="secondary" onClick={fetchData} disabled={loading}>{loading ? '...' : 'تحديث'}</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input placeholder="بحث بالاسم/البريد/المدينة" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="حالة الطلب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="contacted">تم التواصل</SelectItem>
                <SelectItem value="closed">مغلق</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-right">التاريخ</th>
                  <th className="px-3 py-2 text-right">العميل</th>
                  <th className="px-3 py-2 text-right">النوع</th>
                  <th className="px-3 py-2 text-right">المدن</th>
                  <th className="px-3 py-2 text-right">الأنواع</th>
                  <th className="px-3 py-2 text-right">السعر</th>
                  <th className="px-3 py-2 text-right">الغرف/حمامات</th>
                  <th className="px-3 py-2 text-right">المساحة</th>
                  <th className="px-3 py-2 text-right">الحالة</th>
                  <th className="px-3 py-2 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(r.requestDate || r.createdAt).toLocaleString("ar-SA")}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.customerName}</div>
                      <div className="text-xs text-gray-500">{r.customerEmail}{r.customerPhone ? ` • ${r.customerPhone}` : ''}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.requestType === 'rent' ? `إيجار${r.pricePeriod ? ` (${r.pricePeriod === 'monthly' ? 'شهري' : 'سنوي'})` : ''}` : 'شراء'}</td>
                    <td className="px-3 py-2">{r.cities?.join(', ')}</td>
                    <td className="px-3 py-2">{r.propertyTypes?.join(', ')}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.minPrice || r.maxPrice ? `${r.minPrice || ''} - ${r.maxPrice || ''}` : '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.minBedrooms || r.minBathrooms ? `${r.minBedrooms || 0} • ${r.minBathrooms || 0}` : '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.minArea || r.maxArea ? `${r.minArea || ''} - ${r.maxArea || ''}` : '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.status === 'new' ? 'جديد' : r.status === 'contacted' ? 'تم التواصل' : 'مغلق'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'contacted')}>تم التواصل</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, 'closed')}>إغلاق</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={10}>لا توجد طلبات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
