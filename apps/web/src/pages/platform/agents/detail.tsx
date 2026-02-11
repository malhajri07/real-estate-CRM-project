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
import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY, LOADING_STYLES, EMPTY_STYLES } from "@/config/platform-theme";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentPage() {
  const { t, dir } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<{ agent: any; listings: any[] }>({ queryKey: ["/api/agencies/agent", id] });
  
  if (isLoading) {
    return (
      <main className={PAGE_WRAPPER} dir={dir}>
        <div className={LOADING_STYLES.container}>
          <div className={LOADING_STYLES.text}>...جار التحميل</div>
        </div>
      </main>
    );
  }
  
  if (error || !data) {
    return (
      <main className={PAGE_WRAPPER} dir={dir}>
        <Card className={CARD_STYLES.container}>
          <CardContent className="p-6">
            <div className={cn(EMPTY_STYLES.description, "text-red-600 text-center")}>تعذر تحميل الوسيط</div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const a = data.agent;
  return (
    <main className={PAGE_WRAPPER} dir={dir}>
      <section className="space-y-6">
        <Card className={CARD_STYLES.container}>
          <CardContent className="p-6">
            <div className={cn(TYPOGRAPHY.body, "text-gray-600 mb-6")}>إعلانات: {data.listings.length}</div>
          </CardContent>
        </Card>

        <Card className={CARD_STYLES.container}>
          <CardHeader className={CARD_STYLES.header}>
            <CardTitle className={TYPOGRAPHY.sectionTitle}>الإعلانات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.listings.map((p) => (
                <Card key={p.id} className={CARD_STYLES.container}>
                  <CardContent className="p-5">
                    <div className={cn(TYPOGRAPHY.body, "font-semibold")}>{p.title}</div>
                    <div className={cn(TYPOGRAPHY.caption, "text-gray-600")}>{p.address}، {p.city}</div>
                    <div className={cn(TYPOGRAPHY.sectionTitle, "text-green-700 font-bold")}>{p.price} ﷼</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
