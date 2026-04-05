/**
 * LeadScoreCard.tsx — Lead Scoring Display Component
 *
 * Location: apps/web/src/components/lead/LeadScoreCard.tsx
 *
 * Features:
 * - Score out of 100 display
 * - SVG progress ring/circle visualization
 * - Score breakdown (engagement, recency, budget match, interest level)
 * - Color coding: green >70, amber 40-70, red <40
 * - Animated score rendering
 * - Trend indicator
 *
 * Dependencies:
 * - @/components/ui/card
 * - @/components/ui/progress
 * - lucide-react icons
 * - @/lib/utils (cn)
 */

import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Clock,
  DollarSign,
  Heart,
  Zap,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  engagement: number; // 0-25
  recency: number; // 0-25
  budgetMatch: number; // 0-25
  interestLevel: number; // 0-25
}

export interface LeadScoreCardProps {
  score: number; // 0-100
  breakdown?: ScoreBreakdown;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  lastUpdated?: string;
  className?: string;
}

// ─── Score Color Logic ───────────────────────────────────────────────────────

function getScoreConfig(score: number) {
  if (score >= 70) {
    return {
      color: "text-primary",
      ringColor: "stroke-primary",
      bgGradient: "from-primary/10 to-primary/15/50 dark:from-primary/20 dark:to-primary/10",
      label: "ممتاز",
      barColor: "bg-primary/100",
      labelBg: "bg-primary/15 text-primary dark:bg-primary/90/40 dark:text-primary",
    };
  }
  if (score >= 40) {
    return {
      color: "text-[hsl(var(--warning))]",
      ringColor: "stroke-[hsl(var(--warning))]",
      bgGradient: "from-[hsl(var(--warning)/0.1)] to-[hsl(var(--warning)/0.15)]/50 dark:from-[hsl(var(--warning))]/20 dark:to-[hsl(var(--warning))]/10",
      label: "متوسط",
      barColor: "bg-[hsl(var(--warning)/0.1)]0",
      labelBg: "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] dark:bg-[hsl(var(--warning))]/40 dark:text-[hsl(var(--warning))]",
    };
  }
  return {
    color: "text-destructive",
    ringColor: "stroke-destructive",
    bgGradient: "from-destructive/10 to-destructive/15/50 dark:from-destructive/20 dark:to-destructive/10",
    label: "ضعيف",
    barColor: "bg-destructive/100",
    labelBg: "bg-destructive/15 text-destructive dark:bg-destructive/90/40 dark:text-destructive",
  };
}

// ─── SVG Ring ────────────────────────────────────────────────────────────────

function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const config = getScoreConfig(score);
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(config.ringColor, "transition-all duration-1000 ease-out")}
        />
      </svg>

      {/* Center score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", config.color)}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground font-medium">من 100</span>
      </div>
    </div>
  );
}

// ─── Breakdown Item ──────────────────────────────────────────────────────────

interface BreakdownItemConfig {
  key: keyof ScoreBreakdown;
  icon: React.ElementType;
  label: string;
  max: number;
}

const BREAKDOWN_ITEMS: BreakdownItemConfig[] = [
  { key: "engagement", icon: Activity, label: "التفاعل", max: 25 },
  { key: "recency", icon: Clock, label: "الحداثة", max: 25 },
  { key: "budgetMatch", icon: DollarSign, label: "مطابقة الميزانية", max: 25 },
  { key: "interestLevel", icon: Heart, label: "مستوى الاهتمام", max: 25 },
];

function BreakdownRow({
  config: itemConfig,
  value,
}: {
  config: BreakdownItemConfig;
  value: number;
}) {
  const Icon = itemConfig.icon;
  const percentage = Math.min(100, (value / itemConfig.max) * 100);
  const scoreConfig = getScoreConfig((value / itemConfig.max) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {itemConfig.label}
          </span>
        </div>
        <span className="text-xs font-bold text-foreground">
          {value}/{itemConfig.max}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            scoreConfig.barColor
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ─── Trend Indicator ─────────────────────────────────────────────────────────

function TrendIndicator({
  trend,
  value,
}: {
  trend: "up" | "down" | "stable";
  value?: string;
}) {
  const configs = {
    up: {
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10 dark:bg-primary/90/30",
      label: "ارتفاع",
    },
    down: {
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10 dark:bg-destructive/90/30",
      label: "انخفاض",
    },
    stable: {
      icon: Minus,
      color: "text-muted-foreground",
      bg: "bg-muted",
      label: "ثابت",
    },
  };

  const config = configs[trend];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
        config.bg,
        config.color
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{value ?? config.label}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LeadScoreCard({
  score,
  breakdown,
  trend,
  trendValue,
  lastUpdated,
  className,
}: LeadScoreCardProps) {
  const config = useMemo(() => getScoreConfig(score), [score]);

  return (
    <Card className={cn("rounded-2xl shadow-sm overflow-hidden", className)}>
      {/* Top gradient bar */}
      <div className={cn("h-1", config.barColor)} />

      <CardHeader className="p-6 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            تقييم العميل المحتمل
          </CardTitle>
          <span
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full",
              config.labelBg
            )}
          >
            {config.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-5">
        {/* Score ring + trend */}
        <div className="flex items-center justify-center gap-6">
          <ScoreRing score={score} />

          <div className="space-y-2">
            {trend && <TrendIndicator trend={trend} value={trendValue} />}
            {lastUpdated && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                آخر تحديث: {lastUpdated}
              </p>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" />
              <Star className="h-3 w-3 text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" />
              <Star className="h-3 w-3 text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" />
              <Star
                className={cn(
                  "h-3 w-3",
                  score >= 50
                    ? "text-[hsl(var(--warning))] fill-[hsl(var(--warning))]"
                    : "text-muted fill-muted"
                )}
              />
              <Star
                className={cn(
                  "h-3 w-3",
                  score >= 80
                    ? "text-[hsl(var(--warning))] fill-[hsl(var(--warning))]"
                    : "text-muted fill-muted"
                )}
              />
            </div>
          </div>
        </div>

        {/* Breakdown */}
        {breakdown && (
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              تفاصيل التقييم
            </h4>
            {BREAKDOWN_ITEMS.map((item) => (
              <BreakdownRow
                key={item.key}
                config={item}
                value={breakdown[item.key]}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LeadScoreCard;
