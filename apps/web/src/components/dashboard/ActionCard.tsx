/**
 * ActionCard.tsx - Quick Action Card Component
 * 
 * Enhanced action card with better visual hierarchy and feedback
 */

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface ActionCardProps {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  index?: number;
}

export function ActionCard({ 
  id, 
  label, 
  icon: Icon, 
  onClick, 
  disabled = false,
  variant = "primary",
  index = 0 
}: ActionCardProps) {
  const isPrimary = variant === "primary" && !disabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className="relative group"
    >
      <Button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full justify-between rounded-2xl px-5 py-4 h-auto font-bold transition-all duration-300 relative overflow-hidden",
          isPrimary
            ? "bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 border-l-4 border-emerald-400"
            : "bg-gradient-to-br from-white/90 via-white/80 to-slate-50/50 border-2 border-slate-200 hover:border-pink-300 text-slate-700 hover:text-pink-600 shadow-sm hover:shadow-md",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Gradient overlay on hover for secondary */}
        {!isPrimary && !disabled && (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/0 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
        <span className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
            isPrimary
              ? "bg-white/20 group-hover:bg-white/30"
              : "bg-emerald-50 group-hover:bg-emerald-100"
          )}>
            <Icon className={cn(
              "h-5 w-5 transition-colors",
              isPrimary ? "text-white" : "text-emerald-600"
            )} />
          </div>
          <span className="text-sm font-black" style={{ lineHeight: '1.6' }}>
            {label}
          </span>
        </span>
        {!disabled && (
          <ArrowLeft className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all duration-300" />
        )}
      </Button>
    </motion.div>
  );
}
