/**
 * ChartContainer.tsx - Reusable Chart Wrapper
 *
 * Location: apps/web/src/ -> Components/ -> charts/ -> ChartContainer.tsx
 *
 * Wraps Recharts ResponsiveContainer with a standardized header,
 * period selector, export/fullscreen controls, and loading/empty states.
 * Matches the project's unified design system (rounded-2xl cards, etc.).
 *
 * Dependencies:
 * - recharts (ResponsiveContainer)
 * - lucide-react icons
 * - @/components/ui/* (Card, Button, Skeleton)
 */

import React, { useState, useRef, useCallback } from "react";
import { ResponsiveContainer } from "recharts";
import {
  Download,
  Maximize2,
  Minimize2,
  Calendar,
  Loader2,
  BarChart3,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CHART_HEIGHT } from "@/config/design-tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChartPeriod = "today" | "week" | "month" | "quarter" | "year";

export interface PeriodOption {
  value: ChartPeriod;
  label: string;
}

export interface ChartContainerProps {
  /** Chart title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** The Recharts chart element(s) to render inside ResponsiveContainer */
  children: React.ReactNode;
  /** Chart height in px (default from design tokens) */
  height?: number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Whether the dataset is empty */
  isEmpty?: boolean;
  /** Message for empty state */
  emptyMessage?: string;

  /** Currently selected period */
  period?: ChartPeriod;
  /** Called when the period changes */
  onPeriodChange?: (period: ChartPeriod) => void;
  /** Custom period options (defaults to full set) */
  periodOptions?: PeriodOption[];
  /** Hide the period selector */
  hidePeriodSelector?: boolean;

  /** Show export-as-image button */
  showExport?: boolean;
  /** Called when export is clicked (if not provided, uses html2canvas-style approach) */
  onExport?: () => void;

  /** Show fullscreen toggle */
  showFullscreen?: boolean;

  /** Additional className for the Card wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Default periods
// ---------------------------------------------------------------------------

const DEFAULT_PERIODS: PeriodOption[] = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "أسبوع" },
  { value: "month", label: "شهر" },
  { value: "quarter", label: "ربع سنة" },
  { value: "year", label: "سنة" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PeriodSelector({
  options,
  current,
  onChange,
}: {
  options: PeriodOption[];
  current: ChartPeriod;
  onChange: (period: ChartPeriod) => void;
}) {
  return (
    <div className="flex items-center rounded-xl border border-border bg-muted/30 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
            current === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <BarChart3 className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

function ChartLoading({ height }: { height: number }) {
  return (
    <div className="space-y-3 px-2" style={{ height }}>
      <Skeleton className="h-full w-full rounded-2xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export helper
// ---------------------------------------------------------------------------

function exportChartAsImage(
  containerRef: React.RefObject<HTMLDivElement | null>,
  title: string,
) {
  if (!containerRef.current) return;

  const svgElement = containerRef.current.querySelector("svg");
  if (!svgElement) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/\s+/g, "-")}-chart.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ChartContainer({
  title,
  description,
  children,
  height = CHART_HEIGHT,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "لا توجد بيانات لعرضها",

  period = "month",
  onPeriodChange,
  periodOptions = DEFAULT_PERIODS,
  hidePeriodSelector = false,

  showExport = false,
  onExport,

  showFullscreen = false,

  className,
}: ChartContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
    } else {
      exportChartAsImage(chartRef, title);
    }
  }, [onExport, title]);

  const toggleFullscreen = useCallback(() => {
    if (!chartRef.current) return;

    if (!isFullscreen) {
      if (chartRef.current.requestFullscreen) {
        chartRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const effectiveHeight = isFullscreen ? window.innerHeight - 120 : height;

  return (
    <Card
      ref={chartRef}
      className={cn(
        "rounded-2xl shadow-sm overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className,
      )}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Period selector */}
          {!hidePeriodSelector && onPeriodChange && (
            <PeriodSelector
              options={periodOptions}
              current={period}
              onChange={onPeriodChange}
            />
          )}

          {/* Export */}
          {showExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="h-8 w-8 p-0 rounded-lg"
              title="تصدير كصورة"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* Fullscreen */}
          {showFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0 rounded-lg"
              title={isFullscreen ? "تصغير" : "ملء الشاشة"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Chart body */}
      <CardContent className="ps-2 pe-4 pb-4">
        {isLoading ? (
          <ChartLoading height={effectiveHeight} />
        ) : isEmpty ? (
          <div style={{ height: effectiveHeight }}>
            <ChartEmpty message={emptyMessage} />
          </div>
        ) : (
          <div style={{ height: effectiveHeight, direction: "ltr" }}>
            <ResponsiveContainer width="100%" height="100%">
              {children as React.ReactElement}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ChartContainer;
