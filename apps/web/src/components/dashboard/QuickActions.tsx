/**
 * QuickActions.tsx — Reusable quick action panel for dashboard and sidebar
 *
 * Provides a grid of action cards that link to common CRM tasks.
 * Each card has an icon, title, description, and onClick/href.
 */

import { type LucideIcon, Plus, Calendar, Upload, FileText, Users, Building2, Phone, Mail, Search, Filter, Download, BarChart3, Settings, Bell, MessageCircle, Home, Zap, Target, TrendingUp, ClipboardList, FolderOpen, Globe, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "secondary" | "outline";
  badge?: string;
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  compact?: boolean;
  className?: string;
}

const variantStyles = {
  default: "bg-card hover:bg-muted/50 border-border",
  primary: "bg-primary/5 hover:bg-primary/10 border-primary/20",
  secondary: "bg-secondary/50 hover:bg-secondary border-secondary/30",
  outline: "bg-transparent hover:bg-muted/30 border-border border-dashed",
};

/**
 * QuickActions — Grid of action cards for common CRM tasks
 *
 * Usage:
 * ```tsx
 * <QuickActions
 *   actions={[
 *     { id: "add-lead", title: "إضافة عميل", icon: Plus, onClick: () => {} },
 *     { id: "schedule", title: "جدولة موعد", icon: Calendar, href: "/calendar" },
 *   ]}
 *   columns={3}
 * />
 * ```
 */
export function QuickActions({ actions, columns = 3, compact = false, className }: QuickActionsProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  }[columns];

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant === "primary" ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  <Icon className="h-4 w-4" />
                  {action.title}
                  {action.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {action.badge}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              {action.description && (
                <TooltipContent>{action.description}</TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn(`grid gap-4 ${gridCols}`, className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        const style = variantStyles[action.variant || "default"];

        return (
          <Card
            key={action.id}
            className={cn(
              "relative cursor-pointer border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
              style,
              action.disabled && "opacity-50 cursor-not-allowed hover:shadow-none hover:translate-y-0"
            )}
            onClick={action.disabled ? undefined : action.onClick}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                action.variant === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground truncate">{action.title}</h4>
                  {action.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                {action.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{action.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Pre-built action sets for common use cases
 */
export const CRM_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "add-lead",
    title: "إضافة عميل محتمل",
    description: "أضف عميلاً جديداً إلى قاعدة البيانات",
    icon: Plus,
    variant: "primary",
  },
  {
    id: "schedule-appointment",
    title: "جدولة موعد",
    description: "حدد موعداً مع عميل أو للمعاينة",
    icon: Calendar,
  },
  {
    id: "upload-csv",
    title: "رفع ملف CSV",
    description: "استيراد بيانات العملاء من ملف",
    icon: Upload,
  },
  {
    id: "post-listing",
    title: "إضافة إعلان عقاري",
    description: "أنشئ إعلاناً جديداً للمراجعة",
    icon: Home,
    variant: "primary",
  },
  {
    id: "send-campaign",
    title: "إرسال حملة",
    description: "أرسل رسائل جماعية للعملاء",
    icon: Mail,
  },
  {
    id: "export-report",
    title: "تصدير تقرير",
    description: "صدّر بيانات الأداء كملف CSV أو PDF",
    icon: Download,
  },
];

export const ADMIN_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "review-listings",
    title: "مراجعة الإعلانات",
    description: "إعلانات بانتظار الموافقة",
    icon: ClipboardList,
    variant: "primary",
    badge: "جديد",
  },
  {
    id: "manage-users",
    title: "إدارة المستخدمين",
    description: "عرض وتعديل حسابات المستخدمين",
    icon: Users,
  },
  {
    id: "manage-roles",
    title: "إدارة الأدوار",
    description: "تعديل الصلاحيات والأدوار",
    icon: Shield,
  },
  {
    id: "view-analytics",
    title: "تحليلات المنصة",
    description: "مراجعة إحصائيات الاستخدام",
    icon: BarChart3,
  },
  {
    id: "manage-cms",
    title: "إدارة المحتوى",
    description: "تحديث الصفحة الرئيسية والمقالات",
    icon: Globe,
  },
  {
    id: "system-settings",
    title: "إعدادات النظام",
    description: "ضبط إعدادات المنصة العامة",
    icon: Settings,
  },
];

/**
 * QuickActionBar — Horizontal compact action bar
 */
export function QuickActionBar({
  actions,
  className,
}: {
  actions: QuickAction[];
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border overflow-x-auto", className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 shrink-0 rounded-lg text-xs"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{action.title}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-bold">{action.title}</p>
              {action.description && <p className="text-xs opacity-80">{action.description}</p>}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

/**
 * EmptyQuickAction — Placeholder card for adding new actions
 */
export function EmptyQuickAction({
  onAdd,
  className,
}: {
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-2 border-dashed border-border/50 bg-transparent cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all duration-200",
        className
      )}
      onClick={onAdd}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[80px]">
        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-xs font-bold text-muted-foreground">إضافة إجراء سريع</p>
      </CardContent>
    </Card>
  );
}
