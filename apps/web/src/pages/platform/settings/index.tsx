/**
 * settings/index.tsx — Agent Settings Page
 *
 * Two-column layout: sticky sidebar nav + content area.
 * Profile summary card at top with completion %.
 */

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  User, Users, Briefcase, Building2, CreditCard, Shield, Bell,
  ShieldCheck, AlertTriangle, CheckCircle, ChevronLeft,
} from "lucide-react";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import PageHeader from "@/components/ui/page-header";
import { SettingsSkeleton } from "@/components/skeletons/page-skeletons";
import { apiGet, apiPut } from "@/lib/apiClient";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { cn } from "@/lib/utils";

import ProfileSection from "./ProfileSection";
import ProfessionalSection from "./ProfessionalSection";
import CompanySection from "./CompanySection";
import PaymentsSection from "./PaymentsSection";
import AccountSection from "./AccountSection";
import PreferencesSection from "./PreferencesSection";
import LeadRoutingSection from "./LeadRoutingSection";

type SectionKey = "profile" | "professional" | "company" | "payments" | "security" | "notifications" | "lead-routing";

const NAV_ITEMS: { key: SectionKey; icon: typeof User; label: string; corporateOnly?: boolean; ownerOnly?: boolean }[] = [
  { key: "profile", icon: User, label: "الملف الشخصي" },
  { key: "professional", icon: Briefcase, label: "المهني" },
  { key: "company", icon: Building2, label: "الشركة", corporateOnly: true },
  { key: "lead-routing", icon: Users, label: "توزيع العملاء", ownerOnly: true },
  { key: "payments", icon: CreditCard, label: "المالية" },
  { key: "security", icon: Shield, label: "الأمان" },
  { key: "notifications", icon: Bell, label: "الإشعارات" },
];

function computeCompletion(userData: any): { percent: number; missing: string[] } {
  const missing: string[] = [];
  const checks = [
    { ok: !!userData?.firstName && !!userData?.lastName, label: "الاسم الكامل" },
    { ok: !!userData?.email, label: "البريد الإلكتروني" },
    { ok: !!userData?.phone, label: "رقم الجوال" },
    { ok: !!(userData?.metadata as any)?.whatsapp, label: "رقم واتساب" },
    { ok: !!userData?.agent_profiles?.falLicenseNumber, label: "رخصة فال" },
    { ok: !!userData?.agent_profiles?.bio, label: "نبذة مهنية" },
    { ok: !!userData?.agent_profiles?.specialties, label: "التخصصات" },
    { ok: !!userData?.agent_profiles?.territories, label: "مناطق الخدمة" },
    { ok: !!(userData?.metadata as any)?.iban, label: "الآيبان" },
    { ok: (userData?.agent_profiles?.experience ?? null) !== null, label: "سنوات الخبرة" },
  ];
  checks.forEach((c) => { if (!c.ok) missing.push(c.label); });
  const done = checks.filter((c) => c.ok).length;
  return { percent: Math.round((done / checks.length) * 100), missing };
}

