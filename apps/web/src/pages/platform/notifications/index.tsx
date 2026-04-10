/**
 * Campaign Management System — إدارة الحملات
 *
 * Rule engine for automated client outreach + manual campaign creation.
 * Replaces the old "notifications" page with a full CRM campaign tool.
 *
 * Sections:
 *   1. Dashboard stats — active campaigns, total reached, response rate, automation rules
 *   2. Smart Suggestions — AI-like rule engine triggers for who to contact now
 *   3. Quick Actions — one-tap campaign launch by segment
 *   4. Create Campaign — audience builder + message composer + channel selector
 *   5. Automation Rules — if/then triggers (cold leads, listing expiry, follow-up reminders)
 *   6. Campaign History — past campaigns with delivery + response metrics
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Megaphone, Send, Users, MessageSquare, Mail, Phone,
  Plus, Search, X, Filter, ChevronDown, Target, Zap,
  Clock, CheckCircle, AlertTriangle, TrendingUp, Eye,
  Play, Pause, Trash2, Copy, Sparkles, UserCheck,
  Building, MapPin, Calendar, RefreshCw, ArrowLeft,
  BarChart3, Bot, Flame, Timer, UserX, Heart, Bell,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignsSkeleton } from "@/components/skeletons/page-skeletons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { cn } from "@/lib/utils";
import { formatAdminDate } from "@/lib/formatters";
import { SarPrice } from "@/components/ui/sar-symbol";
import type { Lead } from "@shared/types";
import SendWhatsAppModal from "@/components/modals/send-whatsapp-modal";
import RuleBuilder from "./RuleBuilder";

// ── Types ──────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  title: string;
  message: string;
  type: string;
  leadIds: string[];
  status: string;
  sentAt: string;
  recipientCount: number;
  deliveredCount?: number;
  openedCount?: number;
  respondedCount?: number;
  /** Delivery rate 0-100% (E11). Source: calculated server-side. */
  deliveryRate?: number;
  /** Open rate 0-100% (E11). */
  openRate?: number;
  /** Response rate 0-100% (E11). */
  responseRate?: number;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  icon: typeof Zap;
  trigger: string;
  action: string;
  channel: string;
  enabled: boolean;
  matchCount: number;
  color: string;
}

// ── Campaign Form Schema ───────────────────────────────────────────────

const campaignSchema = z.object({
  title: z.string().min(1, "عنوان الحملة مطلوب"),
  message: z.string().min(1, "محتوى الرسالة مطلوب"),
  channel: z.string().min(1, "اختر قناة الإرسال"),
});

// ── Smart Suggestion Generator ─────────────────────────────────────────

