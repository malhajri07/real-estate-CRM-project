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
        "group rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden bg-white border border-slate-100",
        completed && "opacity-70 bg-slate-50"
      )}
    >
      <div className="relative z-10 flex items-start gap-4">
        {/* Checkbox/Status Icon */}
        <div className={cn(
          "flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center bg-slate-50 transition-all duration-300 group-hover:bg-slate-100 group-hover:scale-110",
          completed
            ? "text-emerald-600"
            : isOverdue
            ? "text-amber-600"
            : "text-slate-600"
        )}>
          {completed ? (
            <Check className="h-6 w-6" />
          ) : isOverdue ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <Clock3 className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className={cn(
            "text-sm font-bold text-slate-900 mb-1 transition-colors group-hover:text-emerald-600",
            completed && "line-through text-slate-500"
          )} style={{ lineHeight: '1.6' }}>
            {activity.title}
          </h3>
          {timeStr && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                {timeStr}
              </span>
              {isOverdue && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
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
