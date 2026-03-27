/**
 * agent.tsx - Agent Profile Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → agent.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Agent profile page. Displays:
 * - Agent information
 * - Agent listings
 * - Agent statistics
 * 
 * Route: /home/platform/agent/:id or /agent/:id
 * 
 * Related Files:
 * - apps/web/src/pages/agencies.tsx - Agencies listing
 * - apps/web/src/pages/agency.tsx - Agency detail
 */

import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import EmptyState from "@/components/ui/empty-state";
import { Building } from "lucide-react";

export default function AgentPage() {
  const { t, dir } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useQuery<{ agent: any; listings: any[] }>({ queryKey: ["/api/agencies/agent", id] });
  
  if (isLoading) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <QueryErrorFallback message="تعذر تحميل الوسيط" onRetry={() => refetch()} />
      </div>
    );
  }

  const a = data.agent;
  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader
        title={`${a?.firstName ?? ''} ${a?.lastName ?? ''}`.trim() || t("تفاصيل الوسيط")}
        subtitle={t("عرض تفاصيل الوسيط وإعلاناته")}
      />
      <section className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-6">إعلانات: {data.listings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">الإعلانات</CardTitle>
          </CardHeader>
          <CardContent>
            {data.listings.length === 0 ? (
              <EmptyState
                icon={Building}
                title="لا توجد إعلانات"
                description="لم يتم إضافة أي إعلانات عقارية لهذا الوسيط بعد"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.listings.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="p-5">
                      <div className="text-sm font-semibold">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.address}، {p.city}</div>
                      <div className="text-lg text-primary font-bold">{p.price} ﷼</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
