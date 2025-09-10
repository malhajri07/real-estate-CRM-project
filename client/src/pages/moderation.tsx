import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Property } from "@shared/schema";
import PublicLayout from "@/components/layout/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ModerationQueuePage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery<Property[]>({ queryKey: ["/api/moderation/queue"] });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/moderation/${id}/approve`, { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/moderation/queue"] }),
  });
  const reject = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/moderation/${id}/reject`, { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/moderation/queue"] }),
  });

  return (
    <PublicLayout title={t('public.moderation_title')}>
      {isLoading && <div className="text-gray-600">...جار التحميل</div>}
      {!isLoading && items.length === 0 && <div className="text-gray-600">لا توجد إعلانات للمراجعة</div>}
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="apple-card p-5 flex justify-between items-center">
            <div>
              <div className="font-semibold">{p.title}</div>
              <div className="text-sm text-gray-600">{p.address}، {p.city} — {p.propertyType}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => approve.mutate(p.id)}>اعتماد</button>
              <button className="px-3 py-1 rounded bg-gray-200" onClick={() => reject.mutate(p.id)}>رفض</button>
            </div>
          </div>
        ))}
      </div>
    </PublicLayout>
  );
}
