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
    positive: "text-success",
    negative: "text-error",
    neutral: "text-warning"
  };

  const changeIconMap = {
    positive: "↗",
    negative: "↘",
    neutral: "→"
  };

  return (
    <Card className="border border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {change && (
              <p className={`text-sm ${changeColorMap[changeType]}`}>
                <span className="mr-1">{changeIconMap[changeType]}</span>
                {change}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon className="text-xl" size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
