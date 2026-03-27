/**
 * empty-state.tsx - Empty State Component
 * 
 * Location: apps/web/src/ → Components/ → UI Components → empty-state.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Reusable empty state component. Provides:
 * - Empty state message
 * - Icon support
 * - Action button support
 * 
 * Related Files:
 * - apps/web/src/components/layout/unified-page-layout.tsx - Uses this component
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Unified Empty State Component
 * 
 * Provides consistent empty state displays across all platform pages with:
 * - Standardized icon, title, and description layout
 * - Optional action buttons
 * - Consistent styling and spacing
 * - RTL support
 */
export default function EmptyState({ 
  icon: Icon,
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16 px-4 bg-muted/30 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center gap-3", className)}>
      {Icon && (
        <Icon className="h-16 w-16 text-slate-300 mb-4" />
      )}
      <h3 className="text-xl font-bold text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
