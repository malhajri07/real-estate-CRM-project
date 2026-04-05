/**
 * StatCard.tsx - Enhanced Stat Card with Sparkline
 *
 * Location: apps/web/src/ -> Components/ -> stats/ -> StatCard.tsx
 *
 * Enhanced statistics card combining the patterns from MetricCard and
 * MetricsCard with additional features:
 * - Animated counter
 * - Trend indicator (up/down with percentage)
 * - Sparkline mini chart (via Recharts)
 * - Comparison text vs previous period
 * - Click to drill down
 *
 * Dependencies:
 * - recharts (LineChart for sparkline)
 * - framer-motion for entrance animation
 * - lucide-react icons
 */

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SparklinePoint {
  value: number;
}

export interface StatCardProps {
  /** Card label / title */
  label: string;
  /** Primary numeric value */
  value: number;
  /** Optional prefix (e.g. "SAR", "$") */
  prefix?: string;
  /** Optional suffix (e.g. "%", " عقار") */
  suffix?: string;
  /** Trend information */
  trend?: {
    /** Percentage change */
    value: number;
    /** Direction */
    direction: "up" | "down" | "neutral";
  };
  /** Comparison text (e.g. "مقارنة بالشهر الماضي") */
  comparisonText?: string;
  /** Icon component */
  icon?: LucideIcon;
  /** Sparkline data points */
  sparklineData?: SparklinePoint[];
  /** Color for sparkline and icon accent */
  accentColor?: string;
  /** Navigate to this path on click */
  href?: string;
  /** Called on click (if no href) */
  onClick?: () => void;
  /** Entrance animation delay index */
  index?: number;
  /** Additional className */
  className?: string;
  /** Disable animated counter */
  disableAnimation?: boolean;
}

// ---------------------------------------------------------------------------
// Animated counter
// ---------------------------------------------------------------------------

function useAnimatedCounter(target: number, disabled: boolean, duration = 1200): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (disabled || target <= 0) {
      setDisplay(target);
      return;
    }

    let frame: number;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, disabled, duration]);

  return display;
}

// ---------------------------------------------------------------------------
// Trend badge
// ---------------------------------------------------------------------------

function TrendBadge({ trend }: { trend: NonNullable<StatCardProps["trend"]> }) {
  const config = {
    up: { icon: TrendingUp, variant: "success" as const, prefix: "+" },
    down: { icon: TrendingDown, variant: "warning" as const, prefix: "-" },
    neutral: { icon: Minus, variant: "secondary" as const, prefix: "" },
  };

  const { icon: TrendIcon, variant, prefix } = config[trend.direction];

  return (
    <Badge
      variant={variant}
      className="rounded-full px-2 py-0.5 text-xs font-bold border-0 shadow-none gap-0.5"
    >
      <TrendIcon className="h-3 w-3" />
      {prefix}
      {Math.abs(trend.value)}%
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  color,
}: {
  data: SparklinePoint[];
  color: string;
}) {
  if (data.length < 2) return null;

  return (
    <div className="h-10 w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  trend,
  comparisonText,
  icon: Icon,
  sparklineData,
  accentColor = "hsl(var(--chart-1))",
  href,
  onClick,
  index = 0,
  className,
  disableAnimation = false,
}: StatCardProps) {
  const displayValue = useAnimatedCounter(value, disableAnimation);

  const formattedValue = useMemo(() => {
    const formatted = displayValue.toLocaleString("en-US");
    return `${prefix}${formatted}${suffix}`;
  }, [displayValue, prefix, suffix]);

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "group relative rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-card border border-border cursor-pointer",
        className,
      )}
      onClick={!href ? onClick : undefined}
    >
      {/* Header: icon + trend */}
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Icon className="h-5 w-5" style={{ color: accentColor }} />
          </div>
        )}
        {trend && <TrendBadge trend={trend} />}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-foreground leading-tight mb-1">
        {formattedValue}
      </p>

      {/* Label */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>

      {/* Comparison text */}
      {comparisonText && (
        <p className="mt-1.5 text-xs text-muted-foreground">{comparisonText}</p>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <Sparkline data={sparklineData} color={accentColor} />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default StatCard;
