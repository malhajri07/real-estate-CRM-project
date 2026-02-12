/**
 * compare.tsx - Property Comparison Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → compare.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Property comparison page. Provides:
 * - Side-by-side property comparison
 * - Property feature comparison
 * 
 * Route: /home/platform/compare or /compare
 * 
 * Related Files:
 * - apps/web/src/pages/properties.tsx - Properties listing
 * - apps/web/src/pages/favorites.tsx - Favorites page
 */

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY, EMPTY_STYLES } from "@/config/platform-theme";
import { cn } from "@/lib/utils";

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
  const { t, dir } = useLanguage();
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
    <main className={PAGE_WRAPPER} dir={dir}>
      <section className="space-y-6">
        <Card className={CARD_STYLES.container}>
          <CardHeader className={CARD_STYLES.header}>
            <CardTitle className={TYPOGRAPHY.pageTitle}>مقارنة العقارات</CardTitle>
            <p className={cn(TYPOGRAPHY.body, "text-slate-600 mt-2")}>قارن بين العقارات المختلفة</p>
          </CardHeader>
        </Card>

        {items.length === 0 ? (
          <Card className={CARD_STYLES.container}>
            <CardContent className={cn(EMPTY_STYLES.container, "p-8")}>
              <div className={cn(EMPTY_STYLES.title, "text-slate-600")}>لا يوجد عناصر للمقارنة</div>
              <p className={cn(EMPTY_STYLES.description, "text-slate-500 mt-2")}>أضف عقارات للمقارنة من صفحة البحث</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((p) => (
              <Card key={p.id} className={CARD_STYLES.container}>
                <CardContent className="p-5 space-y-2">
                  <div className={cn(TYPOGRAPHY.body, "font-semibold text-slate-900")}>{p.title}</div>
                  <div className={cn(TYPOGRAPHY.caption, "text-slate-600")}>{p.address}، {p.city}</div>
                  <div className={cn(TYPOGRAPHY.sectionTitle, "text-emerald-600 font-bold")}>{p.price} ﷼</div>
                  <div className={cn(TYPOGRAPHY.caption, "text-sm")}>النوع: {p.propertyType || '-'}</div>
                  <div className={cn(TYPOGRAPHY.caption, "text-sm")}>الغرف: {p.bedrooms ?? '-'}</div>
                  <div className={cn(TYPOGRAPHY.caption, "text-sm")}>الحمامات: {typeof p.bathrooms === 'string' ? p.bathrooms : (p.bathrooms ?? '-')}</div>
                  <div className={cn(TYPOGRAPHY.caption, "text-sm")}>المساحة: {(p as any).areaSqm ?? '-'} متر²</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
