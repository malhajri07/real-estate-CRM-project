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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EmptyState from "@/components/ui/empty-state";
import ListingCard from "@/components/listings/ListingCard";

export default function FavoritesPage() {
  const { t, dir } = useLanguage();
  const { data: items = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/favorites"],
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-6" dir={dir}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-6" dir={dir}>
        <Alert variant="destructive">
          <AlertDescription className="text-center">حدث خطأ في جلب المفضلة</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6" dir={dir}>
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">العقارات المفضلة</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">العقارات التي قمت بحفظها</p>
          </CardHeader>
        </Card>

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
