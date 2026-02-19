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
import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY, BUTTON_PRIMARY_CLASSES, LOADING_STYLES, EMPTY_STYLES } from '@/config/platform-theme';
import { cn } from '@/lib/utils';
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
    <div className={PAGE_WRAPPER} dir={dir}>
      <section className="space-y-6">
        <Card className={CARD_STYLES.container}>
          <CardHeader className={CARD_STYLES.header}>
            <CardTitle className={TYPOGRAPHY.pageTitle}>عمليات البحث المحفوظة</CardTitle>
            <p className={cn(TYPOGRAPHY.body, "text-slate-600 mt-2")}>إدارة التنبيهات والبحث السريع</p>
          </CardHeader>
        </Card>

        <Card className={CARD_STYLES.container}>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Button onClick={() => create.mutate()} className={BUTTON_PRIMARY_CLASSES}>
                إضافة بحث
              </Button>
              <Button variant="outline" onClick={() => run.mutate()}>
                تشغيل التنبيهات
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className={CARD_STYLES.container}>
            <CardContent className={LOADING_STYLES.container}>
              <div className={LOADING_STYLES.text}>...جار التحميل</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((s: any) => (
              <Card key={s.id} className={CARD_STYLES.container}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className={cn(TYPOGRAPHY.cardTitle, "text-slate-900")}>{s.alertName}</div>
                      <div className={cn(TYPOGRAPHY.caption, "text-slate-600 mt-1")}>
                        المدن: {(s.cities||[]).join(', ') || 'الكل'}
                      </div>
                      <div className={cn(TYPOGRAPHY.caption, "text-slate-600")}>
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
              <Card className={CARD_STYLES.container}>
                <CardContent className={cn(EMPTY_STYLES.container, "p-8")}>
                  <div className={cn(EMPTY_STYLES.title, "text-slate-600")}>لا توجد عمليات بحث محفوظة</div>
                  <p className={cn(EMPTY_STYLES.description, "text-slate-500 mt-2")}>ابدأ بإنشاء بحث محفوظ جديد</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

