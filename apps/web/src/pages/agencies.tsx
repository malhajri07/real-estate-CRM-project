import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

type AgencyRow = { id: string; name: string; verified: boolean; agentsCount: number; listingsCount: number };

export default function AgenciesPage() {
  const { t } = useLanguage();
  const { data = [], isLoading, error } = useQuery<AgencyRow[]>({ queryKey: ["/api/agencies"] });
  if (isLoading) return <div className="text-gray-600">...جار التحميل</div>;
  if (error) return <div className="text-red-600">تعذر تحميل الوكالات</div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((a) => (
          <a key={a.id} href={`/home/platform/agency/${a.id}`} className="ui-surface p-5 hover:shadow-lg ui-transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-gray-900">{a.name}{a.verified && <span className="ml-2 text-green-600">✓</span>}</div>
                <div className="text-sm text-gray-600">عدد الوسطاء: {a.agentsCount} — عدد الإعلانات: {a.listingsCount}</div>
              </div>
              <div className="text-primary">عرض</div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
