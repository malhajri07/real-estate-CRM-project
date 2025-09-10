import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SavedSearchesPage() {
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
    <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-green-50 to-slate-100" dir="rtl">
      <Card className="mb-6">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">عمليات البحث المحفوظة</h1>
          <p className="text-gray-600">إدارة التنبيهات والبحث السريع</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Button onClick={() => create.mutate()} className="bg-green-600 hover:bg-green-700">
              إضافة بحث
            </Button>
            <Button variant="outline" onClick={() => run.mutate()}>
              تشغيل التنبيهات
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600">...جار التحميل</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg text-gray-900">{s.alertName}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      المدن: {(s.cities||[]).join(', ') || 'الكل'}
                    </div>
                    <div className="text-sm text-gray-600">
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
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-600 text-lg">لا توجد عمليات بحث محفوظة</div>
                <p className="text-gray-500 mt-2">ابدأ بإنشاء بحث محفوظ جديد</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}

