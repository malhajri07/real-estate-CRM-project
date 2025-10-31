import React from 'react';
import { cn } from '@/lib/utils';
import { COMPONENT_STYLES } from '@/config/theme';
import PageHeader from '@/components/ui/page-header';
import LoadingState from '@/components/ui/loading-state';
import EmptyState from '@/components/ui/empty-state';
import FilterBar from '@/components/ui/filter-bar';
import ActionBar from '@/components/ui/action-bar';

interface UnifiedPageLayoutProps {
  // Page Header
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  
  // Loading State
  isLoading?: boolean;
  loadingMessage?: string;
  
  // Empty State
  isEmpty?: boolean;
  emptyStateIcon?: React.ComponentType<{ className?: string }>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: React.ReactNode;
  
  // Filters
  showFilters?: boolean;
  isFiltersOpen?: boolean;
  onToggleFilters?: () => void;
  onClearFilters?: () => void;
  filterContent?: React.ReactNode;
  
  // Action Bar
  actionBarTitle?: string;
  actionBarSubtitle?: string;
  actionBarActions?: React.ReactNode;
  
  // Content
  children: React.ReactNode;
  
  // Styling
  className?: string;
  contentClassName?: string;
}

/**
 * Unified Page Layout Component
 * 
 * Provides a consistent layout structure for all platform pages with:
 * - Standardized page header
 * - Loading and empty states
 * - Filter bar integration
 * - Action bar for page-specific actions
 * - Consistent content area
 * - RTL support
 */
export default function UnifiedPageLayout({
  title,
  subtitle,
  headerActions,
  isLoading = false,
  loadingMessage = 'جار التحميل...',
  isEmpty = false,
  emptyStateIcon: EmptyStateIcon,
  emptyStateTitle = 'لا توجد بيانات',
  emptyStateDescription = 'لم يتم العثور على أي بيانات لعرضها.',
  emptyStateAction,
  showFilters = false,
  isFiltersOpen = false,
  onToggleFilters,
  onClearFilters,
  filterContent,
  actionBarTitle,
  actionBarSubtitle,
  actionBarActions,
  children,
  className,
  contentClassName
}: UnifiedPageLayoutProps) {
  // Show loading state
  if (isLoading) {
    return (
      <div className={cn(COMPONENT_STYLES.pageContainer, className)}>
        <PageHeader title={title} subtitle={subtitle} />
        <LoadingState message={loadingMessage} />
      </div>
    );
  }

  // Show empty state
  if (isEmpty) {
    return (
      <div className={cn(COMPONENT_STYLES.pageContainer, className)}>
        <PageHeader title={title} subtitle={subtitle} />
        <EmptyState
          icon={EmptyStateIcon}
          title={emptyStateTitle}
          description={emptyStateDescription}
          action={emptyStateAction}
        />
      </div>
    );
  }

  return (
    <div className={cn(COMPONENT_STYLES.pageContainer, className)}>
      {/* Page Header */}
      <PageHeader 
        title={title} 
        subtitle={subtitle}
      >
        {headerActions}
      </PageHeader>

      {/* Action Bar */}
      {(actionBarTitle || actionBarActions) && (
        <ActionBar
          title={actionBarTitle}
          subtitle={actionBarSubtitle}
        >
          {actionBarActions}
        </ActionBar>
      )}

      {/* Filter Bar */}
      {showFilters && filterContent && onToggleFilters && (
        <FilterBar
          isOpen={isFiltersOpen}
          onToggle={onToggleFilters}
          onClear={onClearFilters}
        >
          {filterContent}
        </FilterBar>
      )}

      {/* Main Content */}
      <div className={cn('space-y-6', contentClassName)}>
        {children}
      </div>
    </div>
  );
}
