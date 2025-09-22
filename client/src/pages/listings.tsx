import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ListingCard from "@/components/listings/ListingCard";

type Page = { items: any[]; page: number; pageSize: number; total: number; totalPages: number } | any[];

export default function ListingsPage() {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (city) p.set('city', city);
    if (type) p.set('propertyType', type);
    if (sort) p.set('sort', sort);
    p.set('page', String(page));
    p.set('pageSize', String(pageSize));
    return `/api/listings?${p.toString()}`;
  }, [q, city, type, sort, page, pageSize]);

  const { data, isLoading, error } = useQuery<Page>({ queryKey: [url] });
  const items = Array.isArray(data) ? data : (data?.items || []);
  const totalPages = Array.isArray(data) ? 1 : (data?.totalPages || 1);

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-green-50 to-slate-100">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input 
              placeholder="كلمة مفتاحية" 
              value={q} 
              onChange={(e) => { setQ(e.target.value); setPage(1); }} 
            />
            <Input 
              placeholder="المدينة" 
              value={city} 
              onChange={(e) => { setCity(e.target.value); setPage(1); }} 
            />
            <Input 
              placeholder="النوع (شقة، فيلا...)" 
              value={type} 
              onChange={(e) => { setType(e.target.value); setPage(1); }} 
            />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger>
                <SelectValue placeholder="ترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price_asc">السعر ↑</SelectItem>
                <SelectItem value="price_desc">السعر ↓</SelectItem>
                <SelectItem value="area_asc">المساحة ↑</SelectItem>
                <SelectItem value="area_desc">المساحة ↓</SelectItem>
                <SelectItem value="popular">الأكثر مشاهدة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pageSize.toString()} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="عدد العناصر" />
              </SelectTrigger>
              <SelectContent>
                {[12,24,48].map(n => (
                  <SelectItem key={n} value={n.toString()}>{n} /صفحة</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="text-center py-8 text-gray-600">...جار التحميل</div>}
      {error && <div className="text-center py-8 text-red-600">حدث خطأ</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p: any) => (
          <ListingCard key={p.id} item={p} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-8">
        <Button 
          variant="outline" 
          disabled={page<=1} 
          onClick={() => setPage(p => Math.max(1, p-1))}
        >
          السابق
        </Button>
        <div className="text-gray-600">صفحة {page} من {totalPages}</div>
        <Button 
          variant="outline" 
          disabled={page>=totalPages} 
          onClick={() => setPage(p => p+1)}
        >
          التالي
        </Button>
      </div>
    </main>
  );
}
