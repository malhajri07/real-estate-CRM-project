/**
 * PageSectionHeader — Unified page/section header component
 *
 * Use this as the standard header pattern across all admin and platform pages.
 * Provides consistent icon + title + subtitle layout with optional action slot.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionHeaderProps {
  /** Optional Lucide icon element (already rendered, e.g. <ShieldCheck className="h-7 w-7" />) */
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  /** Optional action buttons / controls rendered on the opposite side */
  actions?: ReactNode;
  className?: string;
}

export function PageSectionHeader({
  icon,
  title,
  subtitle,
  actions,
  className,
}: PageSectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <div className="icon-container shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
