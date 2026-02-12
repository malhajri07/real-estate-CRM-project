/**
 * MetricCard.tsx - Enhanced Metric Card Component
 * 
 * Modern metric card with glass morphism, animations, and gradient backgrounds
 * Aligned with landing page design system
 */

import { motion } from "framer-motion";
import { Link } from "wouter";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MetricCardProps {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
  delta?: {
    value: number;
    tone: "up" | "down";
  };
  href?: string;
  index?: number;
}

export function MetricCard({ 
  id, 
  label, 
  value, 
  icon: Icon, 
  accent, 
  delta, 
  href,
  index = 0 
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const isNumeric = typeof value === "number";

  // Animate number counting
  useEffect(() => {
    if (isNumeric && value > 0) {
      const duration = 1500;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    } else if (isNumeric) {
      setDisplayValue(0);
    }
  }, [value, isNumeric]);

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "group relative rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden bg-white border border-slate-100",
        // Removed border-s and accent usage
        // accent,
      )}
    >
      <div className="relative z-10">
        {/* Header with Icon and Delta */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:bg-slate-100 group-hover:scale-110 transition-all duration-300">
            <Icon className="h-6 w-6" />
          </div>
          {delta && (
            <Badge 
              variant={delta.tone === "down" ? "warning" : "success"} 
              className="rounded-full px-2.5 py-1 text-[10px] font-bold shadow-none border-0"
            >
              {delta.tone === "down" ? (
                <TrendingDown className="h-3 w-3 ms-1 inline" />
              ) : (
                <TrendingUp className="h-3 w-3 ms-1 inline" />
              )}
              {delta.tone === "down" ? "-" : "+"}
              {Math.abs(delta.value)}%
            </Badge>
          )}
        </div>

        {/* Value */}
        <div className="mb-1">
          <p className="text-3xl font-bold text-slate-900 leading-tight">
            {isNumeric ? displayValue.toLocaleString() : value}
          </p>
        </div>

        {/* Label */}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
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
