/**
 * saved-searches.tsx - Saved Searches Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → saved-searches.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Saved searches management page. Provides:
 * - Saved search listing
 * - Saved search management
 * - Search execution
 * 
 * Route: /home/platform/saved-searches or /saved-searches
 * 
 * Related Files:
 * - apps/api/routes/search.ts - Search API routes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SavedSearchesPage() {
  const { dir } = useLanguage();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/search/saved'] });

  const create = useMutation({
    mutationFn: async () => {
      const body = { alertName: 'بحث جديد', propertyTypes: [], cities: [] };
      const r = await fetch('/api/search/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('fail');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/search/saved'] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/search/saved/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('fail');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/search/saved'] }),
  });
  const run = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/search/run-alerts', { method: 'POST' });
      return r.json();
    }
  });

  return (
    <div className="w-full space-y-6" dir={dir}>
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">عمليات البحث المحفوظة</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">إدارة التنبيهات والبحث السريع</p>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Button onClick={() => create.mutate()}>
                إضافة بحث
              </Button>
              <Button variant="outline" onClick={() => run.mutate()}>
                تشغيل التنبيهات
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{s.alertName}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        المدن: {(s.cities||[]).join(', ') || 'الكل'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        الأنواع: {(s.propertyTypes||[]).join(', ') || 'الكل'}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => del.mutate(s.id)}>
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {data.length === 0 && (
              <EmptyState
                title="لا توجد عمليات بحث محفوظة"
                description="ابدأ بإنشاء بحث محفوظ جديد"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
