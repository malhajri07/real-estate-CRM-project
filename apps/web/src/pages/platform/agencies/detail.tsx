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
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AgencyPage() {
  const { t, dir } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<{ agency: any; agents: any[]; listings: any[] }>({ queryKey: ["/api/agencies", id] });
  
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
        <Alert variant="destructive">
          <AlertDescription className="text-center">تعذر تحميل الوكالة</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <section className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 mb-6">وسطاء: {data.agents.length} — إعلانات: {data.listings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">الوسطاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.agents.map((u) => (
                <Card key={u.id} className="hover:shadow-md transition cursor-pointer">
                  <CardContent className="p-4">
                    <a href={`/home/platform/agent/${u.id}`} className="block">
                      <div className="text-sm font-semibold">{u.firstName} {u.lastName}</div>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">الإعلانات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.listings.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-5">
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.address}، {p.city}</div>
                    <div className="text-lg text-emerald-600 font-bold">{p.price} ﷼</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
