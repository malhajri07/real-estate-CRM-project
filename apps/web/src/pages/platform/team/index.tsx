/**
 * team/index.tsx — Organization Team Management
 *
 * Full management dashboard for Corp Owners to manage their team of agents.
 * Tabs: Overview, Agents (table + CRUD), Performance (charts), Settings.
 */

import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import {
  PAGE_WRAPPER, CARD_STYLES, TABLE_STYLES, FORM_STYLES, DIALOG_DEFAULTS,
  GRID_METRICS, GRID_TWO_COL, GRID_FORM,
} from "@/config/platform-theme";
import { CHART_COLORS, CHART_COLOR_ARRAY, CHART_HEIGHT, CHART_TOOLTIP_CLASSES } from "@/config/design-tokens";
import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/apiClient";
import { formatAdminDate, formatAdminDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  Users, Building2, TrendingUp, Target, Phone, Mail, Shield,
  Award, MapPin, Calendar, BarChart3, Briefcase, Clock, Star,
  UserPlus, MoreVertical, Edit, Power, ArrowUpDown, Eye,
  Search, Filter, CheckCircle, XCircle, Activity,
  Settings, ChevronDown, UserCheck, UserX,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface AgentProfile {
  id: string;
  licenseNo: string;
  licenseValidTo: string;
  territories: string | null;
  specialties: string | null;
  status: string;
  isIndividualAgent: boolean;
}

interface AgentMember {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  agent_profiles: AgentProfile | null;
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
    website: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
  };
  stats: {
    totalAgents: number;
    activeAgents: number;
    totalLeads: number;
    totalDeals: number;
    wonDeals: number;
    conversionRate: number;
    totalProperties: number;
    totalAppointments: number;
  };
}

interface PerformanceData {
  agentMetrics: {
    id: string;
    name: string;
    leads: number;
    deals: number;
    wonDeals: number;
    appointments: number;
    revenue: number;
    conversionRate: number;
  }[];
  dealStages: { stage: string; count: number }[];
}

interface AgentActivity {
  agent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    roles: string;
    isActive: boolean;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    agent_profiles: { licenseNo: string; specialties: string; territories: string; status: string } | null;
  };
  stats: { leads: number; deals: number; wonDeals: number; appointments: number };
  recentLeads: { id: string; status: string; source: string | null; notes: string | null; createdAt: string }[];
  recentDeals: {
    id: string; stage: string; agreedPrice: number | null; currency: string; notes: string | null; createdAt: string;
    customer: { firstName: string; lastName: string } | null;
  }[];
  recentAppointments: {
    id: string; status: string; scheduledAt: string; location: string | null; notes: string | null; createdAt: string;
    customer: { firstName: string; lastName: string } | null;
  }[];
}

interface InviteFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "CORP_AGENT" | "CORP_OWNER";
  specialties: string;
  territories: string;
}

interface EditFormState {
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  department: string;
  specialties: string;
  territories: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const SPECIALTIES_OPTIONS = [
  "شقق سكنية",
  "فلل",
  "أراضي",
  "تجاري",
  "إيجارات",
];

function parseRoles(roles: string): string[] {
  try { return JSON.parse(roles); } catch { return []; }
}

function getRoleBadge(roles: string) {
  const parsed = parseRoles(roles);
  if (parsed.includes("CORP_OWNER")) return { label: "مالك المنظمة", variant: "default" as const };
  if (parsed.includes("CORP_AGENT")) return { label: "وكيل", variant: "secondary" as const };
  return { label: "عضو", variant: "outline" as const };
}

function getInitials(first?: string, last?: string) {
  return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
}

const STAGE_LABELS: Record<string, string> = {
  NEW: "جديد",
  NEGOTIATION: "تفاوض",
  UNDER_OFFER: "تحت العرض",
  WON: "رابحة",
  LOST: "خاسرة",
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  IN_PROGRESS: "قيد المتابعة",
  WON: "محول",
  LOST: "مفقود",
};

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "مجدول",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
  NO_SHOW: "لم يحضر",
};

const emptyInviteForm: InviteFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "CORP_AGENT",
  specialties: "",
  territories: "",
};

