/**
 * agencies.tsx - Agencies Listing Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → agencies.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Agencies listing page. Displays:
 * - List of all agencies
 * - Agency verification status
 * - Agent and listing counts
 * 
 * Route: /home/platform/agencies or /agencies
 * 
 * Related Files:
 * - apps/web/src/pages/agency.tsx - Agency detail page
 * - apps/api/routes/agencies.ts - Agencies API routes
 */

import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AgencyRow = { id: string; name: string; verified: boolean; agentsCount: number; listingsCount: number };

export default function AgenciesPage() {
  const { t, dir } = useLanguage();
  const { data = [], isLoading, error } = useQuery<AgencyRow[]>({ queryKey: ["/api/agencies"] });
  
  if (isLoading) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <main className={PAGE_WRAPPER} dir={dir}>
        <Alert variant="destructive">
          <AlertDescription className="text-center">تعذر تحميل الوكالات</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((a) => (
            <Card key={a.id} className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="p-5">
                <a href={`/home/platform/agency/${a.id}`} className="block">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-semibold">
                        {a.name}{a.verified && <span className="ms-2 text-green-600">✓</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        عدد الوسطاء: {a.agentsCount} — عدد الإعلانات: {a.listingsCount}
                      </div>
                    </div>
                    <div className="text-primary">عرض</div>
                  </div>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
