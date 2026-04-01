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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { SavedSearchesSkeleton } from '@/components/skeletons/page-skeletons';
import { QueryErrorFallback } from '@/components/ui/query-error-fallback';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { PAGE_WRAPPER } from '@/config/platform-theme';
import { apiPost, apiDelete as apiDel } from '@/lib/apiClient';

const CITY_OPTIONS = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر', 'الطائف', 'تبوك'];
const PROPERTY_TYPE_OPTIONS = ['شقة', 'فيلا', 'أرض', 'مكتب', 'محل تجاري', 'عمارة', 'مستودع'];

export default function SavedSearchesPage() {
  const { dir } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const { data = [], isLoading, isError, refetch } = useQuery<any[]>({ queryKey: ['/api/search/saved'] });

  const create = useMutation({
    mutationFn: async (body: { alertName: string; propertyTypes: string[]; cities: string[] }) => {
      return apiPost('/api/search/saved', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/search/saved'] });
      setShowCreate(false);
      setAlertName('');
      setSelectedCities([]);
      setSelectedTypes([]);
      toast({ title: "تم بنجاح", description: "تم إنشاء البحث المحفوظ" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إنشاء البحث المحفوظ", variant: "destructive" });
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      return apiDel(`/api/search/saved/${id}`) as Promise<unknown>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/search/saved'] });
      toast({ title: "تم بنجاح", description: "تم حذف البحث المحفوظ" });
    },
  });
  const run = useMutation({
    mutationFn: async () => {
      return apiPost('/api/search/run-alerts');
    },
    onSuccess: () => {
      toast({ title: "تم بنجاح", description: "تم تشغيل التنبيهات" });
    },
  });

  const toggleCity = (city: string) => {
    setSelectedCities((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);
  };
  const toggleType = (type: string) => {
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const handleCreate = () => {
    if (!alertName.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم للبحث", variant: "destructive" });
      return;
    }
    create.mutate({ alertName: alertName.trim(), propertyTypes: selectedTypes, cities: selectedCities });
  };

  if (isError) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title="عمليات البحث المحفوظة" />
        <QueryErrorFallback message="فشل تحميل البحث المحفوظ" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <section className="space-y-6">
        <PageHeader title="عمليات البحث المحفوظة" />

        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Button onClick={() => setShowCreate(true)}>
                إضافة بحث
              </Button>
              <Button variant="outline" onClick={() => run.mutate()}>
                تشغيل التنبيهات
              </Button>
            </div>
          </CardContent>
        </Card>

        <Sheet open={showCreate} onOpenChange={setShowCreate}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>بحث محفوظ جديد</SheetTitle>
              <SheetDescription>حدد فلاتر البحث المطلوبة لتنبيهك عند توفر عقارات مطابقة</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 py-4 max-w-lg mx-auto">
              <div className="space-y-2">
                <Label>اسم البحث</Label>
                <Input value={alertName} onChange={(e) => setAlertName(e.target.value)} placeholder="مثال: شقق الرياض" />
              </div>
              <div className="space-y-2">
                <Label>المدن</Label>
                <div className="flex flex-wrap gap-2">
                  {CITY_OPTIONS.map((city) => (
                    <Badge
                      key={city}
                      variant={selectedCities.includes(city) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCity(city)}
                    >
                      {city}
                    </Badge>
                  ))}
                </div>
                {selectedCities.length === 0 && <p className="text-xs text-muted-foreground">لم يتم تحديد مدن (سيشمل الكل)</p>}
              </div>
              <div className="space-y-2">
                <Label>نوع العقار</Label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPE_OPTIONS.map((type) => (
                    <Badge
                      key={type}
                      variant={selectedTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleType(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
                {selectedTypes.length === 0 && <p className="text-xs text-muted-foreground">لم يتم تحديد أنواع (سيشمل الكل)</p>}
              </div>
              <SheetFooter>
                <Button onClick={handleCreate} disabled={create.isPending} className="w-full">
                  {create.isPending ? "جاري الإنشاء..." : "حفظ البحث"}
                </Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>

        {isLoading ? (
          <SavedSearchesSkeleton />
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
