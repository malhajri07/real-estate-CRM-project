/**
 * metrics-card.tsx - Metrics Card Component
 * 
 * Location: apps/web/src/ → Components/ → UI Components → metrics-card.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Metrics card component for displaying KPIs. Provides:
 * - Metric value display
 * - Change indicators
 * - Icon support
 * 
 * Related Files:
 * - apps/web/src/pages/dashboard.tsx - Dashboard uses this component
 */

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor: string;
}

export default function MetricsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  iconColor 
}: MetricsCardProps) {
  const changeColorMap = {
    positive: "text-emerald-600",
    negative: "text-red-600",
    neutral: "text-amber-600"
  };

  const changeIconMap = {
    positive: "↗",
    negative: "↘",
    neutral: "→"
  };

  return (
    <Card className="border-0 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6">
      <div className="flex items-center justify-between pb-2">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {change && (
            <p className={cn("text-xs font-bold mt-1 flex items-center gap-1", changeColorMap[changeType])}>
              <span>{changeIconMap[changeType]}</span>
              {change}
            </p>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600", iconColor)}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
}
