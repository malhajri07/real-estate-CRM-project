/**
 * team/index.tsx — Enterprise Team Management System
 *
 * Full management dashboard for Corp Owners to manage their team of agents.
 * Tabs: Overview, Agents, Performance, Schedule, Activity Log, Settings
 *
 * Features:
 * - Leaderboard with podium display
 * - Team health indicators & at-risk alerts
 * - Agent detail expansion with sparklines
 * - Bulk lead assignment & work transfer
 * - Working hours management
 * - Internal notes system
 * - CSV export
 * - Activity log with filters
 * - Weekly schedule grid
 * - Period-based performance analytics with trends
 */

import { useMemo, useState, useCallback, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
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
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  GRID_METRICS, GRID_TWO_COL, GRID_FORM, CARD_HOVER,
} from "@/config/platform-theme";
import { CHART_COLORS, CHART_COLOR_ARRAY, CHART_HEIGHT, CHART_TOOLTIP_CLASSES } from "@/config/design-tokens";
import { apiGet, apiPost, apiPut, apiPatch, apiGetText } from "@/lib/apiClient";
import { formatAdminDate, formatAdminDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  Users, Building2, TrendingUp, Target, Phone, Mail,
  Award, MapPin, Calendar, BarChart3, Briefcase, Clock, Star,
  UserPlus, MoreVertical, Edit, Power, ArrowUpDown, Eye,
  Search, CheckCircle, XCircle, Activity,
  Settings, ChevronDown, UserCheck, UserX, Download,
  MessageSquare, Send, ArrowRightLeft, AlertTriangle,
  Trophy, Crown, FileText, Hash,
  Sparkles, ClipboardList, Zap, HeartPulse,
  CalendarDays,
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
  metadata: any;
  agent_profiles: AgentProfile | null;
  stats: {
    leads: number;
    deals: number;
    wonDeals: number;
    appointments: number;
    revenue: number;
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
    inactiveAgents: number;
    totalLeads: number;
    totalDeals: number;
    wonDeals: number;
    conversionRate: number;
    totalProperties: number;
    totalAppointments: number;
    totalRevenue: number;
    recentHires: number;
    unassignedLeads: number;
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
  monthlyTrend: { month: string; deals: number; wonDeals: number; revenue: number }[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl: string | null;
  department: string | null;
  jobTitle: string | null;
  leadsTotal: number;
  leadsConverted: number;
  deals: number;
  wonDeals: number;
  appointments: number;
  revenue: number;
  conversionRate: number;
  leadConversionRate: number;
}

interface LeaderboardResponse {
  period: string;
  leaderboard: LeaderboardEntry[];
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
    metadata: any;
    agent_profiles: { licenseNo: string; specialties: string; territories: string; status: string } | null;
  };
  stats: { leads: number; deals: number; wonDeals: number; appointments: number; revenue: number };
  monthlyDeals: number[];
  notes: { id: string; content: string; authorName: string; createdAt: string }[];
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

interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  afterJson: string | null;
  createdAt: string;
  agentName: string;
}

interface ActivityLogResponse {
  logs: ActivityLogEntry[];
  total: number;
  page: number;
  pages: number;
}

interface InviteFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "CORP_AGENT" | "CORP_OWNER";
  specialties: string;
  territories: string;
  department: string;
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

interface WorkingHourEntry {
  day: string;
  start: string;
  end: string;
  isOff: boolean;
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

const DEPARTMENT_OPTIONS = [
  "المبيعات",
  "التسويق",
  "خدمة العملاء",
  "الإدارة",
];

const DAYS_AR = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

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

const ACTION_LABELS: Record<string, string> = {
  CREATE: "إنشاء",
  UPDATE: "تحديث",
  DELETE: "حذف",
  AGENT_NOTE: "ملاحظة",
  BULK_ASSIGN_LEADS: "تعيين عملاء",
  AGENT_WORK_TRANSFER: "نقل أعمال",
  AGENT_ACTIVATED: "تفعيل وكيل",
  AGENT_DEACTIVATED: "تعطيل وكيل",
};

const ENTITY_LABELS: Record<string, string> = {
  leads: "عملاء",
  deals: "صفقات",
  appointments: "مواعيد",
  users: "مستخدمين",
  properties: "عقارات",
};

const PERIOD_LABELS: Record<string, string> = {
  week: "هذا الأسبوع",
  month: "هذا الشهر",
  quarter: "هذا الربع",
  year: "هذه السنة",
};

const emptyInviteForm: InviteFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "CORP_AGENT",
  specialties: "",
  territories: "",
  department: "",
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

const defaultWorkingHours: WorkingHourEntry[] = DAYS_AR.map((day, i) => ({
  day,
  start: "09:00",
  end: "17:00",
  isOff: i === 6, // Friday off by default
}));

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString();
}

/** Tiny inline sparkline using SVG */
function MiniSparkline({ data, color = CHART_COLORS.primary }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
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

  // -- State --
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "CORP_OWNER" | "CORP_AGENT">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [performancePeriod, setPerformancePeriod] = useState("month");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState("month");

  // Sheets
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormState>(emptyInviteForm);
  const [bulkInviteMode, setBulkInviteMode] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({ firstName: "", lastName: "", phone: "", jobTitle: "", department: "", specialties: "", territories: "" });
  const [editingMember, setEditingMember] = useState<AgentMember | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityAgentId, setActivityAgentId] = useState<string | null>(null);

  // Agent detail drawer sub-tabs
  const [drawerTab, setDrawerTab] = useState<"activity" | "notes" | "hours">("activity");
  const [newNote, setNewNote] = useState("");

  // Working hours editor
  const [workingHoursOpen, setWorkingHoursOpen] = useState(false);
  const [workingHoursAgentId, setWorkingHoursAgentId] = useState<string | null>(null);
  const [workingHoursForm, setWorkingHoursForm] = useState<WorkingHourEntry[]>(defaultWorkingHours);

  // Transfer dialog
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState<string | null>(null);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferLeads, setTransferLeads] = useState(true);
  const [transferDeals, setTransferDeals] = useState(true);
  const [transferAppointments, setTransferAppointments] = useState(true);

  // Assign leads dialog
  const [assignLeadsOpen, setAssignLeadsOpen] = useState(false);
  const [assignLeadsAgentId, setAssignLeadsAgentId] = useState<string | null>(null);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Expanded agent row
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  // Activity log filters
  const [logAgentFilter, setLogAgentFilter] = useState("all");
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [logPage, setLogPage] = useState(1);

  // -- Queries --
  const { data: teamData, isLoading: teamLoading, isError: teamError, refetch } = useQuery<OrgTeamResponse>({
    queryKey: ["/api/org/team"],
    queryFn: () => apiGet("/api/org/team"),
  });

  const { data: statsData } = useQuery<OrgStatsResponse>({
    queryKey: ["/api/org/stats"],
    queryFn: () => apiGet("/api/org/stats"),
  });

  const { data: perfData } = useQuery<PerformanceData>({
    queryKey: ["/api/org/team/performance", performancePeriod],
    queryFn: () => apiGet(`/api/org/team/performance?period=${performancePeriod}`),
    enabled: activeTab === "performance" || activeTab === "overview",
  });

  const { data: leaderboardData } = useQuery<LeaderboardResponse>({
    queryKey: ["/api/org/team/leaderboard", leaderboardPeriod],
    queryFn: () => apiGet(`/api/org/team/leaderboard?period=${leaderboardPeriod}`),
    enabled: activeTab === "overview",
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<AgentActivity>({
    queryKey: ["/api/org/team", activityAgentId, "activity"],
    queryFn: () => apiGet(`/api/org/team/${activityAgentId}/activity`),
    enabled: !!activityAgentId && activityOpen,
  });

  const { data: activityLogData } = useQuery<ActivityLogResponse>({
    queryKey: ["/api/org/team/activity-log", logPage, logAgentFilter, logTypeFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(logPage), limit: "30" });
      if (logAgentFilter !== "all") params.set("agentId", logAgentFilter);
      if (logTypeFilter !== "all") params.set("type", logTypeFilter);
      return apiGet(`/api/org/team/activity-log?${params.toString()}`);
    },
    enabled: activeTab === "activity-log",
  });

  // -- Mutations --
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/org/team"] });
    queryClient.invalidateQueries({ queryKey: ["/api/org/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/org/team/performance"] });
    queryClient.invalidateQueries({ queryKey: ["/api/org/team/leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/org/team/activity-log"] });
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

  const bulkInviteMutation = useMutation({
    mutationFn: (agents: { firstName: string; lastName: string; email: string }[]) =>
      apiPost("/api/org/team/invite-bulk", { agents }),
    onSuccess: (data: any) => {
      toast({ title: "تمت الدعوة الجماعية", description: data.message });
      setInviteOpen(false);
      setBulkEmails("");
      setBulkInviteMode(false);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast({ title: "فشل الدعوة الجماعية", description: err.message, variant: "destructive" });
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

  const transferMutation = useMutation({
    mutationFn: (data: { sourceId: string; targetAgentId: string; transferLeads: boolean; transferDeals: boolean; transferAppointments: boolean }) =>
      apiPost(`/api/org/team/${data.sourceId}/transfer`, {
        targetAgentId: data.targetAgentId,
        transferLeads: data.transferLeads,
        transferDeals: data.transferDeals,
        transferAppointments: data.transferAppointments,
      }),
    onSuccess: (data: any) => {
      toast({ title: "تم نقل الأعمال بنجاح", description: JSON.stringify(data.transferred) });
      setTransferOpen(false);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast({ title: "فشل نقل الأعمال", description: err.message, variant: "destructive" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (data: { agentId: string; content: string }) =>
      apiPost(`/api/org/team/${data.agentId}/note`, { content: data.content }),
    onSuccess: () => {
      toast({ title: "تم إضافة الملاحظة" });
      setNewNote("");
      if (activityAgentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/org/team", activityAgentId, "activity"] });
      }
    },
    onError: (err: Error) => {
      toast({ title: "فشل إضافة الملاحظة", description: err.message, variant: "destructive" });
    },
  });

  const setWorkingHoursMutation = useMutation({
    mutationFn: (data: { agentId: string; workingHours: WorkingHourEntry[] }) =>
      apiPost(`/api/org/team/${data.agentId}/set-working-hours`, { workingHours: data.workingHours }),
    onSuccess: () => {
      toast({ title: "تم تحديث ساعات العمل" });
      setWorkingHoursOpen(false);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast({ title: "فشل تحديث ساعات العمل", description: err.message, variant: "destructive" });
    },
  });

  // -- Filtered Members --
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

  // -- Selection --
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

  // -- Bulk Actions --
  const bulkToggle = async (activate: boolean) => {
    const ids = Array.from(selectedIds);
    const toToggle = members.filter((m) => ids.includes(m.id) && m.isActive !== activate);
    for (const m of toToggle) {
      await toggleActiveMutation.mutateAsync(m.id);
    }
    setSelectedIds(new Set());
  };

  // -- Handlers --
  const openEdit = (member: AgentMember) => {
    setEditingMember(member);
    setEditForm(emptyEditForm(member));
    setEditOpen(true);
  };

  const openActivity = (id: string) => {
    setActivityAgentId(id);
    setActivityOpen(true);
    setDrawerTab("activity");
  };

  const handleExportCSV = async () => {
    try {
      const text = await apiGetText("/api/org/team/export");
      const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "team-export.csv";
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "تم تصدير البيانات بنجاح" });
    } catch {
      toast({ title: "فشل تصدير البيانات", variant: "destructive" });
    }
  };

  const handleBulkInvite = () => {
    const lines = bulkEmails.split("\n").filter((l) => l.trim());
    const agents = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        email: parts[0] || "",
        firstName: parts[1] || parts[0]?.split("@")[0] || "",
        lastName: parts[2] || "",
      };
    }).filter((a) => a.email.includes("@"));

    if (agents.length === 0) {
      toast({ title: "لا توجد عناوين بريد صالحة", variant: "destructive" });
      return;
    }
    bulkInviteMutation.mutate(agents);
  };

  const openTransfer = (sourceId: string) => {
    setTransferSourceId(sourceId);
    setTransferTargetId("");
    setTransferLeads(true);
    setTransferDeals(true);
    setTransferAppointments(true);
    setTransferOpen(true);
  };

  const openWorkingHours = (agentId: string) => {
    setWorkingHoursAgentId(agentId);
    const member = members.find((m) => m.id === agentId);
    const meta = member?.metadata as Record<string, any> | null;
    setWorkingHoursForm(meta?.workingHours || defaultWorkingHours);
    setWorkingHoursOpen(true);
  };

  // -- Computed --
  const activeCount = members.filter((m) => m.isActive).length;
  const inactiveCount = members.filter((m) => !m.isActive).length;
  const recentHires = members.filter((m) => {
    const created = new Date(m.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return created >= thirtyDaysAgo;
  });
  const atRiskAgents = members.filter((m) => {
    if (!m.isActive) return false;
    // No deals in 30 days (rough check: wonDeals = 0 and deals = 0 considered at-risk)
    const noDeals = m.stats.deals === 0;
    // Not logged in for 7+ days
    const notLoggedIn = m.lastLoginAt
      ? new Date(m.lastLoginAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : true;
    return noDeals || notLoggedIn;
  });

  // -- Loading / Error --
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
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-1.5">
            <Users className="h-4 w-4" /> الوكلاء
            <Badge variant="secondary" className="text-[9px] h-5 px-1.5 ms-1">{members.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> الأداء
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> الجدول
          </TabsTrigger>
          <TabsTrigger value="activity-log" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> سجل النشاط
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" /> الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* OVERVIEW TAB                                                      */}
        {/* ================================================================ */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: "إجمالي الوكلاء", value: stats.totalAgents, icon: Users, color: "text-blue-500" },
                { label: "النشطون", value: stats.activeAgents, icon: UserCheck, color: "text-emerald-500" },
                { label: "المعطلون", value: stats.inactiveAgents, icon: UserX, color: "text-gray-400" },
                { label: "العملاء المحتملون", value: stats.totalLeads, icon: Target, color: "text-indigo-500" },
                { label: "الصفقات", value: stats.totalDeals, icon: Briefcase, color: "text-amber-500" },
                { label: "صفقات رابحة", value: stats.wonDeals, icon: TrendingUp, color: "text-emerald-500" },
                { label: "معدل التحويل", value: `${stats.conversionRate}%`, icon: BarChart3, color: "text-purple-500" },
                { label: "الإيرادات", value: `${formatRevenue(stats.totalRevenue)} ر.س`, icon: Zap, color: "text-primary" },
              ].map((s, i) => (
                <Card key={i} className={cn("transition-all duration-300 hover:shadow-md")}>
                  <CardContent className="p-3 text-center">
                    <s.icon className={cn("h-4 w-4 mx-auto mb-1", s.color)} />
                    <p className="text-xl font-black text-foreground leading-none">{s.value}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Team Health + Leaderboard Row */}
          <div className={GRID_TWO_COL}>
            {/* Team Health Indicators */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-rose-500" />
                  صحة الفريق
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active ratio bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-bold">نسبة النشطين</span>
                    <span className="font-black">{members.length > 0 ? Math.round((activeCount / members.length) * 100) : 0}%</span>
                  </div>
                  <Progress value={members.length > 0 ? (activeCount / members.length) * 100 : 0} className="h-2" />
                  <p className="text-[10px] text-muted-foreground mt-1">{activeCount} نشط من {members.length} عضو</p>
                </div>

                {/* Avg stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-xl bg-muted/50">
                    <p className="text-lg font-black">
                      {activeCount > 0 ? (members.reduce((s, m) => s + m.stats.deals, 0) / activeCount).toFixed(1) : "0"}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold">متوسط الصفقات/وكيل</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-muted/50">
                    <p className="text-lg font-black">
                      {activeCount > 0 ? (members.reduce((s, m) => s + m.stats.leads, 0) / activeCount).toFixed(1) : "0"}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold">متوسط العملاء/وكيل</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-muted/50">
                    <p className="text-lg font-black">
                      {activeCount > 0 ? (members.reduce((s, m) => s + m.stats.wonDeals, 0) / activeCount).toFixed(1) : "0"}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold">متوسط الرابحة/وكيل</p>
                  </div>
                </div>

                {/* Recent hires */}
                {recentHires.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-amber-500" /> التحقوا مؤخرا ({recentHires.length})
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {recentHires.slice(0, 5).map((m) => (
                        <Badge key={m.id} variant="outline" className="text-[10px] gap-1">
                          {m.firstName} {m.lastName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* At-risk alerts */}
                {atRiskAgents.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                    <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" /> تنبيهات الأداء ({atRiskAgents.length})
                    </h5>
                    <div className="space-y-1.5">
                      {atRiskAgents.slice(0, 4).map((m) => {
                        const notLoggedIn = m.lastLoginAt
                          ? new Date(m.lastLoginAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          : true;
                        return (
                          <div key={m.id} className="flex items-center justify-between text-[10px]">
                            <span className="font-bold">{m.firstName} {m.lastName}</span>
                            <span className="text-amber-600 dark:text-amber-400">
                              {m.stats.deals === 0 && "بدون صفقات"}
                              {m.stats.deals === 0 && notLoggedIn && " | "}
                              {notLoggedIn && "لم يسجل دخول 7+ أيام"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard Podium */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    لوحة المتصدرين
                  </CardTitle>
                  <Select value={leaderboardPeriod} onValueChange={setLeaderboardPeriod}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">هذا الأسبوع</SelectItem>
                      <SelectItem value="month">هذا الشهر</SelectItem>
                      <SelectItem value="quarter">هذا الربع</SelectItem>
                      <SelectItem value="year">هذه السنة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                  <>
                    {/* Podium: Top 3 */}
                    <div className="flex items-end justify-center gap-3 mb-4 h-[140px]">
                      {/* 2nd place */}
                      {leaderboardData.leaderboard[1] && (
                        <div className="flex flex-col items-center">
                          <Avatar className="h-10 w-10 ring-2 ring-gray-300 mb-1">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-bold">
                              {getInitials(leaderboardData.leaderboard[1].name.split(" ")[0], leaderboardData.leaderboard[1].name.split(" ")[1])}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-[10px] font-bold truncate max-w-[70px]">{leaderboardData.leaderboard[1].name}</p>
                          <p className="text-[9px] text-muted-foreground">{leaderboardData.leaderboard[1].wonDeals} صفقة</p>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-1 flex items-center justify-center text-lg font-black text-gray-500" style={{ height: 50 }}>
                            2
                          </div>
                        </div>
                      )}
                      {/* 1st place */}
                      {leaderboardData.leaderboard[0] && (
                        <div className="flex flex-col items-center">
                          <Crown className="h-5 w-5 text-amber-500 mb-0.5" />
                          <Avatar className="h-12 w-12 ring-2 ring-amber-400 mb-1">
                            <AvatarFallback className="bg-amber-50 text-amber-700 text-sm font-bold">
                              {getInitials(leaderboardData.leaderboard[0].name.split(" ")[0], leaderboardData.leaderboard[0].name.split(" ")[1])}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-bold truncate max-w-[80px]">{leaderboardData.leaderboard[0].name}</p>
                          <p className="text-[10px] text-amber-600 font-bold">{leaderboardData.leaderboard[0].wonDeals} صفقة</p>
                          <div className="w-16 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 rounded-t-lg mt-1 flex items-center justify-center text-xl font-black text-amber-600" style={{ height: 70 }}>
                            1
                          </div>
                        </div>
                      )}
                      {/* 3rd place */}
                      {leaderboardData.leaderboard[2] && (
                        <div className="flex flex-col items-center">
                          <Avatar className="h-9 w-9 ring-2 ring-orange-300 mb-1">
                            <AvatarFallback className="bg-orange-50 text-orange-600 text-xs font-bold">
                              {getInitials(leaderboardData.leaderboard[2].name.split(" ")[0], leaderboardData.leaderboard[2].name.split(" ")[1])}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-[10px] font-bold truncate max-w-[70px]">{leaderboardData.leaderboard[2].name}</p>
                          <p className="text-[9px] text-muted-foreground">{leaderboardData.leaderboard[2].wonDeals} صفقة</p>
                          <div className="w-16 bg-orange-100 dark:bg-orange-900/20 rounded-t-lg mt-1 flex items-center justify-center text-lg font-black text-orange-500" style={{ height: 35 }}>
                            3
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rest of leaderboard */}
                    {leaderboardData.leaderboard.length > 3 && (
                      <div className="space-y-1.5 mt-3">
                        {leaderboardData.leaderboard.slice(3, 8).map((agent, i) => (
                          <div key={agent.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                            <span className="text-xs font-bold text-muted-foreground w-5">{i + 4}</span>
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                                {getInitials(agent.name.split(" ")[0], agent.name.split(" ")[1])}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold flex-1 truncate">{agent.name}</span>
                            <span className="text-[10px] text-muted-foreground">{agent.wonDeals} صفقة</span>
                            <span className="text-[10px] font-mono text-primary font-bold">{formatRevenue(agent.revenue)} ر.س</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    لا توجد بيانات متصدرين بعد
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Chart + Team Summary */}
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
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                        onClick={() => openActivity(m.id)}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{m.firstName} {m.lastName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {m.stats.leads} عملاء . {m.stats.deals} صفقات . {m.stats.wonDeals} رابحة . {formatRevenue(m.stats.revenue)} ر.س
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

        {/* ================================================================ */}
        {/* AGENTS TAB                                                        */}
        {/* ================================================================ */}
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

            {/* Export CSV */}
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="h-4 w-4" /> تصدير CSV
            </Button>

            {/* Add Agent */}
            <Button onClick={() => { setInviteForm(emptyInviteForm); setBulkInviteMode(false); setInviteOpen(true); }} className="gap-1.5">
              <UserPlus className="h-4 w-4" /> إضافة وكيل
            </Button>
          </div>

          {/* Table */}
          {filteredMembers.length === 0 ? (
            <EmptyState
              title="لا يوجد وكلاء"
              description={searchTerm || roleFilter !== "all" || statusFilter !== "all"
                ? "لا توجد نتائج مطابقة -- جرّب تغيير البحث أو الفلاتر"
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
                      <TableHead className={TABLE_STYLES.headerCell}>الوكيل</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>الحالة</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>الدور</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>القسم</TableHead>
                      <TableHead className={cn(TABLE_STYLES.headerCell, "text-center")}>عملاء</TableHead>
                      <TableHead className={cn(TABLE_STYLES.headerCell, "text-center")}>صفقات</TableHead>
                      <TableHead className={cn(TABLE_STYLES.headerCell, "text-center")}>رابحة</TableHead>
                      <TableHead className={cn(TABLE_STYLES.headerCell, "text-center")}>الإيرادات</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>الأيام</TableHead>
                      <TableHead className={TABLE_STYLES.headerCell}>آخر دخول</TableHead>
                      <TableHead className={cn(TABLE_STYLES.headerCell, "w-[50px]")}>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => {
                      const initials = getInitials(member.firstName, member.lastName);
                      const roleBadge = getRoleBadge(member.roles);
                      const currentRoles = parseRoles(member.roles);
                      const isOwner = currentRoles.includes("CORP_OWNER");
                      const isExpanded = expandedAgentId === member.id;

                      // Working hours from metadata
                      const meta = member.metadata as Record<string, any> | null;
                      const wh: WorkingHourEntry[] = meta?.workingHours || [];

                      return (
                        <Fragment key={member.id}>
                          <TableRow
                            className={cn(
                              TABLE_STYLES.row,
                              !member.isActive && "opacity-60",
                              "cursor-pointer transition-all duration-200 hover:shadow-sm",
                              isExpanded && "bg-muted/30"
                            )}
                            onClick={() => setExpandedAgentId(isExpanded ? null : member.id)}
                          >
                            {/* Checkbox */}
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(member.id)}
                                onCheckedChange={() => toggleSelectOne(member.id)}
                              />
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

                            {/* Department */}
                            <TableCell className="text-xs text-muted-foreground">
                              {member.department || "--"}
                            </TableCell>

                            {/* Stats */}
                            <TableCell className="text-center font-bold">{member.stats.leads}</TableCell>
                            <TableCell className="text-center font-bold">{member.stats.deals}</TableCell>
                            <TableCell className="text-center font-bold text-primary">{member.stats.wonDeals}</TableCell>
                            <TableCell className="text-center text-xs font-mono font-bold">
                              {formatRevenue(member.stats.revenue)}
                            </TableCell>

                            {/* Working hours dots */}
                            <TableCell>
                              <div className="flex gap-0.5">
                                {DAYS_AR.map((day, i) => {
                                  const entry = wh.find((w) => w.day === day);
                                  const isOff = entry?.isOff ?? (i === 6);
                                  return (
                                    <Tooltip key={day}>
                                      <TooltipTrigger asChild>
                                        <div className={cn(
                                          "w-2 h-2 rounded-full",
                                          isOff ? "bg-gray-300 dark:bg-gray-600" : "bg-emerald-500"
                                        )} />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-[10px]">
                                        {day}: {isOff ? "إجازة" : `${entry?.start || "09:00"}-${entry?.end || "17:00"}`}
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </TableCell>

                            {/* Last Login */}
                            <TableCell className="text-xs text-muted-foreground">
                              {member.lastLoginAt ? formatAdminDate(member.lastLoginAt) : "--"}
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
                                  <DropdownMenuItem onClick={() => openWorkingHours(member.id)}>
                                    <Clock className="h-4 w-4 me-2" /> ساعات العمل
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openTransfer(member.id)}>
                                    <ArrowRightLeft className="h-4 w-4 me-2" /> نقل الأعمال
                                  </DropdownMenuItem>
                                  {member.phone && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => window.open(`https://wa.me/${member.phone?.replace(/[^0-9]/g, "")}`, "_blank")}>
                                        <MessageSquare className="h-4 w-4 me-2" /> واتساب
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => window.open(`tel:${member.phone}`)}>
                                        <Phone className="h-4 w-4 me-2" /> اتصال
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setConfirmDialog({
                                        open: true,
                                        title: member.isActive ? "تعطيل الحساب" : "تفعيل الحساب",
                                        description: member.isActive
                                          ? `هل تريد تعطيل حساب ${member.firstName} ${member.lastName}؟ لن يتمكن من الدخول.`
                                          : `هل تريد تفعيل حساب ${member.firstName} ${member.lastName}؟`,
                                        onConfirm: () => toggleActiveMutation.mutate(member.id),
                                      });
                                    }}
                                  >
                                    <Power className="h-4 w-4 me-2" />
                                    {member.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setConfirmDialog({
                                        open: true,
                                        title: "تغيير الدور",
                                        description: isOwner
                                          ? `هل تريد تخفيض ${member.firstName} ${member.lastName} من مالك إلى وكيل؟`
                                          : `هل تريد ترقية ${member.firstName} ${member.lastName} من وكيل إلى مالك؟`,
                                        onConfirm: () =>
                                          changeRoleMutation.mutate({
                                            id: member.id,
                                            role: isOwner ? "CORP_AGENT" : "CORP_OWNER",
                                          }),
                                      });
                                    }}
                                  >
                                    <ArrowUpDown className="h-4 w-4 me-2" />
                                    {isOwner ? "تخفيض إلى وكيل" : "ترقية إلى مالك"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Row Detail */}
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={12} className="p-0 border-b-2 border-primary/10">
                                <div className="bg-muted/20 p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Quick Stats */}
                                    <div className="space-y-2">
                                      <h5 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <BarChart3 className="h-3 w-3" /> إحصائيات سريعة
                                      </h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="text-center p-2 rounded-lg bg-card border border-border">
                                          <p className="text-lg font-black text-primary">{member.stats.wonDeals}</p>
                                          <p className="text-[9px] text-muted-foreground font-bold">رابحة</p>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-card border border-border">
                                          <p className="text-lg font-black">{member.stats.deals > 0 ? Math.round((member.stats.wonDeals / member.stats.deals) * 100) : 0}%</p>
                                          <p className="text-[9px] text-muted-foreground font-bold">معدل التحويل</p>
                                        </div>
                                      </div>
                                      <div className="text-center p-2 rounded-lg bg-card border border-border">
                                        <p className="text-lg font-black font-mono">{formatRevenue(member.stats.revenue)} <span className="text-xs font-normal">ر.س</span></p>
                                        <p className="text-[9px] text-muted-foreground font-bold">إجمالي الإيرادات</p>
                                      </div>
                                    </div>

                                    {/* Contact & Profile */}
                                    <div className="space-y-2">
                                      <h5 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <FileText className="h-3 w-3" /> معلومات الملف
                                      </h5>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-muted-foreground">{member.email}</span>
                                        </div>
                                        {member.phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-mono text-muted-foreground">{member.phone}</span>
                                          </div>
                                        )}
                                        {member.jobTitle && (
                                          <div className="flex items-center gap-2">
                                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">{member.jobTitle}</span>
                                          </div>
                                        )}
                                        {member.agent_profiles?.territories && (
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">{member.agent_profiles.territories}</span>
                                          </div>
                                        )}
                                        {member.agent_profiles?.specialties && (
                                          <div className="flex items-center gap-2">
                                            <Award className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">{member.agent_profiles.specialties}</span>
                                          </div>
                                        )}
                                        {member.agent_profiles?.licenseNo && (
                                          <div className="flex items-center gap-2">
                                            <Hash className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-mono text-muted-foreground">{member.agent_profiles.licenseNo}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="space-y-2">
                                      <h5 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Zap className="h-3 w-3" /> إجراءات سريعة
                                      </h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); openActivity(member.id); }}>
                                          <Eye className="h-3 w-3" /> التفاصيل
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); openEdit(member); }}>
                                          <Edit className="h-3 w-3" /> تعديل
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); openWorkingHours(member.id); }}>
                                          <Clock className="h-3 w-3" /> الساعات
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); openTransfer(member.id); }}>
                                          <ArrowRightLeft className="h-3 w-3" /> نقل
                                        </Button>
                                      </div>
                                      {member.phone && (
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs gap-1 text-green-600 hover:text-green-700"
                                            onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${member.phone?.replace(/[^0-9]/g, "")}`, "_blank"); }}
                                          >
                                            <MessageSquare className="h-3 w-3" /> واتساب
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs gap-1"
                                            onClick={(e) => { e.stopPropagation(); window.open(`tel:${member.phone}`); }}
                                          >
                                            <Phone className="h-3 w-3" /> اتصال
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
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

        {/* ================================================================ */}
        {/* PERFORMANCE TAB                                                   */}
        {/* ================================================================ */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          {/* Period Selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">تحليل أداء الفريق</h3>
            <Select value={performancePeriod} onValueChange={setPerformancePeriod}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
                <SelectItem value="quarter">هذا الربع</SelectItem>
                <SelectItem value="year">هذه السنة</SelectItem>
                <SelectItem value="all">الكل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!perfData ? (
            <div className="space-y-4">
              <Skeleton className="h-[350px] rounded-2xl" />
              <Skeleton className="h-[350px] rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Monthly Trend Line Chart */}
              {perfData.monthlyTrend && perfData.monthlyTrend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      اتجاه الصفقات الشهري (آخر 6 أشهر)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]" style={{ direction: "ltr" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={perfData.monthlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" fontSize={11} tickLine={false} />
                          <YAxis fontSize={11} tickLine={false} />
                          <ReTooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="deals" name="الصفقات" stroke={CHART_COLORS.blue} fill="url(#colorDeals)" strokeWidth={2} />
                          <Area type="monotone" dataKey="wonDeals" name="رابحة" stroke={CHART_COLORS.green} fill="url(#colorWon)" strokeWidth={2} />
                          <Legend />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Revenue by Agent + Leads by Agent */}
              <div className={GRID_TWO_COL}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      الإيرادات حسب الوكيل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[320px]" style={{ direction: "ltr" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={perfData.agentMetrics.filter((a) => a.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 10)}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={11} tickLine={false} />
                          <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => formatRevenue(v)} />
                          <ReTooltip content={<ChartTooltip formatter={(v: number) => `${v.toLocaleString()} ر.س`} />} />
                          <Bar dataKey="revenue" name="الإيرادات" fill={CHART_COLORS.amber} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

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
              </div>

              {/* Pie Chart: Deal Stages + Rankings Table with sparklines */}
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
                              label={({ stage, percent }) =>
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

                {/* Agent Rankings with sparklines */}
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
                          <TableHead className="text-center text-xs">الإيرادات</TableHead>
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
                              <TableCell className="text-center text-[10px] font-mono font-bold text-primary">
                                {formatRevenue(agent.revenue)}
                              </TableCell>
                              <TableCell className="text-center font-bold text-primary">{agent.wonDeals}</TableCell>
                              <TableCell className="text-center font-bold">{agent.deals}</TableCell>
                              <TableCell className="font-bold text-sm">{agent.name}</TableCell>
                            </TableRow>
                          ))}
                        {perfData.agentMetrics.filter((a) => a.deals > 0).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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

        {/* ================================================================ */}
        {/* SCHEDULE TAB                                                      */}
        {/* ================================================================ */}
        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                جدول الفريق الأسبوعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <EmptyState title="لا يوجد وكلاء" description="أضف وكلاء لعرض الجدول" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={TABLE_STYLES.header}>
                        <TableHead className={cn(TABLE_STYLES.headerCell, "sticky start-0 bg-muted/50 z-10")}>الوكيل</TableHead>
                        {DAYS_AR.map((day) => (
                          <TableHead key={day} className={cn(TABLE_STYLES.headerCell, "text-center min-w-[100px]")}>{day}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.filter((m) => m.isActive).map((member) => {
                        const meta = member.metadata as Record<string, any> | null;
                        const wh: WorkingHourEntry[] = meta?.workingHours || [];
                        const initials = getInitials(member.firstName, member.lastName);

                        return (
                          <TableRow key={member.id} className={TABLE_STYLES.row}>
                            <TableCell className="sticky start-0 bg-card z-10">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">{initials}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-bold truncate max-w-[100px]">{member.firstName} {member.lastName}</span>
                              </div>
                            </TableCell>
                            {DAYS_AR.map((day, dayIdx) => {
                              const entry = wh.find((w) => w.day === day);
                              const isOff = entry?.isOff ?? (dayIdx === 6);

                              return (
                                <TableCell key={day} className="text-center p-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={cn(
                                          "rounded-lg p-2 text-[10px] font-bold cursor-pointer transition-colors",
                                          isOff
                                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                                        )}
                                        onClick={() => openWorkingHours(member.id)}
                                      >
                                        {isOff ? "إجازة" : `${entry?.start || "09:00"}-${entry?.end || "17:00"}`}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        {isOff
                                          ? `${member.firstName} في إجازة يوم ${day}`
                                          : `${member.firstName}: ${entry?.start || "09:00"} - ${entry?.end || "17:00"}`}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground mt-1">اضغط لتعديل ساعات العمل</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200" />
                  متاح
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200" />
                  إجازة
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* ACTIVITY LOG TAB                                                  */}
        {/* ================================================================ */}
        <TabsContent value="activity-log" className="space-y-4 mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Select value={logAgentFilter} onValueChange={(v) => { setLogAgentFilter(v); setLogPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="كل الوكلاء" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الوكلاء</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={logTypeFilter} onValueChange={(v) => { setLogTypeFilter(v); setLogPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="leads">عملاء</SelectItem>
                <SelectItem value="deals">صفقات</SelectItem>
                <SelectItem value="appointments">مواعيد</SelectItem>
                <SelectItem value="users">مستخدمين</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {!activityLogData || activityLogData.logs.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm">
                  لا توجد سجلات نشاط
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activityLogData.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        log.entity === "leads" ? "bg-blue-50 text-blue-500 dark:bg-blue-950/30" :
                        log.entity === "deals" ? "bg-amber-50 text-amber-500 dark:bg-amber-950/30" :
                        log.entity === "appointments" ? "bg-green-50 text-green-500 dark:bg-green-950/30" :
                        "bg-purple-50 text-purple-500 dark:bg-purple-950/30"
                      )}>
                        {log.entity === "leads" ? <Target className="h-3.5 w-3.5" /> :
                         log.entity === "deals" ? <Briefcase className="h-3.5 w-3.5" /> :
                         log.entity === "appointments" ? <Calendar className="h-3.5 w-3.5" /> :
                         <Users className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-bold">{log.agentName}</span>
                          <span className="text-muted-foreground"> {ACTION_LABELS[log.action] || log.action} </span>
                          <span className="text-muted-foreground">{ENTITY_LABELS[log.entity] || log.entity}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatAdminDateTime(log.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {ENTITY_LABELS[log.entity] || log.entity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {activityLogData && activityLogData.pages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    صفحة {activityLogData.page} من {activityLogData.pages} ({activityLogData.total} سجل)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={logPage <= 1}
                      onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                    >
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={logPage >= activityLogData.pages}
                      onClick={() => setLogPage((p) => p + 1)}
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* SETTINGS TAB                                                      */}
        {/* ================================================================ */}
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
                    <p className="text-sm font-bold font-mono">{org.phone || "--"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>البريد الإلكتروني</Label>
                    <p className="text-sm font-bold">{org.email || "--"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>الموقع الإلكتروني</Label>
                    <p className="text-sm font-bold">{org.website || "--"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className={FORM_STYLES.label}>العنوان</Label>
                    <p className="text-sm font-bold">{[org.address, org.city, org.region].filter(Boolean).join("، ") || "--"}</p>
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

      {/* ================================================================== */}
      {/* INVITE AGENT SHEET                                                  */}
      {/* ================================================================== */}
      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent side="left" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="text-start mb-6">
            <SheetTitle>
              {bulkInviteMode ? "دعوة جماعية" : "إضافة وكيل جديد"}
            </SheetTitle>
            <SheetDescription>
              {bulkInviteMode
                ? "أدخل بريد إلكتروني واحد في كل سطر (اختياري: email,firstName,lastName)"
                : "أدخل بيانات الوكيل -- كلمة المرور الافتراضية: agent123"}
            </SheetDescription>
          </SheetHeader>

          {/* Toggle between single and bulk */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={bulkInviteMode ? "outline" : "default"}
              size="sm"
              onClick={() => setBulkInviteMode(false)}
              className="text-xs"
            >
              إضافة فردية
            </Button>
            <Button
              variant={bulkInviteMode ? "default" : "outline"}
              size="sm"
              onClick={() => setBulkInviteMode(true)}
              className="text-xs"
            >
              دعوة جماعية
            </Button>
          </div>

          {bulkInviteMode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={FORM_STYLES.label}>عناوين البريد الإلكتروني (سطر لكل بريد)</Label>
                <Textarea
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  placeholder={"agent1@company.com,أحمد,محمد\nagent2@company.com,سارة,العلي\nagent3@company.com"}
                  rows={8}
                  dir="ltr"
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  الصيغة: email,الاسم الأول,اسم العائلة (الاسم اختياري)
                </p>
              </div>

              <SheetFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>إلغاء</Button>
                <Button onClick={handleBulkInvite} disabled={!bulkEmails.trim() || bulkInviteMutation.isPending}>
                  {bulkInviteMutation.isPending ? "جاري الإضافة..." : "دعوة الجميع"}
                </Button>
              </SheetFooter>
            </div>
          ) : (
            <>
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

                <div className={GRID_FORM}>
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
                    <Label className={FORM_STYLES.label}>القسم</Label>
                    <Select
                      value={inviteForm.department}
                      onValueChange={(v) => setInviteForm((p) => ({ ...p, department: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENT_OPTIONS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ================================================================== */}
      {/* EDIT AGENT SHEET                                                    */}
      {/* ================================================================== */}
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
                <Select
                  value={editForm.department}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, department: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      {editingMember.isActive ? "الحساب مفعل حاليا" : "الحساب معطل حاليا"}
                    </p>
                  </div>
                  <Switch
                    checked={editingMember.isActive}
                    onCheckedChange={() => {
                      setConfirmDialog({
                        open: true,
                        title: editingMember.isActive ? "تعطيل الحساب" : "تفعيل الحساب",
                        description: editingMember.isActive
                          ? `هل تريد تعطيل حساب ${editingMember.firstName}؟`
                          : `هل تريد تفعيل حساب ${editingMember.firstName}؟`,
                        onConfirm: () => {
                          toggleActiveMutation.mutate(editingMember.id);
                          setEditingMember({ ...editingMember, isActive: !editingMember.isActive });
                        },
                      });
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
                        setConfirmDialog({
                          open: true,
                          title: "تغيير إلى وكيل",
                          description: `هل تريد تغيير دور ${editingMember.firstName} إلى وكيل؟`,
                          onConfirm: () => {
                            changeRoleMutation.mutate({ id: editingMember.id, role: "CORP_AGENT" });
                            setEditingMember({ ...editingMember, roles: JSON.stringify(["CORP_AGENT"]) });
                          },
                        });
                      }}
                    >
                      وكيل
                    </Button>
                    <Button
                      variant={parseRoles(editingMember.roles).includes("CORP_OWNER") ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setConfirmDialog({
                          open: true,
                          title: "ترقية إلى مالك",
                          description: `هل تريد ترقية ${editingMember.firstName} إلى مالك المنظمة؟`,
                          onConfirm: () => {
                            changeRoleMutation.mutate({ id: editingMember.id, role: "CORP_OWNER" });
                            setEditingMember({ ...editingMember, roles: JSON.stringify(["CORP_OWNER"]) });
                          },
                        });
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

      {/* ================================================================== */}
      {/* AGENT ACTIVITY SHEET (Enhanced Drawer)                              */}
      {/* ================================================================== */}
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
              <SheetHeader className="text-start mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {getInitials(activityData.agent.firstName, activityData.agent.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <SheetTitle className="text-xl">
                      {activityData.agent.firstName} {activityData.agent.lastName}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={getRoleBadge(activityData.agent.roles).variant} className="text-[10px]">
                        {getRoleBadge(activityData.agent.roles).label}
                      </Badge>
                      <Badge variant={activityData.agent.isActive ? "default" : "secondary"} className="text-[10px]">
                        {activityData.agent.isActive ? "نشط" : "معطل"}
                      </Badge>
                      {activityData.agent.department && (
                        <Badge variant="outline" className="text-[10px]">{activityData.agent.department}</Badge>
                      )}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] text-green-600"
                      onClick={() => window.open(`https://wa.me/${activityData.agent.phone?.replace(/[^0-9]/g, "")}`, "_blank")}
                    >
                      واتساب
                    </Button>
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

              {/* Stats + Sparkline */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[
                  { label: "عملاء", value: activityData.stats.leads, icon: Target },
                  { label: "صفقات", value: activityData.stats.deals, icon: Briefcase },
                  { label: "رابحة", value: activityData.stats.wonDeals, icon: TrendingUp },
                  { label: "مواعيد", value: activityData.stats.appointments, icon: Calendar },
                  { label: "إيرادات", value: formatRevenue(activityData.stats.revenue), icon: Zap },
                ].map((s, i) => (
                  <div key={i} className="text-center p-2 rounded-xl bg-muted/50">
                    <s.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                    <p className="text-lg font-black leading-none">{s.value}</p>
                    <p className="text-[8px] text-muted-foreground font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Win Rate + Sparkline */}
              <div className="flex items-center gap-4 mb-4">
                {activityData.stats.deals > 0 && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
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
                {activityData.monthlyDeals && activityData.monthlyDeals.length > 0 && (
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground font-bold mb-0.5">صفقات 6 أشهر</p>
                    <MiniSparkline data={activityData.monthlyDeals} />
                  </div>
                )}
              </div>

              <Separator className="my-3" />

              {/* Sub-tabs in drawer */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={drawerTab === "activity" ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setDrawerTab("activity")}
                >
                  <Activity className="h-3 w-3" /> النشاط
                </Button>
                <Button
                  variant={drawerTab === "notes" ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setDrawerTab("notes")}
                >
                  <FileText className="h-3 w-3" /> الملاحظات
                  {activityData.notes.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 ms-0.5">{activityData.notes.length}</Badge>
                  )}
                </Button>
                <Button
                  variant={drawerTab === "hours" ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setDrawerTab("hours")}
                >
                  <Clock className="h-3 w-3" /> ساعات العمل
                </Button>
              </div>

              {/* Activity sub-tab */}
              {drawerTab === "activity" && (
                <>
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
                                <TableCell className="text-xs">{lead.source || "--"}</TableCell>
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
                                  {deal.agreedPrice ? `${Number(deal.agreedPrice).toLocaleString()} ${deal.currency}` : "--"}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {deal.customer ? `${deal.customer.firstName} ${deal.customer.lastName}` : "--"}
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
                                <TableCell className="text-xs">{apt.location || "--"}</TableCell>
                                <TableCell className="text-xs">
                                  {apt.customer ? `${apt.customer.firstName} ${apt.customer.lastName}` : "--"}
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
                </>
              )}

              {/* Notes sub-tab */}
              {drawerTab === "notes" && (
                <div className="space-y-4">
                  {/* Add note */}
                  <div className="space-y-2">
                    <Label className={FORM_STYLES.label}>إضافة ملاحظة داخلية</Label>
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="أدخل ملاحظتك عن هذا الوكيل..."
                      rows={3}
                    />
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={!newNote.trim() || addNoteMutation.isPending}
                      onClick={() => {
                        if (activityAgentId && newNote.trim()) {
                          addNoteMutation.mutate({ agentId: activityAgentId, content: newNote.trim() });
                        }
                      }}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {addNoteMutation.isPending ? "جاري الإضافة..." : "إضافة ملاحظة"}
                    </Button>
                  </div>

                  <Separator />

                  {/* Existing notes */}
                  {activityData.notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">لا توجد ملاحظات بعد</p>
                  ) : (
                    <div className="space-y-3">
                      {activityData.notes.map((note) => (
                        <div key={note.id} className="p-3 rounded-xl border border-border bg-muted/30">
                          <p className="text-sm">{note.content}</p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                            <span className="font-bold">{note.authorName}</span>
                            <span>.</span>
                            <span>{formatAdminDateTime(note.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Working hours sub-tab */}
              {drawerTab === "hours" && (
                <div className="space-y-3">
                  {(() => {
                    const meta = activityData.agent.metadata as Record<string, any> | null;
                    const wh: WorkingHourEntry[] = meta?.workingHours || [];
                    const hasHours = wh.length > 0;

                    return hasHours ? (
                      <>
                        {wh.map((entry) => (
                          <div key={entry.day} className="flex items-center justify-between p-2 rounded-lg border border-border">
                            <span className="text-sm font-bold w-20">{entry.day}</span>
                            {entry.isOff ? (
                              <Badge variant="secondary" className="text-[10px]">إجازة</Badge>
                            ) : (
                              <span className="text-sm font-mono">{entry.start} - {entry.end}</span>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={() => openWorkingHours(activityData.agent.id)}
                        >
                          <Edit className="h-3.5 w-3.5" /> تعديل ساعات العمل
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-3">لم يتم تحديد ساعات العمل بعد</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openWorkingHours(activityData.agent.id)}
                        >
                          <Clock className="h-3.5 w-3.5" /> تحديد ساعات العمل
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons in Activity Drawer */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-border flex-wrap">
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
                    if (activityAgentId) openTransfer(activityAgentId);
                  }}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" /> نقل الأعمال
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    if (activityAgentId) {
                      setConfirmDialog({
                        open: true,
                        title: activityData.agent.isActive ? "تعطيل" : "تفعيل",
                        description: activityData.agent.isActive
                          ? `هل تريد تعطيل حساب ${activityData.agent.firstName}؟`
                          : `هل تريد تفعيل حساب ${activityData.agent.firstName}؟`,
                        onConfirm: () => toggleActiveMutation.mutate(activityAgentId!),
                      });
                    }
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

      {/* ================================================================== */}
      {/* WORKING HOURS SHEET                                                 */}
      {/* ================================================================== */}
      <Sheet open={workingHoursOpen} onOpenChange={setWorkingHoursOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="text-start mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> ساعات العمل
            </SheetTitle>
            <SheetDescription>
              حدد ساعات عمل الوكيل لكل يوم من الأسبوع
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            {workingHoursForm.map((entry, idx) => (
              <div key={entry.day} className="flex items-center gap-3 p-2 rounded-xl border border-border">
                <span className="text-sm font-bold w-16 shrink-0">{entry.day}</span>
                <div className="flex items-center gap-2 flex-1">
                  <Switch
                    checked={!entry.isOff}
                    onCheckedChange={(checked) => {
                      const next = [...workingHoursForm];
                      next[idx] = { ...entry, isOff: !checked };
                      setWorkingHoursForm(next);
                    }}
                  />
                  {entry.isOff ? (
                    <span className="text-xs text-muted-foreground">إجازة</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        type="time"
                        value={entry.start}
                        onChange={(e) => {
                          const next = [...workingHoursForm];
                          next[idx] = { ...entry, start: e.target.value };
                          setWorkingHoursForm(next);
                        }}
                        className="w-24 h-8 text-xs"
                        dir="ltr"
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={entry.end}
                        onChange={(e) => {
                          const next = [...workingHoursForm];
                          next[idx] = { ...entry, end: e.target.value };
                          setWorkingHoursForm(next);
                        }}
                        className="w-24 h-8 text-xs"
                        dir="ltr"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setWorkingHoursOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => {
                if (workingHoursAgentId) {
                  setWorkingHoursMutation.mutate({
                    agentId: workingHoursAgentId,
                    workingHours: workingHoursForm,
                  });
                }
              }}
              disabled={setWorkingHoursMutation.isPending}
            >
              {setWorkingHoursMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ================================================================== */}
      {/* TRANSFER WORK DIALOG                                                */}
      {/* ================================================================== */}
      <Sheet open={transferOpen} onOpenChange={setTransferOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="text-start mb-6">
            <SheetTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" /> نقل الأعمال
            </SheetTitle>
            <SheetDescription>
              انقل عملاء وصفقات ومواعيد هذا الوكيل إلى وكيل آخر
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className={FORM_STYLES.label}>الوكيل المستلم *</Label>
              <Select value={transferTargetId} onValueChange={setTransferTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوكيل المستلم" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter((m) => m.id !== transferSourceId && m.isActive)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className={FORM_STYLES.label}>البيانات المراد نقلها</Label>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-bold">العملاء المحتملون</span>
                </div>
                <Switch checked={transferLeads} onCheckedChange={setTransferLeads} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold">الصفقات</span>
                </div>
                <Switch checked={transferDeals} onCheckedChange={setTransferDeals} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold">المواعيد</span>
                </div>
                <Switch checked={transferAppointments} onCheckedChange={setTransferAppointments} />
              </div>
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setTransferOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => {
                if (transferSourceId && transferTargetId) {
                  transferMutation.mutate({
                    sourceId: transferSourceId,
                    targetAgentId: transferTargetId,
                    transferLeads,
                    transferDeals,
                    transferAppointments,
                  });
                }
              }}
              disabled={!transferTargetId || transferMutation.isPending || (!transferLeads && !transferDeals && !transferAppointments)}
            >
              {transferMutation.isPending ? "جاري النقل..." : "تأكيد النقل"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ================================================================== */}
      {/* CONFIRMATION DIALOG                                                 */}
      {/* ================================================================== */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDialog.onConfirm(); setConfirmDialog((prev) => ({ ...prev, open: false })); }}>
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
