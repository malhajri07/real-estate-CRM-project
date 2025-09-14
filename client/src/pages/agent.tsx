import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AgentPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<{ agent: any; listings: any[] }>({ queryKey: ["/api/agencies/agent", id] });
  
  if (isLoading) return <div className="text-gray-600">...جار التحميل</div>;
  if (error || !data) return <div>تعذر تحميل الوسيط</div>;

  const a = data.agent;
  return (
    <div>
      <div className="text-gray-600 mb-6">إعلانات: {data.listings.length}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
