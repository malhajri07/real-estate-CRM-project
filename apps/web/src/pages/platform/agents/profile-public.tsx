/**
 * agents/profile-public.tsx — Agent Public Profile Page (Session 5.11)
 *
 * Auto-generated profile: agent info, FAL badge, listings, contact buttons.
 * Accessible at /agent/:id (public, no auth required).
 */

import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import {
  ShieldCheck, MapPin, Building, Phone, MessageSquare,
  Star, Calendar, Briefcase,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SarPrice } from "@/components/ui/sar-symbol";
import PublicHeader from "@/components/layout/PublicHeader";
import { apiGet } from "@/lib/apiClient";

interface AgentProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  jobTitle?: string;
  agent_profiles?: {
    bio?: string;
    specialties?: string;
    territories?: string;
    experience?: number;
    falLicenseNumber?: string;
    falLicenseType?: string;
    sreiCertified?: boolean;
  };
  organization?: { tradeName?: string };
  listings: { id: string; title: string; city: string; type: string; price: number; photos: string }[];
  stats: { totalDeals: number; activeListings: number };
}

export default function AgentPublicProfile() {
  const [, params] = useRoute("/home/platform/agent/:id");
  const agentId = params?.id || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "");

  const { data: agent, isLoading } = useQuery<AgentProfile>({
    queryKey: ["/api/agents", agentId],
    queryFn: () => apiGet<AgentProfile>(`api/agents/${agentId}`),
    enabled: !!agentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-xl font-bold">الوسيط غير موجود</p>
        </div>
      </div>
    );
  }

  const profile = agent.agent_profiles;
  const initials = `${agent.firstName[0] || ""}${agent.lastName[0] || ""}`;
  const specialties = profile?.specialties?.split(",").map((s) => s.trim()).filter(Boolean) || [];
  const territories = profile?.territories?.split(",").map((s) => s.trim()).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Agent Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{agent.firstName} {agent.lastName}</h1>
                  {profile?.falLicenseNumber && (
                    <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                      <ShieldCheck size={12} />فال معتمد
                    </Badge>
                  )}
                  {profile?.sreiCertified && (
                    <Badge variant="secondary" className="text-[10px]">SREI</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{agent.jobTitle || "وسيط عقاري"}</p>
                {agent.organization?.tradeName && (
                  <p className="text-sm text-muted-foreground mt-0.5">{agent.organization.tradeName}</p>
                )}
                {profile?.experience && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Briefcase size={14} />{profile.experience} سنوات خبرة
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  {agent.phone && (
                    <Button className="gap-2" onClick={() => window.open(`https://wa.me/${agent.phone.replace(/\D/g, "")}`)}>
                      <MessageSquare size={16} />تواصل واتساب
                    </Button>
                  )}
                  {agent.phone && (
                    <Button variant="outline" className="gap-2" onClick={() => window.open(`tel:${agent.phone}`)}>
                      <Phone size={16} />اتصال
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {profile?.bio && (
          <Card>
            <CardHeader><CardTitle className="text-sm">نبذة</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed">{profile.bio}</p></CardContent>
          </Card>
        )}

        {/* Specialties + Areas */}
        {(specialties.length > 0 || territories.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialties.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">التخصصات</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {specialties.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}
            {territories.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">مناطق الخدمة</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {territories.map((t) => <Badge key={t} variant="outline" className="gap-1"><MapPin size={10} />{t}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Agent's Listings */}
        {agent.listings && agent.listings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building size={18} />إعلانات الوسيط ({agent.listings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agent.listings.map((l) => (
                  <a key={l.id} href={`/listing/${l.id}`} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
                    <div className="h-16 w-20 rounded-lg bg-muted shrink-0 overflow-hidden">
                      {l.photos ? (
                        <img src={(() => { try { return JSON.parse(l.photos)[0]; } catch { return ""; } })()} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Building size={16} className="text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{l.title}</p>
                      <p className="text-xs text-muted-foreground">{l.city} · {l.type}</p>
                      {l.price && <p className="text-sm font-bold text-primary mt-0.5"><SarPrice value={l.price} /></p>}
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAL License Info */}
        {profile?.falLicenseNumber && (
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldCheck size={20} className="text-primary" />
              <div>
                <p className="text-sm font-bold">وسيط معتمد من الهيئة العامة للعقار</p>
                <p className="text-xs text-muted-foreground">رخصة فال رقم: {profile.falLicenseNumber}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