function emptyEditForm(member: AgentMember): EditFormState {
  return {
    firstName: member.firstName || "",
    lastName: member.lastName || "",
    phone: member.phone || "",
    jobTitle: member.jobTitle || "",
    department: member.department || "",
    specialties: member.agent_profiles?.specialties || "",
    territories: member.agent_profiles?.territories || "",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { dir, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const showSkeleton = useMinLoadTime();
  const isAr = language === "ar";

  // ── State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "CORP_OWNER" | "CORP_AGENT">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sheets
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormState>(emptyInviteForm);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({ firstName: "", lastName: "", phone: "", jobTitle: "", department: "", specialties: "", territories: "" });
  const [editingMember, setEditingMember] = useState<AgentMember | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityAgentId, setActivityAgentId] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: teamData, isLoading: teamLoading, isError: teamError, refetch } = useQuery<OrgTeamResponse>({
    queryKey: ["/api/org/team"],
    queryFn: () => apiGet("/api/org/team"),
  });

  const { data: statsData } = useQuery<OrgStatsResponse>({
    queryKey: ["/api/org/stats"],
    queryFn: () => apiGet("/api/org/stats"),
  });

  const { data: perfData } = useQuery<PerformanceData>({
    queryKey: ["/api/org/team/performance"],
    queryFn: () => apiGet("/api/org/team/performance"),
    enabled: activeTab === "performance" || activeTab === "overview",
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<AgentActivity>({
    queryKey: ["/api/org/team", activityAgentId, "activity"],
    queryFn: () => apiGet(`/api/org/team/${activityAgentId}/activity`),
    enabled: !!activityAgentId && activityOpen,
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/org/team"] });
    queryClient.invalidateQueries({ queryKey: ["/api/org/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/org/team/performance"] });
  };

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormState) => apiPost("/api/org/team/invite", data),
    onSuccess: () => {
      toast({ title: "تم إضافة الوكيل بنجاح", description: "كلمة المرور الافتراضية: agent123" });
      setInviteOpen(false);
      setInviteForm(emptyInviteForm);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast({ title: "فشل إضافة الوكيل", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: EditFormState }) => apiPut(`/api/org/team/${data.id}`, data.body),
    onSuccess: () => {
      toast({ title: "تم تحديث البيانات بنجاح" });
      setEditOpen(false);
      setEditingMember(null);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast({ title: "فشل التحديث", description: err.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/api/org/team/${id}/toggle-active`),
    onSuccess: () => {
      toast({ title: "تم تحديث حالة الوكيل" });
      invalidateAll();
    },
    onError: (err: Error) => {
      toast({ title: "فشل تحديث الحالة", description: err.message, variant: "destructive" });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: (data: { id: string; role: string }) => apiPatch(`/api/org/team/${data.id}/change-role`, { role: data.role }),
    onSuccess: () => {
      toast({ title: "تم تغيير الدور بنجاح" });
      invalidateAll();
    },
    onError: (err: Error) => {
      toast({ title: "فشل تغيير الدور", description: err.message, variant: "destructive" });
    },
  });

  // ── Filtered Members ───────────────────────────────────────────────────
  const members = teamData?.members || [];

  const filteredMembers = useMemo(() => {
    let result = members;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.firstName?.toLowerCase().includes(q) ||
          m.lastName?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.phone?.includes(q)
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((m) => parseRoles(m.roles).includes(roleFilter));
    }
    if (statusFilter === "active") result = result.filter((m) => m.isActive);
    if (statusFilter === "inactive") result = result.filter((m) => !m.isActive);
    return result;
  }, [members, searchTerm, roleFilter, statusFilter]);

  // ── Selection ──────────────────────────────────────────────────────────
  const allSelected = filteredMembers.length > 0 && filteredMembers.every((m) => selectedIds.has(m.id));
  const someSelected = filteredMembers.some((m) => selectedIds.has(m.id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map((m) => m.id)));
    }
  }, [allSelected, filteredMembers]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Bulk Actions ───────────────────────────────────────────────────────
  const bulkToggle = async (activate: boolean) => {
    const ids = Array.from(selectedIds);
    const toToggle = members.filter((m) => ids.includes(m.id) && m.isActive !== activate);
    for (const m of toToggle) {
      await toggleActiveMutation.mutateAsync(m.id);
    }
    setSelectedIds(new Set());
  };

  // ── Handlers ───────────────────────────────────────────────────────────
  const openEdit = (member: AgentMember) => {
    setEditingMember(member);
    setEditForm(emptyEditForm(member));
    setEditOpen(true);
  };

  const openActivity = (id: string) => {
    setActivityAgentId(id);
    setActivityOpen(true);
  };

  // ── Loading / Error ────────────────────────────────────────────────────
  if (teamError) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title="فريق العمل" />
        <QueryErrorFallback message="فشل تحميل بيانات الفريق" onRetry={() => refetch()} />
      </div>
    );
  }

  if (teamLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title="فريق العمل" />
        <AdminPageSkeleton />
      </div>
    );
  }

  const org = statsData?.organization;
  const stats = statsData?.stats;

  // ────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader
        title="إدارة فريق العمل"
        subtitle={org ? `${org.tradeName || org.legalName} — رخصة: ${org.licenseNo}` : undefined}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-1.5">
            <Users className="h-4 w-4" /> الوكلاء
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> الأداء
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" /> الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB                                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: "إجمالي الوكلاء", value: stats.totalAgents, icon: Users },
                { label: "النشطون", value: stats.activeAgents, icon: UserCheck },
                { label: "العملاء المحتملون", value: stats.totalLeads, icon: Target },
                { label: "الصفقات", value: stats.totalDeals, icon: Briefcase },
                { label: "صفقات رابحة", value: stats.wonDeals, icon: TrendingUp },
                { label: "معدل التحويل", value: `${stats.conversionRate}%`, icon: BarChart3 },
                { label: "العقارات", value: stats.totalProperties, icon: Building2 },
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

          {/* Top Performers Chart */}
          <div className={GRID_TWO_COL}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  أفضل 5 وكلاء بالصفقات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {perfData?.agentMetrics && perfData.agentMetrics.length > 0 ? (
                  <div className="h-[300px]" style={{ direction: "ltr" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={perfData.agentMetrics
                          .sort((a, b) => b.wonDeals - a.wonDeals)
                          .slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                        <ReTooltip content={<ChartTooltip />} />
                        <Bar dataKey="wonDeals" name="صفقات رابحة" fill={CHART_COLORS.green} radius={[0, 6, 6, 0]} />
                        <Bar dataKey="deals" name="إجمالي الصفقات" fill={CHART_COLORS.blue} radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    لا توجد بيانات أداء بعد
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Team Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  ملخص نشاط الفريق
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    لا يوجد وكلاء بعد
                  </div>
                ) : (
                  members.slice(0, 6).map((m) => {
                    const initials = getInitials(m.firstName, m.lastName);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => openActivity(m.id)}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{m.firstName} {m.lastName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {m.stats.leads} عملاء · {m.stats.deals} صفقات · {m.stats.wonDeals} رابحة
                          </p>
                        </div>
                        <Badge variant={m.isActive ? "default" : "secondary"} className="text-[10px] shrink-0">
                          {m.isActive ? "نشط" : "معطل"}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* AGENTS TAB                                                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="agents" className="space-y-4 mt-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>

            {/* Filters */}
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأدوار</SelectItem>
                <SelectItem value="CORP_OWNER">مالك المنظمة</SelectItem>
                <SelectItem value="CORP_AGENT">وكيل</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">معطل</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            {/* Bulk Actions */}
            {someSelected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    إجراءات ({selectedIds.size}) <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => bulkToggle(true)}>
                    <UserCheck className="h-4 w-4 me-2" /> تفعيل المحددين
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => bulkToggle(false)}>
                    <UserX className="h-4 w-4 me-2" /> تعطيل المحددين
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Add Agent */}
            <Button onClick={() => { setInviteForm(emptyInviteForm); setInviteOpen(true); }} className="gap-1.5">
              <UserPlus className="h-4 w-4" /> إضافة وكيل
            </Button>
          </div>

          {/* Table */}
          {filteredMembers.length === 0 ? (
            <EmptyState
              title="لا يوجد وكلاء"
              description={searchTerm || roleFilter !== "all" || statusFilter !== "all"
                ? "لا توجد نتائج مطابقة — جرّب تغيير البحث أو الفلاتر"
                : "أضف وكلاء لفريقك بالنقر على زر إضافة وكيل"}
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className={TABLE_STYLES.header}>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className={cn(TABLE_STYLES.headerCell, "w-[50px]")}>إجراءات</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>الحالة</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>الدور</TableHead>
                      <TableHead className={cn(TABLE_STYLES.headerCell, "text-center")}>عملاء</TableHead>
                      <TableHead className={cn(TABLE_STYLES.headerCell, "text-center")}>صفقات</TableHead>
                      <TableHead className={cn(TABLE_STYLES.headerCell, "text-center")}>رابحة</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>الهاتف</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>آخر دخول</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>الوكيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => {
                      const initials = getInitials(member.firstName, member.lastName);
                      const roleBadge = getRoleBadge(member.roles);
                      const currentRoles = parseRoles(member.roles);
                      const isOwner = currentRoles.includes("CORP_OWNER");

                      return (
                        <TableRow
                          key={member.id}
                          className={cn(
                            TABLE_STYLES.row,
                            !member.isActive && "opacity-60",
                            "cursor-pointer"
                          )}
                          onClick={() => openActivity(member.id)}
                        >
                          {/* Checkbox */}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(member.id)}
                              onCheckedChange={() => toggleSelectOne(member.id)}
                            />
                          </TableCell>

                          {/* Actions */}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => openActivity(member.id)}>
                                  <Eye className="h-4 w-4 me-2" /> عرض النشاط
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(member)}>
                                  <Edit className="h-4 w-4 me-2" /> تعديل البيانات
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleActiveMutation.mutate(member.id)}>
                                  <Power className="h-4 w-4 me-2" />
                                  {member.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    changeRoleMutation.mutate({
                                      id: member.id,
                                      role: isOwner ? "CORP_AGENT" : "CORP_OWNER",
                                    })
                                  }
                                >
                                  <ArrowUpDown className="h-4 w-4 me-2" />
                                  {isOwner ? "تخفيض إلى وكيل" : "ترقية إلى مالك"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge variant={member.isActive ? "default" : "secondary"} className="text-[10px]">
                              {member.isActive ? "نشط" : "معطل"}
                            </Badge>
                          </TableCell>

                          {/* Role */}
                          <TableCell>
                            <Badge variant={roleBadge.variant} className="text-[10px]">
                              {roleBadge.label}
                            </Badge>
                          </TableCell>

                          {/* Stats */}
                          <TableCell className="text-center font-bold">{member.stats.leads}</TableCell>
                          <TableCell className="text-center font-bold">{member.stats.deals}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{member.stats.wonDeals}</TableCell>

                          {/* Phone */}
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {member.phone || "—"}
                          </TableCell>

                          {/* Last Login */}
                          <TableCell className="text-xs text-muted-foreground">
                            {member.lastLoginAt ? formatAdminDate(member.lastLoginAt) : "—"}
                          </TableCell>

                          {/* Agent Name */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{member.firstName} {member.lastName}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
                يعرض {filteredMembers.length} من {members.length} وكيل
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PERFORMANCE TAB                                                 */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          {!perfData ? (
            <div className="space-y-4">
              <Skeleton className="h-[350px] rounded-2xl" />
              <Skeleton className="h-[350px] rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Leads by Agent */}
              <div className={GRID_TWO_COL}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">العملاء المحتملون حسب الوكيل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[320px]" style={{ direction: "ltr" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={perfData.agentMetrics.sort((a, b) => b.leads - a.leads).slice(0, 10)}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={11} tickLine={false} />
                          <YAxis fontSize={11} tickLine={false} />
                          <ReTooltip content={<ChartTooltip />} />
                          <Bar dataKey="leads" name="عملاء" fill={CHART_COLORS.blue} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Deals by Agent */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">الصفقات حسب الوكيل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[320px]" style={{ direction: "ltr" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={perfData.agentMetrics.sort((a, b) => b.deals - a.deals).slice(0, 10)}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={11} tickLine={false} />
                          <YAxis fontSize={11} tickLine={false} />
                          <ReTooltip content={<ChartTooltip />} />
                          <Bar dataKey="deals" name="صفقات" fill={CHART_COLORS.amber} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="wonDeals" name="رابحة" fill={CHART_COLORS.green} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pie Chart: Deal Stages + Rankings Table */}
              <div className={GRID_TWO_COL}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">توزيع مراحل الصفقات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {perfData.dealStages.some((s) => s.count > 0) ? (
                      <div className="h-[320px]" style={{ direction: "ltr" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={perfData.dealStages.filter((s) => s.count > 0)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ stage, count, percent }) =>
                                `${STAGE_LABELS[stage] || stage} (${(percent * 100).toFixed(0)}%)`
                              }
                              outerRadius={110}
                              dataKey="count"
                              nameKey="stage"
                            >
                              {perfData.dealStages.map((_, i) => (
                                <Cell key={i} fill={CHART_COLOR_ARRAY[i % CHART_COLOR_ARRAY.length]} />
                              ))}
                            </Pie>
                            <ReTooltip
                              content={
                                <ChartTooltip
                                  formatter={(v: number) => `${v} صفقة`}
                                />
                              }
                            />
                            <Legend
                              formatter={(value: string) => STAGE_LABELS[value] || value}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                        لا توجد صفقات بعد
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Agent Rankings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold">ترتيب الوكلاء بمعدل التحويل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-end text-xs">#</TableHead>
                          <TableHead className="text-end text-xs">معدل التحويل</TableHead>
                          <TableHead className="text-center text-xs">رابحة</TableHead>
                          <TableHead className="text-center text-xs">صفقات</TableHead>
                          <TableHead className="text-end text-xs">الوكيل</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {perfData.agentMetrics
                          .filter((a) => a.deals > 0)
                          .sort((a, b) => b.conversionRate - a.conversionRate)
                          .slice(0, 10)
                          .map((agent, i) => (
                            <TableRow key={agent.id}>
                              <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={agent.conversionRate} className="h-1.5 flex-1" />
                                  <span className="text-xs font-bold w-10 text-end">{agent.conversionRate}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-bold text-primary">{agent.wonDeals}</TableCell>
                              <TableCell className="text-center font-bold">{agent.deals}</TableCell>
                              <TableCell className="font-bold text-sm">{agent.name}</TableCell>
                            </TableRow>
                          ))}
                        {perfData.agentMetrics.filter((a) => a.deals > 0).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              لا توجد بيانات صفقات بعد
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SETTINGS TAB                                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          {org ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> بيانات المنظمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={GRID_FORM}>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>الاسم القانوني</Label>
                    <p className="text-sm font-bold">{org.legalName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>الاسم التجاري</Label>
                    <p className="text-sm font-bold">{org.tradeName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>رقم الرخصة</Label>
                    <p className="text-sm font-bold font-mono">{org.licenseNo}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>الحالة</Label>
                    <Badge variant={org.status === "ACTIVE" ? "default" : "secondary"}>{org.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>الهاتف</Label>
                    <p className="text-sm font-bold font-mono">{org.phone || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>البريد الإلكتروني</Label>
                    <p className="text-sm font-bold">{org.email || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>الموقع الإلكتروني</Label>
                    <p className="text-sm font-bold">{org.website || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>العنوان</Label>
                    <p className="text-sm font-bold">{[org.address, org.city, org.region].filter(Boolean).join("، ") || "—"}</p>
                  </div>
                </div>

                <Separator />

                {/* Summary Stats in Settings */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-black">{stats.totalAgents}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">إجمالي الأعضاء</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-black">{stats.activeAgents}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">نشطون</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-black">{stats.totalProperties}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">عقارات</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-2xl font-black">{stats.totalAppointments}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">مواعيد</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Skeleton className="h-[300px] rounded-2xl" />
          )}
        </TabsContent>
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* INVITE AGENT SHEET                                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent side="left" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="text-start mb-6">
            <SheetTitle>إضافة وكيل جديد</SheetTitle>
            <SheetDescription>أدخل بيانات الوكيل — كلمة المرور الافتراضية: agent123</SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            <div className={GRID_FORM}>
              <div className="space-y-2">
                <Label className={FORM_STYLES.label}>الاسم الأول *</Label>
                <Input
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="أحمد"
                />
              </div>
              <div className="space-y-2">
                <Label className={FORM_STYLES.label}>اسم العائلة *</Label>
                <Input
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="محمد"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={FORM_STYLES.label}>البريد الإلكتروني *</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="agent@company.com"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className={FORM_STYLES.label}>رقم الهاتف</Label>
              <Input
                value={inviteForm.phone}
                onChange={(e) => setInviteForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+966 5XX XXX XXXX"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className={FORM_STYLES.label}>الدور</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) => setInviteForm((p) => ({ ...p, role: v as "CORP_AGENT" | "CORP_OWNER" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORP_AGENT">وكيل</SelectItem>
                  <SelectItem value="CORP_OWNER">مالك المنظمة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={FORM_STYLES.label}>التخصصات</Label>
              <Select
                value={inviteForm.specialties}
                onValueChange={(v) => setInviteForm((p) => ({ ...p, specialties: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التخصص" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={FORM_STYLES.label}>المنطقة</Label>
              <Input
                value={inviteForm.territories}
                onChange={(e) => setInviteForm((p) => ({ ...p, territories: e.target.value }))}
                placeholder="الرياض، جدة..."
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => inviteMutation.mutate(inviteForm)}
              disabled={!inviteForm.firstName || !inviteForm.lastName || !inviteForm.email || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "جاري الإضافة..." : "إضافة الوكيل"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* EDIT AGENT SHEET                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="left" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="text-start mb-6">
            <SheetTitle>تعديل بيانات الوكيل</SheetTitle>
            <SheetDescription>
              {editingMember ? `${editingMember.firstName} ${editingMember.lastName}` : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            <div className={GRID_FORM}>
              <div className="space-y-2">
                <Label className={FORM_STYLES.label}>الاسم الأول</Label>
                <Input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className={FORM_STYLES.label}>اسم العائلة</Label>
                <Input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={FORM_STYLES.label}>رقم الهاتف</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                dir="ltr"
              />
            </div>

            <div className={GRID_FORM}>
              <div className="space-y-2">
                <Label className={FORM_STYLES.label}>المسمى الوظيفي</Label>
                <Input
                  value={editForm.jobTitle}
                  onChange={(e) => setEditForm((p) => ({ ...p, jobTitle: e.target.value }))}
                  placeholder="وكيل عقاري أول"
                />
              </div>
              <div className="space-y-2">
                <Label className={FORM_STYLES.label}>القسم</Label>
                <Input
                  value={editForm.department}
                  onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
                  placeholder="المبيعات"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={FORM_STYLES.label}>التخصصات</Label>
              <Select
                value={editForm.specialties}
                onValueChange={(v) => setEditForm((p) => ({ ...p, specialties: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التخصص" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={FORM_STYLES.label}>المنطقة</Label>
              <Input
                value={editForm.territories}
                onChange={(e) => setEditForm((p) => ({ ...p, territories: e.target.value }))}
              />
            </div>

            {/* Toggle Active + Role Change */}
            {editingMember && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">حالة الحساب</p>
                    <p className="text-xs text-muted-foreground">
                      {editingMember.isActive ? "الحساب مفعل حالياً" : "الحساب معطل حالياً"}
                    </p>
                  </div>
                  <Switch
                    checked={editingMember.isActive}
                    onCheckedChange={() => {
                      toggleActiveMutation.mutate(editingMember.id);
                      setEditingMember({ ...editingMember, isActive: !editingMember.isActive });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">الدور الحالي</p>
                    <p className="text-xs text-muted-foreground">{getRoleBadge(editingMember.roles).label}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={parseRoles(editingMember.roles).includes("CORP_AGENT") ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        changeRoleMutation.mutate({ id: editingMember.id, role: "CORP_AGENT" });
                        setEditingMember({ ...editingMember, roles: JSON.stringify(["CORP_AGENT"]) });
                      }}
                    >
                      وكيل
                    </Button>
                    <Button
                      variant={parseRoles(editingMember.roles).includes("CORP_OWNER") ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        changeRoleMutation.mutate({ id: editingMember.id, role: "CORP_OWNER" });
                        setEditingMember({ ...editingMember, roles: JSON.stringify(["CORP_OWNER"]) });
                      }}
                    >
                      مالك
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (editingMember) {
                  updateMutation.mutate({ id: editingMember.id, body: editForm });
                }
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* AGENT ACTIVITY SHEET (Drawer)                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Sheet open={activityOpen} onOpenChange={(open) => { setActivityOpen(open); if (!open) setActivityAgentId(null); }}>
        <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto">
          {activityLoading || !activityData ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-[200px] rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Agent Header */}
              <SheetHeader className="text-start mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {getInitials(activityData.agent.firstName, activityData.agent.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl">
                      {activityData.agent.firstName} {activityData.agent.lastName}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadge(activityData.agent.roles).variant} className="text-[10px]">
                        {getRoleBadge(activityData.agent.roles).label}
                      </Badge>
                      <Badge variant={activityData.agent.isActive ? "default" : "secondary"} className="text-[10px]">
                        {activityData.agent.isActive ? "نشط" : "معطل"}
                      </Badge>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Contact Info */}
              <div className="space-y-1.5 mb-4">
                {activityData.agent.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> {activityData.agent.email}
                  </div>
                )}
                {activityData.agent.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> <span className="font-mono">{activityData.agent.phone}</span>
                  </div>
                )}
                {activityData.agent.jobTitle && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" /> {activityData.agent.jobTitle}
                  </div>
                )}
                {activityData.agent.lastLoginAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> آخر دخول: {formatAdminDateTime(activityData.agent.lastLoginAt)}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: "عملاء", value: activityData.stats.leads, icon: Target },
                  { label: "صفقات", value: activityData.stats.deals, icon: Briefcase },
                  { label: "رابحة", value: activityData.stats.wonDeals, icon: TrendingUp },
                  { label: "مواعيد", value: activityData.stats.appointments, icon: Calendar },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                    <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xl font-black">{s.value}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Win Rate */}
              {activityData.stats.deals > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-bold">معدل التحويل</span>
                    <span className="font-black">
                      {Math.round((activityData.stats.wonDeals / activityData.stats.deals) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.round((activityData.stats.wonDeals / activityData.stats.deals) * 100)}
                    className="h-2"
                  />
                </div>
              )}

              <Separator className="my-4" />

              {/* Recent Leads */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  آخر العملاء المحتملين (30 يوم)
                </h4>
                {activityData.recentLeads.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">لا يوجد عملاء محتملين</p>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-end text-[10px]">المصدر</TableHead>
                          <TableHead className="text-end text-[10px]">الحالة</TableHead>
                          <TableHead className="text-end text-[10px]">التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityData.recentLeads.slice(0, 8).map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell className="text-xs">{lead.source || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {LEAD_STATUS_LABELS[lead.status] || lead.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatAdminDate(lead.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Recent Deals */}
              <div className="space-y-3 mt-6">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-amber-500" />
                  آخر الصفقات (30 يوم)
                </h4>
                {activityData.recentDeals.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">لا توجد صفقات</p>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-end text-[10px]">المبلغ</TableHead>
                          <TableHead className="text-end text-[10px]">العميل</TableHead>
                          <TableHead className="text-end text-[10px]">المرحلة</TableHead>
                          <TableHead className="text-end text-[10px]">التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityData.recentDeals.slice(0, 8).map((deal) => (
                          <TableRow key={deal.id}>
                            <TableCell className="text-xs font-mono">
                              {deal.agreedPrice ? `${Number(deal.agreedPrice).toLocaleString()} ${deal.currency}` : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {deal.customer ? `${deal.customer.firstName} ${deal.customer.lastName}` : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={deal.stage === "WON" ? "default" : deal.stage === "LOST" ? "destructive" : "outline"}
                                className="text-[10px]"
                              >
                                {STAGE_LABELS[deal.stage] || deal.stage}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatAdminDate(deal.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Recent Appointments */}
              <div className="space-y-3 mt-6">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  آخر المواعيد (30 يوم)
                </h4>
                {activityData.recentAppointments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">لا توجد مواعيد</p>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-end text-[10px]">الموقع</TableHead>
                          <TableHead className="text-end text-[10px]">العميل</TableHead>
                          <TableHead className="text-end text-[10px]">الحالة</TableHead>
                          <TableHead className="text-end text-[10px]">الموعد</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityData.recentAppointments.slice(0, 8).map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell className="text-xs">{apt.location || "—"}</TableCell>
                            <TableCell className="text-xs">
                              {apt.customer ? `${apt.customer.firstName} ${apt.customer.lastName}` : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {APPOINTMENT_STATUS_LABELS[apt.status] || apt.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatAdminDateTime(apt.scheduledAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Action Buttons in Activity Drawer */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setActivityOpen(false);
                    const member = members.find((m) => m.id === activityAgentId);
                    if (member) openEdit(member);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" /> تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    if (activityAgentId) toggleActiveMutation.mutate(activityAgentId);
                  }}
                >
                  <Power className="h-3.5 w-3.5" />
                  {activityData.agent.isActive ? "تعطيل" : "تفعيل"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
