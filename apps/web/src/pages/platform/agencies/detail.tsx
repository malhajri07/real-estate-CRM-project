/**
 * agency.tsx - Agency Detail Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → agency.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Agency detail page. Displays:
 * - Agency information
 * - Agency agents list
 * - Agency listings
 * 
 * Route: /home/platform/agency/:id or /agency/:id
 * 
 * Related Files:
 * - apps/web/src/pages/agencies.tsx - Agencies listing page
 * - apps/api/routes/agencies.ts - Agencies API routes
 */

import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER, TYPOGRAPHY } from "@/config/platform-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/ui/page-header";
import { ClientDetailSkeleton } from "@/components/skeletons/page-skeletons";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import EmptyState from "@/components/ui/empty-state";
import { Users, Building } from "lucide-react";

export default function AgencyPage() {
  const { t, dir } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useQuery<{ agency: any; agents: any[]; listings: any[] }>({ queryKey: ["/api/agencies", id] });
  
  if (isLoading) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <ClientDetailSkeleton />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <QueryErrorFallback message="تعذر تحميل الوكالة" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader
        title={data.agency?.name || t("تفاصيل الوكالة")}
        subtitle={t("عرض تفاصيل الوكالة والوسطاء والإعلانات")}
      />
      <section className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-6">وسطاء: {data.agents.length} — إعلانات: {data.listings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={TYPOGRAPHY.sectionTitle}>الوسطاء</CardTitle>
          </CardHeader>
          <CardContent>
            {data.agents.length === 0 ? (
              <EmptyState
                icon={Users}
                title="لا يوجد وسطاء"
                description="لم يتم تسجيل أي وسطاء لهذه الوكالة بعد"
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {data.agents.map((u) => (
                  <Card key={u.id} className="hover:shadow-md transition cursor-pointer">
                    <CardContent className="p-6">
                      <a href={`/home/platform/agent/${u.id}`} className="block">
                        <div className="text-sm font-bold">{u.firstName} {u.lastName}</div>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={TYPOGRAPHY.sectionTitle}>الإعلانات</CardTitle>
          </CardHeader>
          <CardContent>
            {data.listings.length === 0 ? (
              <EmptyState
                icon={Building}
                title="لا توجد إعلانات"
                description="لم يتم إضافة أي إعلانات عقارية لهذه الوكالة بعد"
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {data.listings.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="p-6">
                      <div className="text-sm font-bold">{p.title}</div>
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
