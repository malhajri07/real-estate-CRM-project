/**
 * action-bar.tsx - Action Bar Component
 * 
 * Location: apps/web/src/ → Components/ → UI Components → action-bar.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Reusable action bar component. Provides:
 * - Action buttons container
 * - Title and subtitle support
 * - Consistent action bar styling
 * 
 * Related Files:
 * - apps/web/src/components/layout/unified-page-layout.tsx - Uses this component
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { COMPONENT_STYLES } from '@/config/theme';

interface ActionBarProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Unified Action Bar Component
 * 
 * Provides consistent action bar layout across all platform pages with:
 * - Title and subtitle display
 * - Action buttons area
 * - Responsive layout
 * - Consistent spacing
 */
export default function ActionBar({ 
  title,
  subtitle,
  children, 
  className 
}: ActionBarProps) {
  return (
    <div className={cn(COMPONENT_STYLES.actionBar, className)}>
      {(title || subtitle) && (
        <div className="flex-1 min-w-0">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children && (
        <div className={COMPONENT_STYLES.actionButtons}>
          {children}
        </div>
      )}
    </div>
  );
}
