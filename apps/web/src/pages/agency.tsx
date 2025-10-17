import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AgencyPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<{ agency: any; agents: any[]; listings: any[] }>({ queryKey: ["/api/agencies", id] });
  
  if (isLoading) return <div className="text-gray-600">...جار التحميل</div>;
  if (error || !data) return <div>تعذر تحميل الوكالة</div>;

  return (
    <div>
      <div className="text-gray-600 mb-6">وسطاء: {data.agents.length} — إعلانات: {data.listings.length}</div>

      <h2 className="text-xl font-semibold mb-2">الوسطاء</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {data.agents.map((u) => (
          <a key={u.id} href={`/home/platform/agent/${u.id}`} className="apple-card p-4">{u.firstName} {u.lastName}</a>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-2">الإعلانات</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.listings.map((p) => (
          <div key={p.id} className="apple-card p-5">
            <div className="font-semibold">{p.title}</div>
            <div className="text-sm text-gray-600">{p.address}، {p.city}</div>
            <div className="text-green-700 font-bold">{p.price} ﷼</div>
          </div>
        ))}
      </div>
    </div>
  );
}
