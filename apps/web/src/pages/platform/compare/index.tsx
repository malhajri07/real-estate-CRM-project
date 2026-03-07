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
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import EmptyState from "@/components/ui/empty-state";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ids = useMemo(() => {
    try {
      const raw = localStorage.getItem('compareIds');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, 4) : [];
    } catch { return []; }
  }, []);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    if (!ids.length) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/listings?ids=${ids.join(',')}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list = Array.isArray(data.items) ? data.items : data;
      setItems(list);
    } catch {
      setError("تعذر تحميل العقارات للمقارنة");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [ids]);

  if (isLoading) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <QueryErrorFallback message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader title={t("مقارنة العقارات")} subtitle={t("قارن بين العقارات المختلفة")} />
      <section className="space-y-6">
        {items.length === 0 ? (
          <EmptyState
            title="لا يوجد عناصر للمقارنة"
            description="أضف عقارات للمقارنة من صفحة البحث"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-5 space-y-2">
                  <div className="text-sm font-semibold">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.address}، {p.city}</div>
                  <div className="text-lg font-bold text-emerald-600">{p.price} ﷼</div>
                  <div className="text-xs text-muted-foreground">النوع: {p.propertyType || '-'}</div>
                  <div className="text-xs text-muted-foreground">الغرف: {p.bedrooms ?? '-'}</div>
                  <div className="text-xs text-muted-foreground">الحمامات: {typeof p.bathrooms === 'string' ? p.bathrooms : (p.bathrooms ?? '-')}</div>
                  <div className="text-xs text-muted-foreground">المساحة: {(p as any).areaSqm ?? '-'} متر²</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
