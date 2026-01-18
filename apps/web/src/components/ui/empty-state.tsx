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
import { COMPONENT_STYLES } from '@/config/theme';

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
    <div className={cn(COMPONENT_STYLES.emptyState, className)}>
      {Icon && (
        <Icon className={COMPONENT_STYLES.emptyStateIcon} />
      )}
      <h3 className={COMPONENT_STYLES.emptyStateTitle}>
        {title}
      </h3>
      {description && (
        <p className={COMPONENT_STYLES.emptyStateDescription}>
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
