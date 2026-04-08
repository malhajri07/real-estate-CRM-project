/**
 * owner-dashboard.tsx — Owner/Landlord Portal
 *
 * Property owners see: portfolio overview, occupancy, income, expenses.
 * Read-only — accessed via /client/owner route.
 */

import { useQuery } from "@tanstack/react-query";
import { Home, Building, Users, Banknote, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { apiGet } from "@/lib/apiClient";
import { SarPrice } from "@/components/ui/sar-symbol";
import { cn } from "@/lib/utils";

interface OwnerData {
  properties: { id: string; title: string; city: string; type: string; status: string; tenancy?: { monthlyRent: number; leaseEnd: string; tenantName: string } }[];
  totalIncome: number;
  occupancyRate: number;
  activeLeases: number;
}

export default function OwnerDashboard() {
  const { data, isLoading } = useQuery<OwnerData>({
    queryKey: ["/api/client/owner"],
    queryFn: () => apiGet<OwnerData>("api/client/owner"),
  });

  const properties = data?.properties ?? [];
  const occupied = properties.filter((p) => p.tenancy);
  const vacant = properties.filter((p) => !p.tenancy);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة المالك</h1>
        <p className="text-muted-foreground">نظرة عامة على محفظتك العقارية</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Building, value: properties.length, label: "عقاراتي", bg: "bg-primary/10", color: "text-primary" },
              { icon: Users, value: occupied.length, label: "مؤجرة", bg: "bg-primary/10", color: "text-primary" },
              { icon: Home, value: vacant.length, label: "شاغرة", bg: "bg-[hsl(var(--warning)/0.1)]", color: "text-[hsl(var(--warning))]" },
              { icon: Banknote, value: data?.totalIncome ?? 0, label: "الدخل الشهري", bg: "bg-primary/10", color: "text-primary", isCurrency: true },
            ].map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <div>
                    <p className="text-xl font-black tabular-nums">
                      {(s as any).isCurrency ? <SarPrice value={s.value} /> : s.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building size={18} />عقاراتي</CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">لا توجد عقارات مسجلة</p>
              ) : (
                <div className="space-y-3">
                  {properties.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 rounded-xl border p-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Home size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.city} · {p.type}</p>
                      </div>
                      {p.tenancy ? (
                        <div className="text-end shrink-0">
                          <Badge variant="default" className="text-[10px]">مؤجر</Badge>
                          <p className="text-xs text-primary font-bold mt-0.5"><SarPrice value={p.tenancy.monthlyRent} />/شهر</p>
                          <p className="text-[10px] text-muted-foreground">{p.tenancy.tenantName}</p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">شاغر</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
