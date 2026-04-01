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
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Check if a value is a renderable React component (function or forwardRef object).
 */
function isReactComponent(value: unknown): value is React.ComponentType<{ className?: string }> {
  if (typeof value === 'function') return true;
  // forwardRef components are objects with $$typeof and render
  if (typeof value === 'object' && value !== null && '$$typeof' in value) {
    const sym = (value as Record<string, unknown>).$$typeof;
    return typeof sym === 'symbol';
  }
  return false;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16 px-4 bg-muted/30 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center gap-3", className)}>
      {icon && (
        isReactComponent(icon) ? (
          React.createElement(icon, { className: "h-16 w-16 text-muted-foreground mb-4" })
        ) : (
          <div className="h-16 w-16 text-muted-foreground mb-4 flex items-center justify-center">
            {icon as React.ReactNode}
          </div>
        )
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
