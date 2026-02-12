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
import { METRICS_CARD_STYLES } from "@/config/platform-theme";
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
    <Card className={METRICS_CARD_STYLES.container}>
      <div className="flex items-center justify-between pb-2">
        <div>
          <p className={METRICS_CARD_STYLES.label}>{title}</p>
          <p className={METRICS_CARD_STYLES.value}>{value}</p>
          {change && (
            <p className={cn("text-xs font-bold mt-1 flex items-center gap-1", changeColorMap[changeType])}>
              <span>{changeIconMap[changeType]}</span>
              {change}
            </p>
          )}
        </div>
        <div className={cn(METRICS_CARD_STYLES.icon, iconColor)}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
}
