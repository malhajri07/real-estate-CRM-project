import React from 'react';
import { cn } from '@/lib/utils';
import { COMPONENT_STYLES } from '@/config/theme';

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
    <div className={cn(COMPONENT_STYLES.pageHeader, className)}>
      <div className="flex-1 min-w-0">
        <h1 className={COMPONENT_STYLES.pageTitle}>
          {title}
        </h1>
        {subtitle && (
          <p className={COMPONENT_STYLES.pageSubtitle}>
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