function generateSuggestions(leads: Lead[]): {
  id: string;
  title: string;
  description: string;
  icon: typeof Zap;
  color: string;
  urgency: "high" | "medium" | "low";
  matchedLeads: Lead[];
  suggestedAction: string;
  channel: string;
}[] {
  const now = Date.now();
  const DAY = 86400000;

  // Cold leads — not contacted in 7+ days
  const coldLeads = leads.filter((l) => {
    if (l.status === "CLOSED" || l.status === "LOST") return false;
    const last = (l as any).lastContactAt ? new Date((l as any).lastContactAt).getTime() : new Date(l.createdAt).getTime();
    return now - last > 7 * DAY;
  });

  // New leads — created in last 48h, never contacted
  const newLeads = leads.filter((l) => {
    const created = new Date(l.createdAt).getTime();
    return now - created < 2 * DAY && !(l as any).lastContactAt && l.status === "NEW";
  });

  // Hot leads — status QUALIFIED or NEGOTIATING
  const hotLeads = leads.filter((l) =>
    ["QUALIFIED", "NEGOTIATING"].includes(l.status)
  );

  // Stale leads — status CONTACTED but no activity in 14+ days
  const staleLeads = leads.filter((l) => {
    if (l.status !== "CONTACTED") return false;
    const last = (l as any).lastContactAt ? new Date((l as any).lastContactAt).getTime() : new Date(l.createdAt).getTime();
    return now - last > 14 * DAY;
  });

  const suggestions = [];

  if (newLeads.length > 0) {
    suggestions.push({
      id: "new-leads",
      title: `${newLeads.length} عميل جديد بانتظار التواصل`,
      description: "عملاء سجّلوا خلال آخر 48 ساعة ولم يتم التواصل معهم. الاستجابة السريعة تزيد نسبة التحويل 3 أضعاف.",
      icon: Sparkles,
      color: "text-primary",
      urgency: "high" as const,
      matchedLeads: newLeads,
      suggestedAction: "أرسل رسالة ترحيب وعرّفهم بخدماتك",
      channel: "whatsapp",
    });
  }

  if (coldLeads.length > 0) {
    suggestions.push({
      id: "cold-leads",
      title: `${coldLeads.length} عميل لم يتم التواصل معه منذ أسبوع+`,
      description: "هؤلاء العملاء بحاجة لمتابعة قبل فقدان اهتمامهم. أرسل عروض عقارية جديدة أو تحديث أسعار.",
      icon: Timer,
      color: "text-[hsl(var(--warning))]",
      urgency: "high" as const,
      matchedLeads: coldLeads,
      suggestedAction: "أرسل تحديث عقاري أو عرض خاص",
      channel: "whatsapp",
    });
  }

  if (hotLeads.length > 0) {
    suggestions.push({
      id: "hot-leads",
      title: `${hotLeads.length} عميل مؤهل — فرصة إغلاق`,
      description: "عملاء في مرحلة متقدمة. تواصل شخصي لتسريع الإغلاق وحجز مواعيد معاينة.",
      icon: Flame,
      color: "text-destructive",
      urgency: "medium" as const,
      matchedLeads: hotLeads,
      suggestedAction: "اتصل مباشرة واحجز معاينة",
      channel: "call",
    });
  }

  if (staleLeads.length > 0) {
    suggestions.push({
      id: "stale-leads",
      title: `${staleLeads.length} عميل راكد — أعد التفاعل`,
      description: "تم التواصل سابقاً لكن لم يتم تحويلهم. أرسل محتوى قيّم أو عروض حصرية.",
      icon: UserX,
      color: "text-muted-foreground",
      urgency: "low" as const,
      matchedLeads: staleLeads,
      suggestedAction: "أرسل عروض حصرية أو تقرير سوق",
      channel: "sms",
    });
  }

  return suggestions;
}

// ── Default Automation Rules ───────────────────────────────────────────

function getAutomationRules(leads: Lead[]): AutomationRule[] {
  const now = Date.now();
  const DAY = 86400000;

  const coldCount = leads.filter((l) => {
    if (l.status === "CLOSED" || l.status === "LOST") return false;
    const last = (l as any).lastContactAt ? new Date((l as any).lastContactAt).getTime() : new Date(l.createdAt).getTime();
    return now - last > 7 * DAY;
  }).length;

  const newCount = leads.filter((l) => {
    const created = new Date(l.createdAt).getTime();
    return now - created < 2 * DAY && !(l as any).lastContactAt;
  }).length;

  return [
    {
      id: "welcome",
      name: "ترحيب العملاء الجدد",
      description: "عند إضافة عميل جديد، أرسل رسالة ترحيب تلقائية خلال ساعة",
      icon: Heart,
      trigger: "عميل جديد مضاف",
      action: "إرسال رسالة ترحيب",
      channel: "واتساب",
      enabled: true,
      matchCount: newCount,
      color: "text-primary",
    },
    {
      id: "cold-followup",
      name: "متابعة العملاء الخاملين",
      description: "إذا لم يتم التواصل مع العميل خلال 7 أيام، أرسل تذكير تلقائي",
      icon: Timer,
      trigger: "7 أيام بدون تواصل",
      action: "إرسال تذكير متابعة",
      channel: "واتساب",
      enabled: true,
      matchCount: coldCount,
      color: "text-[hsl(var(--warning))]",
    },
    {
      id: "listing-match",
      name: "تطابق عقار مع طلب عميل",
      description: "عند إضافة عقار جديد يطابق رغبات عميل، أرسل إشعار فوري",
      icon: Target,
      trigger: "عقار جديد يطابق الرغبات",
      action: "إرسال تفاصيل العقار",
      channel: "واتساب",
      enabled: false,
      matchCount: 0,
      color: "text-primary",
    },
    {
      id: "appointment-reminder",
      name: "تذكير قبل الموعد",
      description: "أرسل تذكير قبل 24 ساعة من موعد المعاينة",
      icon: Calendar,
      trigger: "24 ساعة قبل الموعد",
      action: "إرسال تذكير بالموعد",
      channel: "رسالة نصية",
      enabled: true,
      matchCount: 0,
      color: "text-primary",
    },
    {
      id: "price-drop",
      name: "إشعار تخفيض السعر",
      description: "عند تخفيض سعر عقار، أبلغ العملاء المهتمين بنفس المنطقة",
      icon: TrendingUp,
      trigger: "تخفيض سعر عقار",
      action: "إرسال إشعار تخفيض",
      channel: "واتساب",
      enabled: false,
      matchCount: 0,
      color: "text-destructive",
    },
    {
      id: "deal-stale",
      name: "صفقة راكدة",
      description: "إذا لم تتحرك صفقة خلال 14 يوم، أرسل تنبيه للوسيط",
      icon: AlertTriangle,
      trigger: "14 يوم بدون تحديث",
      action: "تنبيه الوسيط",
      channel: "إشعار داخلي",
      enabled: true,
      matchCount: 0,
      color: "text-[hsl(var(--warning))]",
    },
  ];
}

