/**
 * team/index.tsx — My Team page for Corp Owners
 *
 * Shows all agents in the organization with their stats, profiles, and activity.
 * Only visible to CORP_OWNER role.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiGet } from "@/lib/apiClient";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { formatAdminDate } from "@/lib/formatters";
import {
  Users, Building2, TrendingUp, Target, Phone, Mail, Shield,
  Award, MapPin, Calendar, BarChart3, Star, Clock, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentMember {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: string;
  lastLoginAt: string | null;
  createdAt: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  agent_profiles: {
    licenseNo: string;
    licenseValidTo: string;
    territories: string | null;
    specialties: string | null;
    status: string;
  } | null;
  stats: {
    leads: number;
    deals: number;
    wonDeals: number;
    appointments: number;
  };
}

interface OrgTeamResponse {
  organizationId: string;
  totalMembers: number;
  members: AgentMember[];
}

interface OrgStatsResponse {
  organization: {
    legalName: string;
    tradeName: string;
    licenseNo: string;
    status: string;
    phone: string | null;
    email: string | null;
  };
  stats: {
    totalAgents: number;
    totalLeads: number;
    totalDeals: number;
    wonDeals: number;
    conversionRate: number;
    totalProperties: number;
    totalAppointments: number;
  };
}

function getRoleBadge(roles: string) {
  try {
    const parsed = JSON.parse(roles);
    if (parsed.includes("CORP_OWNER")) return { label: "مالك المنظمة", variant: "default" as const };
    if (parsed.includes("CORP_AGENT")) return { label: "وكيل", variant: "secondary" as const };
    return { label: "عضو", variant: "outline" as const };
  } catch {
    return { label: "عضو", variant: "outline" as const };
  }
}

export default function TeamPage() {
  const { dir, language } = useLanguage();
  const showSkeleton = useMinLoadTime();
  const isAr = language === "ar";

  const { data: teamData, isLoading: teamLoading, isError: teamError, refetch } = useQuery<OrgTeamResponse>({
    queryKey: ["/api/org/team"],
    queryFn: () => apiGet("/api/org/team"),
  });

  const { data: statsData } = useQuery<OrgStatsResponse>({
    queryKey: ["/api/org/stats"],
    queryFn: () => apiGet("/api/org/stats"),
  });

  if (teamError) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title={isAr ? "فريق العمل" : "My Team"} />
        <QueryErrorFallback message={isAr ? "فشل تحميل بيانات الفريق" : "Failed to load team"} onRetry={() => refetch()} />
      </div>
    );
  }

  if (teamLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title={isAr ? "فريق العمل" : "My Team"} />
        <AdminPageSkeleton />
      </div>
    );
  }

  const members = teamData?.members || [];
  const org = statsData?.organization;
  const stats = statsData?.stats;

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader
        title={isAr ? "فريق العمل" : "My Team"}
        subtitle={org ? `${org.tradeName || org.legalName} — ${isAr ? "رخصة" : "License"}: ${org.licenseNo}` : undefined}
      />

      {/* Org Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: isAr ? "الوكلاء" : "Agents", value: stats.totalAgents, icon: Users },
            { label: isAr ? "العملاء المحتملون" : "Leads", value: stats.totalLeads, icon: Target },
            { label: isAr ? "الصفقات" : "Deals", value: stats.totalDeals, icon: Briefcase },
            { label: isAr ? "صفقات رابحة" : "Won", value: stats.wonDeals, icon: TrendingUp },
            { label: isAr ? "معدل التحويل" : "Conv. Rate", value: `${stats.conversionRate}%`, icon: BarChart3 },
            { label: isAr ? "العقارات" : "Properties", value: stats.totalProperties, icon: Building2 },
            { label: isAr ? "المواعيد" : "Appointments", value: stats.totalAppointments, icon: Calendar },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <s.icon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-black text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Members */}
      {members.length === 0 ? (
        <EmptyState
          title={isAr ? "لا يوجد وكلاء في المنظمة" : "No agents in organization"}
          description={isAr ? "أضف وكلاء لفريقك من خلال دعوتهم للانضمام" : "Invite agents to join your organization"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const initials = `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase();
            const roleBadge = getRoleBadge(member.roles);
            const profile = member.agent_profiles;
            const totalDeals = member.stats.deals;
            const winRate = totalDeals > 0 ? Math.round((member.stats.wonDeals / totalDeals) * 100) : 0;

            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-foreground truncate">{member.firstName} {member.lastName}</h3>
                        <Badge variant={roleBadge.variant} className="shrink-0 text-[10px]">{roleBadge.label}</Badge>
                      </div>
                      {member.jobTitle && <p className="text-xs text-muted-foreground">{member.jobTitle}</p>}
                      {profile?.status && (
                        <Badge variant={profile.status === "ACTIVE" ? "success" : "secondary"} className="mt-1 text-[10px]">
                          {profile.status === "ACTIVE" ? (isAr ? "نشط" : "Active") : profile.status}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5">
                    {member.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> <span className="font-mono">{member.phone}</span>
                      </div>
                    )}
                    {member.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> <span className="truncate">{member.email}</span>
                      </div>
                    )}
                  </div>

                  {/* License & Specialties */}
                  {profile && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        {profile.licenseNo && (
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{isAr ? "رخصة" : "License"}:</span>
                            <span className="font-bold">{profile.licenseNo}</span>
                          </div>
                        )}
                        {profile.specialties && (
                          <div className="flex items-center gap-2 text-xs">
                            <Award className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{isAr ? "التخصص" : "Specialty"}:</span>
                            <span className="font-bold">{profile.specialties}</span>
                          </div>
                        )}
                        {profile.territories && (
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{isAr ? "المنطقة" : "Territory"}:</span>
                            <span className="font-bold">{profile.territories}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Performance Stats */}
                  <Separator />
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <Tooltip>
                      <TooltipTrigger>
                        <div>
                          <p className="text-lg font-black text-foreground">{member.stats.leads}</p>
                          <p className="text-[9px] text-muted-foreground font-bold">{isAr ? "عملاء" : "Leads"}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{isAr ? "عدد العملاء المحتملين" : "Total leads"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <div>
                          <p className="text-lg font-black text-foreground">{member.stats.deals}</p>
                          <p className="text-[9px] text-muted-foreground font-bold">{isAr ? "صفقات" : "Deals"}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{isAr ? "عدد الصفقات" : "Total deals"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <div>
                          <p className="text-lg font-black text-primary">{member.stats.wonDeals}</p>
                          <p className="text-[9px] text-muted-foreground font-bold">{isAr ? "رابحة" : "Won"}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{isAr ? "صفقات رابحة" : "Won deals"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <div>
                          <p className="text-lg font-black text-foreground">{member.stats.appointments}</p>
                          <p className="text-[9px] text-muted-foreground font-bold">{isAr ? "مواعيد" : "Appts"}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{isAr ? "عدد المواعيد" : "Appointments"}</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Win Rate Progress */}
                  {totalDeals > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{isAr ? "معدل التحويل" : "Win rate"}</span>
                        <span className="font-bold">{winRate}%</span>
                      </div>
                      <Progress value={winRate} className="h-1.5" />
                    </div>
                  )}

                  {/* Last Activity */}
                  {member.lastLoginAt && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {isAr ? "آخر دخول" : "Last login"}: {formatAdminDate(member.lastLoginAt)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
