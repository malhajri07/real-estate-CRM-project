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
import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY, LOADING_STYLES } from "@/config/platform-theme";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type AgencyRow = { id: string; name: string; verified: boolean; agentsCount: number; listingsCount: number };

export default function AgenciesPage() {
  const { t, dir } = useLanguage();
  const { data = [], isLoading, error } = useQuery<AgencyRow[]>({ queryKey: ["/api/agencies"] });
  
  if (isLoading) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <div className={LOADING_STYLES.container}>
          <div className={LOADING_STYLES.text}>...جار التحميل</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <main className={PAGE_WRAPPER} dir={dir}>
        <Card className={CARD_STYLES.container}>
          <CardContent className="p-6">
            <div className="text-red-600 text-center">تعذر تحميل الوكالات</div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((a) => (
            <Card key={a.id} className={cn(CARD_STYLES.container, "hover:shadow-lg transition cursor-pointer")}>
              <CardContent className="p-5">
                <a href={`/home/platform/agency/${a.id}`} className="block">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className={cn(TYPOGRAPHY.body, "font-semibold text-slate-900")}>
                        {a.name}{a.verified && <span className="ml-2 text-green-600">✓</span>}
                      </div>
                      <div className={cn(TYPOGRAPHY.caption, "text-slate-600")}>
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