// ── Message Templates ──────────────────────────────────────────────────

const MESSAGE_TEMPLATES = [
  {
    id: "welcome",
    name: "ترحيب بعميل جديد",
    channel: "whatsapp",
    message: "أهلاً وسهلاً {name}! 🏠\n\nشكراً لتواصلك معنا. أنا {agent} وسيط عقاري معتمد من الهيئة العامة للعقار.\n\nكيف يمكنني مساعدتك في البحث عن عقارك المثالي؟",
  },
  {
    id: "followup",
    name: "متابعة عميل",
    channel: "whatsapp",
    message: "مرحباً {name}،\n\nأتمنى أنك بخير. أحببت التواصل معك بخصوص اهتمامك العقاري. لدينا عروض جديدة قد تناسب متطلباتك.\n\nهل يناسبك وقت للاطلاع عليها؟",
  },
  {
    id: "viewing",
    name: "دعوة معاينة",
    channel: "whatsapp",
    message: "مرحباً {name}،\n\nيسعدنا دعوتك لمعاينة عقار مميز في {city}:\n\n🏠 {property}\n📍 {location}\n💰 {price}\n\nمتى يناسبك الموعد؟",
  },
  {
    id: "price-update",
    name: "تحديث أسعار",
    channel: "sms",
    message: "تحديث عقاري: تخفيض أسعار في منطقة {area}. عروض تبدأ من {price}. للتفاصيل تواصل معنا.",
  },
  {
    id: "market-report",
    name: "تقرير سوق",
    channel: "email",
    message: "مرحباً {name}،\n\nنشارك معك تقريرنا الشهري لسوق {city} العقاري:\n\n• متوسط الأسعار: {avgPrice}\n• أبرز الأحياء الصاعدة: {districts}\n• فرص استثمارية: {opportunities}\n\nللاستفسار لا تتردد في التواصل.",
  },
];

// ── Quick Segment Actions ──────────────────────────────────────────────

interface QuickSegment {
  id: string;
  name: string;
  icon: typeof Users;
  filter: (lead: Lead) => boolean;
  color: string;
  action: string;
}

function getQuickSegments(): QuickSegment[] {
  return [
    {
      id: "all-active",
      name: "كل العملاء النشطين",
      icon: Users,
      filter: (l) => !["CLOSED", "LOST"].includes(l.status),
      color: "bg-primary/10 text-primary",
      action: "حملة جماعية",
    },
    {
      id: "buyers",
      name: "الباحثين عن شراء",
      icon: Building,
      filter: (l) => l.interestType === "BUY" || l.interestType === "شراء",
      color: "bg-primary/10 text-primary",
      action: "عروض عقارية",
    },
    {
      id: "renters",
      name: "الباحثين عن إيجار",
      icon: Building,
      filter: (l) => l.interestType === "RENT" || l.interestType === "إيجار",
      color: "bg-accent text-accent-foreground",
      action: "عروض إيجار",
    },
    {
      id: "riyadh",
      name: "عملاء الرياض",
      icon: MapPin,
      filter: (l) => l.city === "الرياض" || l.city === "Riyadh",
      color: "bg-primary/10 text-primary",
      action: "عروض الرياض",
    },
    {
      id: "jeddah",
      name: "عملاء جدة",
      icon: MapPin,
      filter: (l) => l.city === "جدة" || l.city === "Jeddah",
      color: "bg-primary/10 text-primary",
      action: "عروض جدة",
    },
    {
      id: "high-budget",
      name: "ميزانية عالية",
      icon: TrendingUp,
      filter: (l) => (l.budget ?? 0) >= 2000000,
      color: "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]",
      action: "عروض فاخرة",
    },
  ];
}

