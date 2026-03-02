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
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/40", className)}>
      {(title || subtitle) && (
        <div className="flex-1 min-w-0">
          {title && (
            <h2 className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-slate-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children && (
        <div className="flex flex-wrap gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
