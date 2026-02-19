/**
 * PipelineFlow.tsx - Visual Pipeline Stages Component
 * 
 * Enhanced pipeline visualization with interactive stages and progress indicators
 */

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PipelineStage {
  id: string;
  label: string;
  value: number;
}

interface PipelineFlowProps {
  stages: PipelineStage[];
}

export function PipelineFlow({ stages }: PipelineFlowProps) {
  const { t, dir } = useLanguage();
  const total = stages.reduce((sum, stage) => sum + stage.value, 0);

  return (
    <Card className="bg-transparent border-0 shadow-none overflow-hidden">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
              {t("dashboard.pipeline_stages")}
            </CardTitle>
            <CardDescription className="text-slate-600" style={{ lineHeight: '1.8' }}>
              {t("dashboard.pipeline_description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipeline Flow Visualization */}
        <div className="relative">
          {/* Flow Line */}
          <div className="absolute top-1/2 start-0 end-0 h-1 bg-slate-200 rounded-full opacity-40" 
            style={{ transform: 'translateY(-50%)' }}
          />
          
          {/* Stages Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
            {stages.map((stage, index) => {
              const percentage = total > 0 ? (stage.value / total) * 100 : 0;
              const isRTL = dir === "rtl";

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="group relative"
                >
                  {/* Stage Card - fixed height for consistent layout */}
                  <div className="rounded-2xl p-5 min-h-[140px] flex flex-col items-center justify-center border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white text-center cursor-pointer">
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 start-0 end-0 h-1 bg-emerald-500 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ height: `${Math.max(percentage / 10, 2)}px` }}
                    />
                    
                    {/* Value */}
                    <motion.p 
                      className="text-3xl font-black text-slate-900 mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                    >
                      {stage.value}
                    </motion.p>
                    
                    {/* Label */}
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider" style={{ lineHeight: '1.6' }}>
                      {stage.label}
                    </p>
                    
                    {/* Percentage Badge */}
                    {total > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="mt-2 rounded-full px-2 py-0.5 text-xs font-semibold opacity-70"
                      >
                        {percentage.toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  {/* Flow Arrow (between stages) - RTL: point left; LTR: point right */}
                  {index < stages.length - 1 && (
                    <div className="hidden sm:block absolute top-1/2 -end-2 z-20"
                      style={{ transform: 'translateY(-50%)' }}
                    >
                      {isRTL ? (
                        <ArrowLeft className="h-5 w-5 text-slate-400 opacity-50" />
                      ) : (
                        <ArrowRight className="h-5 w-5 text-slate-400 opacity-50" />
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {t("dashboard.total_deals") || t("dashboard.deals_in_pipeline") || "إجمالي الصفقات"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {total}
            </p>
          </div>
          <div className="text-end">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {t("dashboard.active_stages") || "المراحل النشطة"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {stages.filter(s => s.value > 0).length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
