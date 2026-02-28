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
import { EMPTY_STYLES } from '@/config/platform-theme';

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
    <div className={cn(EMPTY_STYLES.container, "flex flex-col items-center justify-center gap-3", className)}>
      {Icon && (
        <Icon className="h-16 w-16 text-slate-300 mb-4" />
      )}
      <h3 className={EMPTY_STYLES.title}>
        {title}
      </h3>
      {description && (
        <p className={EMPTY_STYLES.description}>
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