// ── Main Component ─────────────────────────────────────────────────────

export default function CampaignManagement() {
  const { toast } = useToast();
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappLead, setWhatsappLead] = useState<Lead | null>(null);
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>({});

  // Queries
  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: () => apiGet<Campaign[]>("api/campaigns"),
  });

  const { data: dbRules } = useQuery<any[]>({
    queryKey: ["/api/campaigns/rules"],
    queryFn: () => apiGet<any[]>("api/campaigns/rules"),
  });

  const isLoading = leadsLoading || campaignsLoading;

  // Campaign form
  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { title: "", message: "", channel: "whatsapp" },
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => apiPost("api/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setCreateOpen(false);
      setSelectedLeads([]);
      form.reset();
      toast({ title: "تم إرسال الحملة بنجاح", description: `تم إرسال الرسالة إلى ${selectedLeads.length} عميل` });
    },
    onError: () => toast({ title: "خطأ", description: "فشل إرسال الحملة", variant: "destructive" }),
  });

  // Computed
  const allLeads = leads ?? [];
  const allCampaigns = campaigns ?? [];

  const suggestions = useMemo(() => generateSuggestions(allLeads), [allLeads]);
  const automationRules = useMemo(() => getAutomationRules(allLeads), [allLeads]);
  const quickSegments = useMemo(() => getQuickSegments(), []);

  // Apply audience filter
  const filteredLeads = useMemo(() => {
    let items = allLeads;
    if (audienceFilter !== "all") {
      const segment = quickSegments.find((s) => s.id === audienceFilter);
      if (segment) items = items.filter(segment.filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((l) =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
        (l.phone || "").includes(q) ||
        (l.email || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [allLeads, audienceFilter, searchQuery, quickSegments]);

  // Stats
  const stats = useMemo(() => ({
    totalCampaigns: allCampaigns.length,
    totalReached: allCampaigns.reduce((sum, c) => sum + c.recipientCount, 0),
    activeLeads: allLeads.filter((l) => !["CLOSED", "LOST"].includes(l.status)).length,
    urgentActions: suggestions.filter((s) => s.urgency === "high").reduce((sum, s) => sum + s.matchedLeads.length, 0),
  }), [allCampaigns, allLeads, suggestions]);

  // Handlers
  const toggleLead = (id: string) => {
    setSelectedLeads((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectSegment = (segmentId: string) => {
    const segment = quickSegments.find((s) => s.id === segmentId);
    if (!segment) return;
    const matched = allLeads.filter(segment.filter).map((l) => l.id);
    setSelectedLeads(matched);
    setAudienceFilter(segmentId);
    setCreateOpen(true);
  };

  const launchSuggestion = (suggestion: ReturnType<typeof generateSuggestions>[0]) => {
    setSelectedLeads(suggestion.matchedLeads.map((l) => l.id));
    form.setValue("channel", suggestion.channel === "call" ? "whatsapp" : suggestion.channel);
    setCreateOpen(true);
  };

  const applyTemplate = (templateId: string) => {
    const tpl = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      form.setValue("message", tpl.message);
      form.setValue("channel", tpl.channel);
      setSelectedTemplate(templateId);
    }
  };

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      apiPatch(`api/campaigns/rules/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/rules"] });
      toast({ title: "تم تحديث القاعدة" });
    },
  });

  const seedRuleMutation = useMutation({
    mutationFn: (rule: any) => apiPost("api/campaigns/rules", rule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/campaigns/rules"] }),
  });

  const toggleRule = (ruleId: string) => {
    const dbRule = (dbRules || []).find((r: any) => r.triggerType === ruleId);
    if (dbRule) {
      toggleRuleMutation.mutate({ id: dbRule.id, enabled: !dbRule.enabled });
    } else {
      const defaultRule = automationRules.find((r) => r.id === ruleId);
      if (defaultRule) {
        seedRuleMutation.mutate({
          name: defaultRule.name,
          description: defaultRule.description,
          triggerType: ruleId,
          actionType: "send_message",
          channel: defaultRule.channel === "واتساب" ? "whatsapp" : defaultRule.channel === "رسالة نصية" ? "sms" : "internal",
          enabled: !defaultRule.enabled,
        });
      }
    }
    setRuleStates((prev) => ({ ...prev, [ruleId]: !(prev[ruleId] ?? automationRules.find((r) => r.id === ruleId)?.enabled) }));
  };

  const handleSendCampaign = (data: z.infer<typeof campaignSchema>) => {
    if (selectedLeads.length === 0) {
      toast({ title: "خطأ", description: "اختر عملاء أولاً", variant: "destructive" });
      return;
    }
    sendMutation.mutate({
      title: data.title,
      message: data.message,
      type: data.channel,
      leadIds: selectedLeads,
    });
  };

  const channelIcon = (ch: string) => {
    if (ch === "whatsapp" || ch === "واتساب") return <MessageSquare size={14} className="text-[#25D366]" />;
    if (ch === "sms" || ch === "رسالة نصية") return <Phone size={14} className="text-primary" />;
    return <Mail size={14} className="text-primary" />;
  };

  // ── Render ──────────────────────────────────────────────────────────

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="إدارة الحملات" subtitle="محرك التواصل الذكي مع العملاء" />
        <CampaignsSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="إدارة الحملات" subtitle="محرك التواصل الذكي مع العملاء — قواعد أتمتة، شرائح جمهور، وقوالب جاهزة">
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          حملة جديدة
        </Button>
      </PageHeader>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Megaphone, value: stats.totalCampaigns, label: "حملة مرسلة", color: "text-primary", bg: "bg-primary/10" },
          { icon: Users, value: stats.totalReached, label: "عميل تم الوصول إليه", color: "text-primary", bg: "bg-primary/10" },
          { icon: UserCheck, value: stats.activeLeads, label: "عميل نشط", color: "text-primary", bg: "bg-accent" },
          { icon: AlertTriangle, value: stats.urgentActions, label: "يحتاج تواصل عاجل", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.1)]" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                <s.icon size={20} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dashboard" className="gap-1.5"><Sparkles size={14} />الذكاء</TabsTrigger>
          <TabsTrigger value="segments" className="gap-1.5"><Target size={14} />الشرائح</TabsTrigger>
          <TabsTrigger value="automation" className="gap-1.5"><Bot size={14} />الأتمتة</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><Copy size={14} />القوالب</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><BarChart3 size={14} />السجل</TabsTrigger>
        </TabsList>

        {/* ══════════════ TAB: Smart Dashboard ══════════════ */}
        <TabsContent value="dashboard" className="space-y-4">
          {suggestions.length === 0 ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8 text-center">
                <CheckCircle size={40} className="mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-bold">ممتاز! لا توجد إجراءات عاجلة</h3>
                <p className="text-sm text-muted-foreground mt-1">كل عملائك محدّثون. استمر بالأداء الرائع.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={18} className="text-primary" />
                <h3 className="font-bold">إجراءات مقترحة — بناءً على بيانات عملائك</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {suggestions.map((s) => (
                  <Card key={s.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                          s.urgency === "high" ? "bg-destructive/10" : s.urgency === "medium" ? "bg-[hsl(var(--warning)/0.1)]" : "bg-muted"
                        )}>
                          <s.icon size={20} className={s.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-sm">{s.title}</h4>
                            {s.urgency === "high" && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">عاجل</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {channelIcon(s.channel)}
                          <span>{s.suggestedAction}</span>
                        </div>
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => launchSuggestion(s)}>
                          <Send size={12} />
                          تنفيذ ({s.matchedLeads.length})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Quick segment buttons */}
          <div className="pt-2">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
              <Target size={16} className="text-primary" />
              إطلاق حملة سريعة حسب الشريحة
            </h3>
            <div className="flex flex-wrap gap-2">
              {quickSegments.map((seg) => {
                const count = allLeads.filter(seg.filter).length;
                return (
                  <Button
                    key={seg.id}
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 rounded-full"
                    onClick={() => selectSegment(seg.id)}
                    disabled={count === 0}
                  >
                    <seg.icon size={14} />
                    {seg.name}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ms-1">{count}</Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ══════════════ TAB: Audience Segments ══════════════ */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {quickSegments.map((seg) => {
              const matched = allLeads.filter(seg.filter);
              return (
                <Card key={seg.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => selectSegment(seg.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", seg.color)}>
                          <seg.icon size={18} />
                        </div>
                        <h4 className="font-bold text-sm">{seg.name}</h4>
                      </div>
                      <span className="text-2xl font-black tabular-nums">{matched.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {matched.slice(0, 3).map((l) => (
                        <Badge key={l.id} variant="outline" className="text-[10px]">
                          {l.firstName} {l.lastName}
                        </Badge>
                      ))}
                      {matched.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">+{matched.length - 3}</Badge>
                      )}
                    </div>
                    <Button size="sm" className="w-full mt-3 gap-1.5 h-8" disabled={matched.length === 0}>
                      <Send size={12} />
                      {seg.action}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ══════════════ TAB: Automation Rules (Visual Builder) ══════════════ */}
        <TabsContent value="automation" className="space-y-4">
          <RuleBuilder leads={allLeads} />
        </TabsContent>

        {/* ══════════════ TAB: Templates ══════════════ */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold flex items-center gap-1.5"><Copy size={18} className="text-primary" />قوالب الرسائل</h3>
              <p className="text-xs text-muted-foreground">قوالب جاهزة للتواصل السريع مع العملاء</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {MESSAGE_TEMPLATES.map((tpl) => (
              <Card key={tpl.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">{tpl.name}</h4>
                    <div className="flex items-center gap-1.5">
                      {channelIcon(tpl.channel)}
                      <span className="text-xs text-muted-foreground">{tpl.channel === "whatsapp" ? "واتساب" : tpl.channel === "sms" ? "رسالة نصية" : "بريد"}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-line max-h-32 overflow-hidden">
                    {tpl.message}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="flex-1 gap-1.5 h-8" onClick={() => { applyTemplate(tpl.id); setCreateOpen(true); }}>
                      <Send size={12} />
                      استخدم القالب
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => {
                      navigator.clipboard.writeText(tpl.message);
                      toast({ title: "تم النسخ" });
                    }}>
                      <Copy size={12} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ══════════════ TAB: Campaign History ══════════════ */}
        <TabsContent value="history" className="space-y-4">
          {allCampaigns.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="لا توجد حملات سابقة"
              description="عند إرسال أول حملة ستظهر هنا مع إحصائيات التسليم والاستجابة"
            />
          ) : (
            <div className="space-y-3">
              {allCampaigns.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          {channelIcon(c.type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{c.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">{c.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="text-center">
                          <p className="font-bold tabular-nums">{c.recipientCount}</p>
                          <p className="text-[10px] text-muted-foreground">مستلم</p>
                        </div>
                        {/* Performance rates (E11) */}
                        {c.deliveryRate != null && (
                          <div className="text-center">
                            <p className="font-bold tabular-nums text-primary">{c.deliveryRate}%</p>
                            <p className="text-[10px] text-muted-foreground">تسليم</p>
                          </div>
                        )}
                        {c.openRate != null && c.openRate > 0 && (
                          <div className="text-center">
                            <p className="font-bold tabular-nums">{c.openRate}%</p>
                            <p className="text-[10px] text-muted-foreground">فتح</p>
                          </div>
                        )}
                        {c.responseRate != null && c.responseRate > 0 && (
                          <div className="text-center">
                            <p className="font-bold tabular-nums">{c.responseRate}%</p>
                            <p className="text-[10px] text-muted-foreground">رد</p>
                          </div>
                        )}
                        <Badge variant={c.status === "sent" || c.status === "SENT" ? "default" : "outline"}>
                          {c.status === "sent" || c.status === "SENT" ? "مرسلة" : c.status === "COMPLETED" ? "مكتملة" : c.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.sentAt), { addSuffix: true, locale: ar })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Create Campaign Sheet ── */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Megaphone size={20} />
              إنشاء حملة جديدة
            </SheetTitle>
            <SheetDescription>
              اختر الجمهور، القناة، واكتب رسالتك — أو استخدم قالب جاهز
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 max-w-4xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSendCampaign)} className="space-y-6">

                {/* Step 1: Audience */}
                <div>
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    الجمهور المستهدف
                    <Badge variant="secondary" className="ms-auto">{selectedLeads.length} محدد</Badge>
                  </h4>

                  {/* Segment chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Button type="button" size="sm" variant={audienceFilter === "all" ? "default" : "outline"} className="h-7 text-xs rounded-full" onClick={() => setAudienceFilter("all")}>
                      الكل ({allLeads.length})
                    </Button>
                    {quickSegments.map((seg) => {
                      const count = allLeads.filter(seg.filter).length;
                      return (
                        <Button
                          key={seg.id}
                          type="button"
                          size="sm"
                          variant={audienceFilter === seg.id ? "default" : "outline"}
                          className="h-7 text-xs rounded-full"
                          onClick={() => {
                            setAudienceFilter(seg.id);
                            const matched = allLeads.filter(seg.filter).map((l) => l.id);
                            setSelectedLeads(matched);
                          }}
                        >
                          {seg.name} ({count})
                        </Button>
                      );
                    })}
                  </div>

                  {/* Search */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="ابحث بالاسم أو الرقم..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ps-9"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      if (selectedLeads.length === filteredLeads.length) setSelectedLeads([]);
                      else setSelectedLeads(filteredLeads.map((l) => l.id));
                    }}>
                      {selectedLeads.length === filteredLeads.length ? "إلغاء الكل" : "تحديد الكل"}
                    </Button>
                  </div>

                  {/* Lead list */}
                  <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                    {filteredLeads.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">لا يوجد عملاء في هذه الشريحة</div>
                    ) : (
                      filteredLeads.map((lead) => (
                        <label key={lead.id} className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer">
                          <Checkbox
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={() => toggleLead(lead.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{lead.firstName} {lead.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {lead.phone || lead.email || "بدون وسيلة تواصل"}
                              {lead.city ? ` · ${lead.city}` : ""}
                              {lead.interestType ? ` · ${lead.interestType}` : ""}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {lead.status === "NEW" ? "جديد" : lead.status === "CONTACTED" ? "تم التواصل" : lead.status === "QUALIFIED" ? "مؤهل" : lead.status}
                          </Badge>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <Separator />

                {/* Step 2: Channel + Message */}
                <div>
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                    الرسالة والقناة
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                    <div className="space-y-4">
                      <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان الحملة</FormLabel>
                          <FormControl><Input placeholder="مثال: عروض الرياض الأسبوعية" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="channel" render={({ field }) => (
                        <FormItem>
                          <FormLabel>قناة الإرسال</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: "whatsapp", label: "واتساب", icon: MessageSquare, color: "text-[#25D366]" },
                              { value: "sms", label: "رسالة نصية", icon: Phone, color: "text-primary" },
                              { value: "email", label: "بريد إلكتروني", icon: Mail, color: "text-primary" },
                            ].map((ch) => (
                              <Button
                                key={ch.value}
                                type="button"
                                variant={field.value === ch.value ? "default" : "outline"}
                                className="h-auto py-3 flex-col gap-1"
                                onClick={() => field.onChange(ch.value)}
                              >
                                <ch.icon size={18} className={field.value === ch.value ? "" : ch.color} />
                                <span className="text-xs">{ch.label}</span>
                              </Button>
                            ))}
                          </div>
                        </FormItem>
                      )} />

                      {/* Quick templates */}
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-2">قالب سريع</p>
                        <div className="space-y-1">
                          {MESSAGE_TEMPLATES.slice(0, 3).map((tpl) => (
                            <Button
                              key={tpl.id}
                              type="button"
                              variant={selectedTemplate === tpl.id ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start h-8 text-xs"
                              onClick={() => applyTemplate(tpl.id)}
                            >
                              {tpl.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel>محتوى الرسالة</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={10}
                            placeholder="اكتب رسالتك هنا... يمكنك استخدام {name} لاسم العميل و {city} للمدينة"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">{(field.value || "").length} حرف · المتغيرات: {"{name}"}, {"{city}"}, {"{property}"}, {"{price}"}</p>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Actions */}
                <SheetFooter className="pt-4 border-t">
                  <div className="flex items-center gap-3 w-full">
                    <Button type="submit" disabled={sendMutation.isPending || selectedLeads.length === 0} className="gap-2 flex-1 md:flex-none">
                      <Send size={16} />
                      {sendMutation.isPending ? "جاري الإرسال..." : `إرسال إلى ${selectedLeads.length} عميل`}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); form.reset(); setSelectedLeads([]); setSelectedTemplate(null); }}>
                      إلغاء
                    </Button>
                  </div>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* WhatsApp Modal */}
      {whatsappLead && (
        <SendWhatsAppModal
          open={whatsappModalOpen}
          onOpenChange={setWhatsappModalOpen}
          leadId={whatsappLead.id}
          phoneNumber={whatsappLead.phone || ""}
          leadName={`${whatsappLead.firstName} ${whatsappLead.lastName}`}
        />
      )}
    </div>
  );
}
