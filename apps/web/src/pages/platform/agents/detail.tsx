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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AgentPage() {
  const { t, dir } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<{ agent: any; listings: any[] }>({ queryKey: ["/api/agencies/agent", id] });
  
  if (isLoading) {
    return (
      <div className="w-full space-y-6" dir={dir}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="w-full space-y-6" dir={dir}>
        <Alert variant="destructive">
          <AlertDescription className="text-center">تعذر تحميل الوسيط</AlertDescription>
        </Alert>
      </div>
    );
  }

  const a = data.agent;
  return (
    <div className="w-full space-y-6" dir={dir}>
      <section className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-slate-600 mb-6">إعلانات: {data.listings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">الإعلانات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
