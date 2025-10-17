import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";

type Listing = {
  id: string;
  title: string;
  city: string;
  address: string;
  price: any;
  propertyType?: string;
  bedrooms?: number | null;
  bathrooms?: number | null | string;
  squareFeet?: number | null;
};

export default function ComparePage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<Listing[]>([]);

  const ids = useMemo(() => {
    try {
      const raw = localStorage.getItem('compareIds');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, 4) : [];
    } catch { return []; }
  }, []);

  useEffect(() => {
    async function load() {
      if (!ids.length) return setItems([]);
      const res = await fetch(`/api/listings?ids=${ids.join(',')}`);
      if (!res.ok) return setItems([]);
      const data = await res.json();
      const list = Array.isArray(data.items) ? data.items : data; // supports both array and paged
      setItems(list);
    }
    load();
  }, [ids]);

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-green-50 to-slate-100">
      <Card className="mb-6">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">مقارنة العقارات</h1>
          <p className="text-gray-600">قارن بين العقارات المختلفة</p>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600 text-lg">لا يوجد عناصر للمقارنة</div>
            <p className="text-gray-500 mt-2">أضف عقارات للمقارنة من صفحة البحث</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((p) => (
            <Card key={p.id} className="p-5">
              <CardContent className="p-0">
                <div className="font-semibold mb-1 text-gray-900">{p.title}</div>
                <div className="text-sm text-gray-600 mb-2">{p.address}، {p.city}</div>
                <div className="text-green-700 font-bold mb-2">{p.price} ﷼</div>
                <div className="text-sm">النوع: {p.propertyType || '-'}</div>
                <div className="text-sm">الغرف: {p.bedrooms ?? '-'}</div>
                <div className="text-sm">الحمامات: {typeof p.bathrooms === 'string' ? p.bathrooms : (p.bathrooms ?? '-')}</div>
            <div className="text-sm">المساحة: {(p as any).areaSqm ?? '-'} متر²</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
