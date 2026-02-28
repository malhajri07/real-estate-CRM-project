/**
 * page-header.tsx - Page Header Component
 * 
 * Location: apps/web/src/ → Components/ → UI Components → page-header.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Reusable page header component. Provides:
 * - Page title and subtitle
 * - Consistent header styling
 * - Action buttons support
 * 
 * Related Files:
 * - apps/web/src/components/layout/unified-page-layout.tsx - Uses this component
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY } from '@/config/platform-theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Unified Page Header Component
 * 
 * Provides consistent styling for all platform page headers with:
 * - Standardized title and subtitle formatting
 * - Flexible action buttons area
 * - Responsive layout
 * - RTL support
 */
export default function PageHeader({ 
  title, 
  subtitle, 
  children, 
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", className)}>
      <div className="flex-1 min-w-0">
        <h1 className={TYPOGRAPHY.pageTitle}>
          {title}
        </h1>
        {subtitle && (
          <p className={TYPOGRAPHY.pageSubtitle}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
