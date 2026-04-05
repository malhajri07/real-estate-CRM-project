/**
 * WelcomeHero.tsx — Dashboard welcome section with greeting, stats summary, and quick actions
 *
 * Shows a personalized greeting with the user's name, a summary of today's key metrics,
 * weather-style status indicators, and quick action buttons. Used at the top of the
 * agent platform dashboard.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sun, Moon, Cloud, CloudSun, Sunrise, Sunset,
  TrendingUp, TrendingDown, Minus,
  Users, Building2, Banknote, Calendar, Target, Zap,
  Bell, Settings, Search, Plus, Home, Phone,
  CheckCircle2, Clock, AlertTriangle, XCircle,
  ArrowLeft, Star, Award, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatters";

// ── Types ──────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalLeads: number;
  activeProperties: number;
  monthlyRevenue: number;
  todayAppointments: number;
  pendingDeals: number;
  leadsChange?: number;
  propertiesChange?: number;
  revenueChange?: number;
}

interface WelcomeHeroProps {
  stats?: DashboardStats;
  isLoading?: boolean;
  onQuickAction?: (action: string) => void;
  className?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): { text: string; icon: typeof Sun; period: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return { text: "صباح مبكر", icon: Sunrise, period: "فجر" };
  if (hour >= 7 && hour < 12) return { text: "صباح الخير", icon: Sun, period: "صباح" };
  if (hour >= 12 && hour < 14) return { text: "مرحباً", icon: CloudSun, period: "ظهر" };
  if (hour >= 14 && hour < 17) return { text: "مساء الخير", icon: Cloud, period: "عصر" };
  if (hour >= 17 && hour < 19) return { text: "مساء النور", icon: Sunset, period: "مغرب" };
  return { text: "مساء الخير", icon: Moon, period: "مساء" };
}

function getMotivationalMessage(stats?: DashboardStats): string {
  if (!stats) return "يومك مليء بالفرص — ابدأ الآن!";
  if (stats.totalLeads === 0) return "أضف عميلك الأول لبدء رحلتك في المبيعات";
  if (stats.pendingDeals > 0) return `لديك ${stats.pendingDeals} صفقة قيد التفاوض — تابعها اليوم`;
  if (stats.todayAppointments > 0) return `لديك ${stats.todayAppointments} موعد اليوم — حظاً موفقاً!`;
  if ((stats.leadsChange ?? 0) > 0) return "عملاؤك المحتملون في تزايد — استمر!";
  return "يومك مليء بالفرص — ابدأ الآن!";
}

function getTrendIcon(change?: number) {
  if (!change || change === 0) return { icon: Minus, color: "text-muted-foreground", label: "ثابت" };
  if (change > 0) return { icon: TrendingUp, color: "text-primary", label: `+${change}%` };
  return { icon: TrendingDown, color: "text-destructive", label: `${change}%` };
}

function getDayProgress(): number {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  // Working hours 8am - 6pm = 10 hours
  const workStart = 8;
  const workEnd = 18;
  const totalMinutes = (workEnd - workStart) * 60;
  const elapsed = Math.max(0, (hours - workStart) * 60 + minutes);
  return Math.min(100, Math.round((elapsed / totalMinutes) * 100));
}

// ── Component ───────────────────────────────────────────────────────────────

/**
 * WelcomeHero — Personalized dashboard greeting section
 *
 * Features:
 * - Time-of-day greeting with icon
 * - User name and avatar
 * - Today's summary stats (leads, properties, revenue, appointments)
 * - Motivational message based on stats
 * - Day progress indicator
 * - Quick action buttons
 * - Trend indicators for key metrics
 */
