/**
 * TaskCard.tsx - Enhanced Task/Activity Card Component
 * 
 * Modern task card with priority indicators and better visual feedback
 */

import { motion } from "framer-motion";
import { Check, Clock3, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Activity } from "@shared/types";

interface TaskCardProps {
  activity: Activity;
  completed: boolean;
  onClick: () => void;
  locale: string;
  index?: number;
}

export function TaskCard({ 
  activity, 
  completed, 
  onClick, 
  locale,
  index = 0 
}: TaskCardProps) {
  const scheduledDate = activity.scheduledDate ? new Date(activity.scheduledDate) : null;
  const isOverdue = scheduledDate && scheduledDate < new Date() && !completed;
  const timeStr = scheduledDate 
    ? scheduledDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group rounded-2xl p-4 border-l-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden",
        completed 
          ? "bg-gradient-to-br from-emerald-50/50 via-white/80 to-emerald-50/30 border-l-emerald-500 opacity-70"
          : isOverdue
          ? "bg-gradient-to-br from-amber-50/50 via-white/80 to-amber-50/30 border-l-amber-500"
          : "bg-gradient-to-br from-amber-50/30 via-white/80 to-amber-50/20 border-l-amber-400"
      )}
    >
      {/* Enhanced Gradient Overlay */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        completed 
          ? "bg-gradient-to-br from-emerald-50/50 to-emerald-50/80"
          : isOverdue
          ? "bg-gradient-to-br from-amber-50/50 to-amber-50/80"
          : "bg-gradient-to-br from-amber-50/30 to-amber-50/60"
      )} />

      <div className="relative z-10 flex items-start gap-4">
        {/* Checkbox/Status Icon */}
        <div className={cn(
          "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110",
          completed
            ? "border-emerald-300 bg-emerald-50 text-emerald-600"
            : isOverdue
            ? "border-amber-300 bg-amber-50 text-amber-600"
            : "border-blue-200 bg-blue-50 text-blue-600 group-hover:border-blue-300 group-hover:bg-blue-100"
        )}>
          {completed ? (
            <Check className="h-5 w-5" />
          ) : isOverdue ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Clock3 className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-sm font-black text-slate-900 mb-1 transition-colors group-hover:text-emerald-600",
            completed && "line-through text-slate-500"
          )} style={{ lineHeight: '1.6' }}>
            {activity.title}
          </h3>
          {timeStr && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {timeStr}
              </span>
              {isOverdue && (
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  متأخر
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}
