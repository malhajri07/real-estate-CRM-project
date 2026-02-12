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
          "w-full justify-between rounded-2xl px-5 py-4 h-auto font-bold transition-all duration-300 relative overflow-hidden bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md text-slate-700 hover:bg-slate-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="flex items-center gap-3">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-all duration-300 group-hover:bg-slate-100 group-hover:scale-110"
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold text-slate-900" style={{ lineHeight: '1.6' }}>
            {label}
          </span>
        </span>
        {!disabled && (
          <ArrowLeft className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all duration-300 text-slate-400" />
        )}
      </Button>
    </motion.div>
  );
}
