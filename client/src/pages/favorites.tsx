import { useQuery } from "@tanstack/react-query";
import type { Property } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import ListingCard from "@/components/listings/ListingCard";

export default function FavoritesPage() {
  const { t } = useLanguage();
  const { data: items = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/favorites"],
  });

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-green-50 to-slate-100" dir="rtl">
        <div className="text-center py-8 text-gray-600">...جار التحميل</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-green-50 to-slate-100" dir="rtl">
        <div className="text-center py-8 text-red-600">حدث خطأ في جلب المفضلة</div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-green-50 to-slate-100" dir="rtl">
      <Card className="mb-6">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">العقارات المفضلة</h1>
          <p className="text-gray-600">العقارات التي قمت بحفظها</p>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600 text-lg">لا توجد عناصر محفوظة</div>
            <p className="text-gray-500 mt-2">ابدأ بحفظ العقارات التي تعجبك</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <ListingCard key={p.id} item={p as any} />
          ))}
        </div>
      )}
    </main>
  );
}
