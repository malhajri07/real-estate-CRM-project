/**
 * RuleBuilder.tsx — Visual rule engine for campaign automation
 *
 * Agent builds rules by combining filter conditions + action + channel.
 * Conditions: status, days since contact, city, interest type, budget, source, etc.
 * Actions: send WhatsApp, SMS, email, or internal alert
 * Shows real-time matched leads count as conditions change.
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot, Plus, Trash2, Send, Zap, Save, X, Users, Filter,
  MessageSquare, Phone, Mail, Bell, ChevronDown, CheckCircle,
  Play, Pause, Clock, AlertTriangle, MapPin, Building,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import type { Lead } from "@shared/types";

// ── Condition Definitions ──────────────────────────────────────────────

interface ConditionDef {
  id: string;
  label: string;
  icon: typeof Users;
  type: "select" | "number" | "text";
  options?: { value: string; label: string }[];
  placeholder?: string;
  unit?: string;
}

const CONDITION_DEFS: ConditionDef[] = [
  {
    id: "status",
    label: "حالة العميل",
    icon: Filter,
    type: "select",
    options: [
      { value: "NEW", label: "جديد" },
      { value: "CONTACTED", label: "تم التواصل" },
      { value: "QUALIFIED", label: "مؤهل" },
      { value: "NEGOTIATING", label: "قيد التفاوض" },
      { value: "IN_PROGRESS", label: "قيد المعالجة" },
      { value: "WON", label: "مكتسب" },
      { value: "LOST", label: "خسارة" },
    ],
  },
  {
    id: "days_no_contact",
    label: "أيام بدون تواصل",
    icon: Clock,
    type: "number",
    placeholder: "7",
    unit: "يوم",
  },
  {
    id: "days_since_created",
    label: "أيام منذ الإضافة",
    icon: Clock,
    type: "number",
    placeholder: "3",
    unit: "يوم",
  },
  {
    id: "city",
    label: "المدينة",
    icon: MapPin,
    type: "select",
    options: [
      { value: "الرياض", label: "الرياض" },
      { value: "جدة", label: "جدة" },
      { value: "مكة المكرمة", label: "مكة المكرمة" },
      { value: "المدينة المنورة", label: "المدينة المنورة" },
      { value: "الدمام", label: "الدمام" },
      { value: "الخبر", label: "الخبر" },
      { value: "الطائف", label: "الطائف" },
      { value: "تبوك", label: "تبوك" },
      { value: "أبها", label: "أبها" },
    ],
  },
  {
    id: "interest_type",
    label: "نوع الاهتمام",
    icon: Building,
    type: "select",
    options: [
      { value: "BUY", label: "شراء" },
      { value: "RENT", label: "إيجار" },
      { value: "INVEST", label: "استثمار" },
      { value: "شراء", label: "شراء" },
      { value: "إيجار", label: "إيجار" },
    ],
  },
  {
    id: "budget_min",
    label: "الميزانية (أكثر من)",
    icon: TrendingUp,
    type: "number",
    placeholder: "500000",
    unit: "ر.س",
  },
  {
    id: "budget_max",
    label: "الميزانية (أقل من)",
    icon: TrendingUp,
    type: "number",
    placeholder: "2000000",
    unit: "ر.س",
  },
  {
    id: "source",
    label: "مصدر العميل",
    icon: Users,
    type: "select",
    options: [
      { value: "WEBSITE", label: "الموقع" },
      { value: "REFERRAL", label: "إحالة" },
      { value: "SOCIAL_MEDIA", label: "وسائل التواصل" },
      { value: "WALK_IN", label: "زيارة مباشرة" },
      { value: "PHONE", label: "اتصال" },
      { value: "BROKER", label: "وسيط" },
    ],
  },
  {
    id: "has_phone",
    label: "لديه رقم جوال",
    icon: Phone,
    type: "select",
    options: [
      { value: "yes", label: "نعم" },
      { value: "no", label: "لا" },
    ],
  },
  {
    id: "has_email",
    label: "لديه بريد إلكتروني",
    icon: Mail,
    type: "select",
    options: [
      { value: "yes", label: "نعم" },
      { value: "no", label: "لا" },
    ],
  },
];

// ── Condition Matching Logic ───────────────────────────────────────────

interface RuleCondition {
  conditionId: string;
  value: string;
}

function matchesCondition(lead: Lead, condition: RuleCondition): boolean {
  const { conditionId, value } = condition;
  if (!value) return true;

  const now = Date.now();
  const DAY = 86400000;

  switch (conditionId) {
    case "status":
      return lead.status === value;
    case "days_no_contact": {
      const last = (lead as any).lastContactAt
        ? new Date((lead as any).lastContactAt).getTime()
        : new Date(lead.createdAt).getTime();
      return (now - last) > Number(value) * DAY;
    }
    case "days_since_created": {
      const created = new Date(lead.createdAt).getTime();
      return (now - created) > Number(value) * DAY;
    }
    case "city":
      return lead.city === value;
    case "interest_type":
      return lead.interestType === value;
    case "budget_min":
      return (lead.budget ?? 0) >= Number(value);
    case "budget_max":
      return (lead.budget ?? 0) <= Number(value);
    case "source":
      return lead.source === value || (lead as any).leadSource === value;
    case "has_phone":
      return value === "yes" ? !!lead.phone : !lead.phone;
    case "has_email":
      return value === "yes" ? !!lead.email : !lead.email;
    default:
      return true;
  }
}

function matchAllConditions(lead: Lead, conditions: RuleCondition[]): boolean {
  return conditions.every((c) => matchesCondition(lead, c));
}

// ── Types ──────────────────────────────────────────────────────────────

interface DBRule {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig?: string;
  actionType: string;
  actionConfig?: string;
  channel: string;
  enabled: boolean;
  triggerCount: number;
  lastTriggeredAt?: string;
}

// ── Component ──────────────────────────────────────────────────────────

interface Props {
  leads: Lead[];
}

export default function RuleBuilder({ leads }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DBRule | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [actionChannel, setActionChannel] = useState("whatsapp");
  const [actionMessage, setActionMessage] = useState("");
  const [ruleEnabled, setRuleEnabled] = useState(true);

  // Query saved rules
  const { data: dbRules } = useQuery<DBRule[]>({
    queryKey: ["/api/campaigns/rules"],
    queryFn: () => apiGet<DBRule[]>("api/campaigns/rules"),
  });

  const savedRules = dbRules ?? [];

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: (data: any) => apiPost("api/campaigns/rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/rules"] });
      resetBuilder();
      toast({ title: "تم إنشاء القاعدة بنجاح" });
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiPatch(`api/campaigns/rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/rules"] });
      resetBuilder();
      toast({ title: "تم تحديث القاعدة" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`api/campaigns/rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/rules"] });
      toast({ title: "تم حذف القاعدة" });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      apiPatch(`api/campaigns/rules/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/rules"] });
    },
  });

  // Real-time matched leads
  const matchedLeads = useMemo(() => {
    if (conditions.length === 0) return [];
    return leads.filter((l) => matchAllConditions(l, conditions));
  }, [leads, conditions]);

  // Helpers
  const resetBuilder = () => {
    setBuilderOpen(false);
    setEditingRule(null);
    setRuleName("");
    setRuleDescription("");
    setConditions([]);
    setActionChannel("whatsapp");
    setActionMessage("");
    setRuleEnabled(true);
  };

  const openEditor = (rule?: DBRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleName(rule.name);
      setRuleDescription(rule.description || "");
      setActionChannel(rule.channel);
      setRuleEnabled(rule.enabled);
      try {
        const config = rule.triggerConfig ? JSON.parse(rule.triggerConfig) : {};
        setConditions(config.conditions || []);
        setActionMessage(config.message || "");
      } catch {
        setConditions([]);
        setActionMessage("");
      }
    } else {
      resetBuilder();
    }
    setBuilderOpen(true);
  };

  const addCondition = () => {
    // Find first condition not yet used
    const usedIds = conditions.map((c) => c.conditionId);
    const available = CONDITION_DEFS.find((d) => !usedIds.includes(d.id));
    if (available) {
      setConditions([...conditions, { conditionId: available.id, value: "" }]);
    }
  };

  const updateCondition = (index: number, field: "conditionId" | "value", val: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: val };
    if (field === "conditionId") updated[index].value = "";
    setConditions(updated);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!ruleName.trim()) {
      toast({ title: "أدخل اسم القاعدة", variant: "destructive" });
      return;
    }
    if (conditions.length === 0) {
      toast({ title: "أضف شرط واحد على الأقل", variant: "destructive" });
      return;
    }

    const payload = {
      name: ruleName,
      description: ruleDescription,
      triggerType: "custom_filter",
      triggerConfig: JSON.stringify({ conditions, message: actionMessage }),
      actionType: "send_message",
      actionConfig: JSON.stringify({ message: actionMessage }),
      channel: actionChannel,
      enabled: ruleEnabled,
    };

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, ...payload });
    } else {
      createRuleMutation.mutate(payload);
    }
  };

  // Parse saved rule conditions for display
  const getRuleConditions = (rule: DBRule): RuleCondition[] => {
    try {
      const config = rule.triggerConfig ? JSON.parse(rule.triggerConfig) : {};
      return config.conditions || [];
    } catch {
      return [];
    }
  };

  const getRuleMatchCount = (rule: DBRule): number => {
    const conds = getRuleConditions(rule);
    if (conds.length === 0) return 0;
    return leads.filter((l) => matchAllConditions(l, conds)).length;
  };

  const getConditionLabel = (condId: string, value: string): string => {
    const def = CONDITION_DEFS.find((d) => d.id === condId);
    if (!def) return `${condId}: ${value}`;
    const option = def.options?.find((o) => o.value === value);
    const displayVal = option ? option.label : `${value}${def.unit ? ` ${def.unit}` : ""}`;
    return `${def.label}: ${displayVal}`;
  };

  const channelIcon = (ch: string) => {
    if (ch === "whatsapp") return <MessageSquare size={14} className="text-[#25D366]" />;
    if (ch === "sms") return <Phone size={14} className="text-primary" />;
    if (ch === "email") return <Mail size={14} className="text-primary" />;
    return <Bell size={14} className="text-primary" />;
  };

  const channelLabel = (ch: string) => {
    if (ch === "whatsapp") return "واتساب";
    if (ch === "sms") return "رسالة نصية";
    if (ch === "email") return "بريد إلكتروني";
    return "إشعار داخلي";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold flex items-center gap-1.5"><Bot size={18} className="text-primary" />قواعد الأتمتة</h3>
          <p className="text-xs text-muted-foreground">أنشئ قواعد مخصصة بشروط وفلاتر تختارها — النظام يطبقها تلقائياً</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => openEditor()}>
          <Plus size={14} />
          قاعدة جديدة
        </Button>
      </div>

      {/* Saved Rules */}
      {savedRules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Bot size={36} className="mx-auto mb-3 text-muted-foreground opacity-50" />
            <h4 className="font-bold mb-1">لا توجد قواعد بعد</h4>
            <p className="text-sm text-muted-foreground mb-4">أنشئ أول قاعدة أتمتة لمتابعة عملائك تلقائياً</p>
            <Button size="sm" className="gap-1.5" onClick={() => openEditor()}>
              <Plus size={14} />
              إنشاء قاعدة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedRules.map((rule) => {
            const conds = getRuleConditions(rule);
            const matchCount = getRuleMatchCount(rule);
            return (
              <Card key={rule.id} className={cn(!rule.enabled && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      rule.enabled ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Zap size={18} className={rule.enabled ? "text-primary" : "text-muted-foreground"} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm">{rule.name}</h4>
                        {matchCount > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-primary/30 text-primary">
                            <Users size={10} />
                            {matchCount} مطابق الآن
                          </Badge>
                        )}
                      </div>

                      {rule.description && (
                        <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>
                      )}

                      {/* Condition pills */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {conds.map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-[11px] gap-1 font-normal">
                            <Filter size={10} />
                            {getConditionLabel(c.conditionId, c.value)}
                          </Badge>
                        ))}
                        <Badge variant="outline" className="text-[11px] gap-1 font-normal">
                          {channelIcon(rule.channel)}
                          {channelLabel(rule.channel)}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {rule.triggerCount > 0 && (
                          <span className="flex items-center gap-1"><Send size={10} />نُفّذت {rule.triggerCount} مرة</span>
                        )}
                        {rule.lastTriggeredAt && (
                          <span className="flex items-center gap-1"><Clock size={10} />آخر تنفيذ: {new Date(rule.lastTriggeredAt).toLocaleDateString("ar-SA")}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEditor(rule)}
                      >
                        <Filter size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => toggleRuleMutation.mutate({ id: rule.id, enabled })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Rule Builder Sheet ── */}
      <Sheet open={builderOpen} onOpenChange={setBuilderOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Zap size={20} />
              {editingRule ? "تعديل القاعدة" : "إنشاء قاعدة جديدة"}
            </SheetTitle>
            <SheetDescription>
              حدد الشروط والفلاتر — النظام يطبقها تلقائياً على عملائك
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 max-w-3xl mx-auto space-y-6">
            {/* Rule Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold mb-1.5 block">اسم القاعدة *</label>
                <Input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="مثال: متابعة عملاء الرياض الجدد"
                />
              </div>
              <div>
                <label className="text-sm font-bold mb-1.5 block">وصف (اختياري)</label>
                <Input
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="وصف مختصر لهذه القاعدة..."
                />
              </div>
            </div>

            <Separator />

            {/* Conditions Builder */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  الشروط والفلاتر
                </h4>
                <div className="flex items-center gap-2">
                  {matchedLeads.length > 0 && (
                    <Badge className="gap-1">
                      <Users size={12} />
                      {matchedLeads.length} عميل مطابق
                    </Badge>
                  )}
                  {conditions.length > 0 && matchedLeads.length === 0 && (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <AlertTriangle size={12} />
                      لا يوجد مطابق
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {conditions.map((cond, i) => {
                  const def = CONDITION_DEFS.find((d) => d.id === cond.conditionId);
                  const usedIds = conditions.map((c, ci) => ci !== i ? c.conditionId : "").filter(Boolean);
                  const availableDefs = CONDITION_DEFS.filter((d) => !usedIds.includes(d.id) || d.id === cond.conditionId);

                  return (
                    <div key={i} className="flex items-center gap-2">
                      {/* "AND" connector */}
                      {i > 0 && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">و</Badge>
                      )}
                      {i === 0 && <div className="w-6" />}

                      {/* Condition selector */}
                      <Select value={cond.conditionId} onValueChange={(v) => updateCondition(i, "conditionId", v)}>
                        <SelectTrigger className="w-48 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDefs.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              <span className="flex items-center gap-1.5">
                                <d.icon size={14} />
                                {d.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value input */}
                      {def?.type === "select" ? (
                        <Select value={cond.value} onValueChange={(v) => updateCondition(i, "value", v)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="اختر..." />
                          </SelectTrigger>
                          <SelectContent>
                            {def.options?.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-1">
                          <Input
                            type="number"
                            value={cond.value}
                            onChange={(e) => updateCondition(i, "value", e.target.value)}
                            placeholder={def?.placeholder}
                            className="flex-1"
                          />
                          {def?.unit && <span className="text-xs text-muted-foreground shrink-0">{def.unit}</span>}
                        </div>
                      )}

                      {/* Remove */}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeCondition(i)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={addCondition}
                disabled={conditions.length >= CONDITION_DEFS.length}
              >
                <Plus size={14} />
                إضافة شرط
              </Button>

              {/* Preview matched leads */}
              {matchedLeads.length > 0 && (
                <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-bold text-muted-foreground mb-2">عينة من العملاء المطابقين:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedLeads.slice(0, 8).map((l) => (
                      <Badge key={l.id} variant="outline" className="text-[11px]">
                        {l.firstName} {l.lastName}
                        {l.city ? ` · ${l.city}` : ""}
                      </Badge>
                    ))}
                    {matchedLeads.length > 8 && (
                      <Badge variant="secondary" className="text-[11px]">+{matchedLeads.length - 8} آخرين</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Action */}
            <div>
              <h4 className="font-bold text-sm flex items-center gap-1.5 mb-3">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                الإجراء
              </h4>

              <div className="space-y-4">
                {/* Channel */}
                <div>
                  <label className="text-sm font-bold mb-2 block">قناة الإرسال</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: "whatsapp", label: "واتساب", icon: MessageSquare, color: "text-[#25D366]" },
                      { value: "sms", label: "رسالة نصية", icon: Phone, color: "text-primary" },
                      { value: "email", label: "بريد", icon: Mail, color: "text-primary" },
                      { value: "internal", label: "إشعار داخلي", icon: Bell, color: "text-primary" },
                    ].map((ch) => (
                      <Button
                        key={ch.value}
                        type="button"
                        variant={actionChannel === ch.value ? "default" : "outline"}
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => setActionChannel(ch.value)}
                      >
                        <ch.icon size={18} className={actionChannel === ch.value ? "" : ch.color} />
                        <span className="text-xs">{ch.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm font-bold mb-1.5 block">نص الرسالة (اختياري)</label>
                  <Textarea
                    value={actionMessage}
                    onChange={(e) => setActionMessage(e.target.value)}
                    rows={4}
                    placeholder="اكتب الرسالة التي تريد إرسالها... استخدم {name} لاسم العميل"
                  />
                  <p className="text-xs text-muted-foreground mt-1">المتغيرات: {"{name}"}, {"{city}"}, {"{status}"}</p>
                </div>

                {/* Enabled toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-bold">تفعيل القاعدة فوراً</p>
                    <p className="text-xs text-muted-foreground">عند التفعيل، تُطبق القاعدة تلقائياً</p>
                  </div>
                  <Switch checked={ruleEnabled} onCheckedChange={setRuleEnabled} />
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="max-w-3xl mx-auto pt-4 border-t">
            <Button
              className="gap-2 flex-1 md:flex-none"
              onClick={handleSave}
              disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
            >
              <Save size={16} />
              {createRuleMutation.isPending || updateRuleMutation.isPending
                ? "جاري الحفظ..."
                : editingRule ? "حفظ التعديلات" : "إنشاء القاعدة"}
            </Button>
            <Button variant="outline" onClick={resetBuilder}>إلغاء</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
