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
        "group relative rounded-3xl p-6 border-l-4 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden",
        accent,
        id === "leads" && "border-l-blue-500",
        id === "properties" && "border-l-emerald-500",
        id === "pipeline" && "border-l-amber-500",
        id === "revenue" && "border-l-rose-500"
      )}
    >
      {/* Enhanced Gradient Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', 
          backgroundSize: '20px 20px' 
        }} 
      />

      <div className="relative z-10">
        {/* Header with Icon and Delta */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <Icon className="h-7 w-7 text-slate-700" />
          </div>
          {delta && (
            <Badge 
              variant={delta.tone === "down" ? "warning" : "success"} 
              className="rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
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
        <div className="mb-2">
          <p className="text-4xl font-black text-slate-900 leading-tight" style={{ lineHeight: '1.2' }}>
            {isNumeric ? displayValue.toLocaleString() : value}
          </p>
        </div>

        {/* Label */}
        <p className="text-sm font-bold text-slate-600 uppercase tracking-wider" style={{ lineHeight: '1.6' }}>
          {label}
        </p>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />
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
