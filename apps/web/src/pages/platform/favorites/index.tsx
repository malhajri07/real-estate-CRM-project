/**
 * favorites.tsx - Favorites Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → favorites.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * User favorites page. Displays:
 * - User's favorite properties
 * - Favorite management
 * 
 * Route: /home/platform/favorites or /favorites
 * 
 * Related Files:
 * - apps/web/src/components/listings/ListingCard.tsx - Listing card component
 * - apps/api/routes/favorites.ts - Favorites API routes
 */

import { useQuery } from "@tanstack/react-query";
import type { Property } from "@shared/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import PageHeader from "@/components/ui/page-header";
import { FavoritesSkeleton } from "@/components/skeletons/page-skeletons";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import EmptyState from "@/components/ui/empty-state";
import ListingCard from "@/components/listings/ListingCard";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";

export default function FavoritesPage() {
  const { t, dir } = useLanguage();
  const showSkeleton = useMinLoadTime();
  const { data: items = [], isLoading, error, refetch } = useQuery<Property[]>({
    queryKey: ["/api/favorites"],
  });

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <FavoritesSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <QueryErrorFallback message="حدث خطأ في جلب المفضلة" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader title={t("العقارات المفضلة")} subtitle={t("العقارات التي قمت بحفظها")} />
      <section className="space-y-6">
        {items.length === 0 ? (
          <EmptyState
            title="لا توجد عناصر محفوظة"
            description="ابدأ بحفظ العقارات التي تعجبك"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
              <ListingCard key={p.id} item={p as any} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