export default function Settings() {
  const { toast } = useToast();
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionKey>("profile");
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: userData, isLoading } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiGet("/api/auth/user"),
  });

  const isCorporate = !!userData?.organizationId;

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiPut("/api/auth/user", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "تم الحفظ بنجاح", description: "تم تحديث الملف الشخصي" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل تحديث الملف الشخصي", variant: "destructive" }),
  });

  const updateAgentProfileMutation = useMutation({
    mutationFn: (data: any) => apiPut("/api/auth/agent-profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "تم الحفظ بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل التحديث", variant: "destructive" }),
  });

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="الإعدادات" subtitle="إدارة ملفك الشخصي، بياناتك المهنية، والأمان" />
        <SettingsSkeleton />
      </div>
    );
  }

  const { percent, missing } = computeCompletion(userData);
  const initials = `${(userData?.firstName || "")[0] || ""}${(userData?.lastName || "")[0] || ""}`;
  const fullName = `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim();
  const agentProfile = userData?.agent_profiles;
  const hasFal = !!agentProfile?.falLicenseNumber;

  const userRoles: string[] = Array.isArray(userData?.roles)
    ? userData.roles
    : typeof userData?.roles === "string"
      ? (() => { try { return JSON.parse(userData.roles); } catch { return []; } })()
      : [];
  const isOwner = userRoles.includes("CORP_OWNER") || userRoles.includes("WEBSITE_ADMIN");
  const navItems = NAV_ITEMS.filter((item) => {
    if (item.corporateOnly && !isCorporate) return false;
    if (item.ownerOnly && !isOwner) return false;
    return true;
  });

  const handleNavClick = (key: SectionKey) => {
    setActiveSection(key);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="الإعدادات" subtitle="إدارة ملفك الشخصي، بياناتك المهنية، والأمان" />

      {/* ── Profile Summary Card ── */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={userData?.avatarUrl} />
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold truncate">{fullName || "بدون اسم"}</h2>
                {hasFal ? (
                  <Badge variant="outline" className="gap-1 border-primary/30 text-primary shrink-0">
                    <ShieldCheck size={12} />
                    فال
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))] shrink-0">
                    <AlertTriangle size={12} />
                    بدون فال
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {userData?.email} {userData?.jobTitle ? `· ${userData.jobTitle}` : ""}
              </p>
              <div className="flex items-center gap-3 mt-2.5">
                <Progress value={percent} className="h-2 flex-1 max-w-xs" />
                <span className={cn("text-xs font-bold tabular-nums", percent === 100 ? "text-primary" : "text-muted-foreground")}>
                  {percent}%
                </span>
              </div>
              {missing.length > 0 && missing.length <= 3 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ينقصك: {missing.join("، ")}
                </p>
              )}
              {missing.length > 3 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ينقصك {missing.length} عناصر لإكمال ملفك
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Mobile Tab Bar ── */}
      <div className="md:hidden mt-4">
        <div className="flex overflow-x-auto gap-1 pb-3 mb-4 border-b border-border">
          {navItems.map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={activeSection === item.key ? "default" : "ghost"}
              className="shrink-0 gap-1.5 h-9"
              onClick={() => handleNavClick(item.key)}
            >
              <item.icon size={14} />
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Two Column Layout ── */}
      <div className="flex gap-6 mt-2 md:mt-6">
        {/* Sidebar Nav — desktop only */}
        <nav className="w-52 shrink-0 hidden md:block">
          <div className="sticky top-4 space-y-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors text-start",
                    isActive
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                  {isActive && <ChevronLeft size={14} className="ms-auto" />}
                </button>
              );
            })}

            {/* Completion checklist in sidebar */}
            {percent < 100 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-bold text-muted-foreground mb-2 px-3">أكمل ملفك</p>
                <div className="space-y-1.5 px-3">
                  {missing.slice(0, 4).map((item) => {
                    /** Map missing field label to the settings section it belongs to (E13). */
                    const sectionMap: Record<string, SectionKey> = {
                      "الاسم الكامل": "profile", "البريد الإلكتروني": "profile",
                      "رقم الجوال": "profile", "رقم واتساب": "profile",
                      "رخصة فال": "professional", "نبذة مهنية": "professional",
                      "التخصصات": "professional", "مناطق الخدمة": "professional",
                      "سنوات الخبرة": "professional", "الآيبان": "payments",
                    };
                    return (
                      <button
                        key={item}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-start"
                        onClick={() => handleNavClick(sectionMap[item] || "profile")}
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--warning))]" />
                        {item}
                      </button>
                    );
                  })}
                  {missing.length > 4 && (
                    <p className="text-xs text-muted-foreground">+{missing.length - 4} أخرى</p>
                  )}
                </div>
              </div>
            )}
            {percent === 100 && (
              <div className="mt-4 pt-4 border-t border-border px-3">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <CheckCircle size={14} />
                  <span className="font-bold">ملفك مكتمل</span>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Content Area */}
        <div ref={contentRef} className="flex-1 min-w-0">
          {activeSection === "profile" && (
            <ProfileSection
              userData={userData}
              onSave={(data: any) => updateProfileMutation.mutate(data)}
              isSaving={updateProfileMutation.isPending}
            />
          )}
          {activeSection === "professional" && (
            <ProfessionalSection
              agentProfile={agentProfile}
              userMetadata={userData?.metadata}
              onSave={(data: any) => updateAgentProfileMutation.mutate(data)}
              isSaving={updateAgentProfileMutation.isPending}
            />
          )}
          {activeSection === "company" && isCorporate && (
            <CompanySection organization={userData?.organization} />
          )}
          {activeSection === "payments" && (
            <PaymentsSection
              userMetadata={userData?.metadata}
              onSave={(data: any) => updateAgentProfileMutation.mutate(data)}
              isSaving={updateAgentProfileMutation.isPending}
            />
          )}
          {activeSection === "security" && <AccountSection />}
          {activeSection === "notifications" && <PreferencesSection />}
          {activeSection === "lead-routing" && isOwner && <LeadRoutingSection />}
        </div>
      </div>
    </div>
  );
}
