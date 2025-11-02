import { useQuery } from "@tanstack/react-query";
import type { Property } from "@shared/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ListingCard from "@/components/listings/ListingCard";
import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY, LOADING_STYLES, EMPTY_STYLES } from "@/config/platform-theme";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const { t } = useLanguage();
  const { data: items = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/favorites"],
  });

  if (isLoading) {
    return (
      <main className={PAGE_WRAPPER} dir="rtl">
        <div className={LOADING_STYLES.container}>
          <div className={LOADING_STYLES.text}>...جار التحميل</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={PAGE_WRAPPER} dir="rtl">
        <Card className={CARD_STYLES.container}>
          <CardContent className="p-6">
            <div className={cn(EMPTY_STYLES.description, "text-red-600 text-center")}>حدث خطأ في جلب المفضلة</div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className={PAGE_WRAPPER} dir="rtl">
      <section className="space-y-6">
        <Card className={CARD_STYLES.container}>
          <CardHeader className={CARD_STYLES.header}>
            <CardTitle className={TYPOGRAPHY.pageTitle}>العقارات المفضلة</CardTitle>
            <p className={cn(TYPOGRAPHY.body, "text-gray-600 mt-2")}>العقارات التي قمت بحفظها</p>
          </CardHeader>
        </Card>

        {items.length === 0 ? (
          <Card className={CARD_STYLES.container}>
            <CardContent className={cn(EMPTY_STYLES.container, "p-8")}>
              <div className={cn(EMPTY_STYLES.title, "text-gray-600")}>لا توجد عناصر محفوظة</div>
              <p className={cn(EMPTY_STYLES.description, "text-gray-500 mt-2")}>ابدأ بحفظ العقارات التي تعجبك</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
              <ListingCard key={p.id} item={p as any} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