export function WelcomeHero({ stats, isLoading, onQuickAction, className }: WelcomeHeroProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const userName = user?.firstName || user?.name || user?.username || "مستخدم";
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const motivational = getMotivationalMessage(stats);
  const dayProgress = getDayProgress();

  const timeString = currentTime.toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateString = currentTime.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 rounded bg-muted" />
              <div className="h-4 w-64 rounded bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        {/* Header: Greeting + Time */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={(user as any)?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GreetingIcon className="h-5 w-5 text-[hsl(var(--warning))]" />
                <h1 className="text-2xl font-black text-foreground">
                  {greeting.text}، {userName}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">{motivational}</p>
            </div>
          </div>
          <div className="text-end hidden sm:block">
            <p className="text-2xl font-black text-foreground tabular-nums">{timeString}</p>
            <p className="text-xs text-muted-foreground">{dateString}</p>
          </div>
        </div>

        {/* Day Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>تقدم اليوم</span>
            <span>{dayProgress}%</span>
          </div>
          <Progress value={dayProgress} className="h-1.5" />
        </div>

        {/* Stats Grid */}
        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {/* Leads */}
              <StatMini
                label="العملاء المحتملون"
                value={stats.totalLeads}
                icon={Users}
                change={stats.leadsChange}
              />
              {/* Properties */}
              <StatMini
                label="العقارات النشطة"
                value={stats.activeProperties}
                icon={Building2}
                change={stats.propertiesChange}
              />
              {/* Revenue */}
              <StatMini
                label="إيرادات الشهر"
                value={formatPrice(stats.monthlyRevenue)}
                icon={Banknote}
                change={stats.revenueChange}
                valueClassName="text-primary"
              />
              {/* Appointments */}
              <StatMini
                label="مواعيد اليوم"
                value={stats.todayAppointments}
                icon={Calendar}
                badge={stats.todayAppointments > 0 ? "نشط" : undefined}
              />
            </div>
            <Separator className="mb-4" />
          </>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={() => onQuickAction?.("add-lead")}>
                <Plus className="h-3.5 w-3.5" />
                إضافة عميل
              </Button>
            </TooltipTrigger>
            <TooltipContent>أضف عميلاً محتملاً جديداً</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onQuickAction?.("post-listing")}>
                <Home className="h-3.5 w-3.5" />
                إضافة إعلان
              </Button>
            </TooltipTrigger>
            <TooltipContent>أنشئ إعلان عقاري جديد</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onQuickAction?.("schedule")}>
                <Calendar className="h-3.5 w-3.5" />
                جدولة موعد
              </Button>
            </TooltipTrigger>
            <TooltipContent>حدد موعداً للمعاينة</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onQuickAction?.("reports")}>
                <BarChart3 className="h-3.5 w-3.5" />
                التقارير
              </Button>
            </TooltipTrigger>
            <TooltipContent>عرض تقارير الأداء</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatMini({
  label,
  value,
  icon: Icon,
  change,
  badge,
  valueClassName,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  change?: number;
  badge?: string;
  valueClassName?: string;
}) {
  const trend = getTrendIcon(change);
  const TrendIcon = trend.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-1">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {badge ? (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{badge}</Badge>
        ) : change != null ? (
          <span className={cn("text-[10px] font-bold flex items-center gap-0.5", trend.color)}>
            <TrendIcon className="h-3 w-3" />
            {trend.label}
          </span>
        ) : null}
      </div>
      <p className={cn("text-lg font-black", valueClassName)}>{value}</p>
      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}

/**
 * Compact version for smaller viewports or sidebar
 */
export function WelcomeHeroCompact({ className }: { className?: string }) {
  const { user } = useAuth();
  const userName = user?.firstName || user?.username || "مستخدم";
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-muted/30", className)}>
      <GreetingIcon className="h-5 w-5 text-[hsl(var(--warning))] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{greeting.text}، {userName}</p>
        <p className="text-xs text-muted-foreground">{greeting.period}</p>
      </div>
    </div>
  );
}

/**
 * Task Summary — Shows pending tasks count
 */
export function TaskSummary({
  pending,
  completed,
  overdue,
  className,
}: {
  pending: number;
  completed: number;
  overdue: number;
  className?: string;
}) {
  const total = pending + completed + overdue;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("flex items-center gap-4 text-xs", className)}>
      <div className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-bold">{pending}</span>
        <span className="text-muted-foreground">قيد الانتظار</span>
      </div>
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        <span className="font-bold">{completed}</span>
        <span className="text-muted-foreground">مكتمل</span>
      </div>
      {overdue > 0 && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          <span className="font-bold text-destructive">{overdue}</span>
          <span className="text-muted-foreground">متأخر</span>
        </div>
      )}
      <div className="flex-1" />
      <Badge variant="secondary" className="text-[10px]">{completionRate}% إنجاز</Badge>
    </div>
  );
}

/**
 * PerformanceRing — Circular progress indicator
 */
export function PerformanceRing({
  value,
  max = 100,
  label,
  size = 60,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  size?: number;
  className?: string;
}) {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 70 ? "text-primary" : percentage >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/30" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={4} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={cn("transition-all duration-500", color)} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black">{percentage}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-bold">{label}</span>
    </div>
  );
}
