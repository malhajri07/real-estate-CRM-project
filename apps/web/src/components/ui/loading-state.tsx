/**
 * loading-state.tsx - Loading State Component
 * 
 * Location: apps/web/src/ → Components/ → UI Components → loading-state.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Reusable loading state component. Provides:
 * - Loading spinner
 * - Loading message
 * - Consistent loading UI
 * 
 * Related Files:
 * - apps/web/src/components/layout/unified-page-layout.tsx - Uses this component
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMPONENT_STYLES } from '@/config/theme';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Unified Loading State Component
 * 
 * Provides consistent loading indicators across all platform pages with:
 * - Standardized spinner and text
 * - Multiple sizes
 * - Customizable messages
 * - Consistent styling
 */
export default function LoadingState({ 
  message = 'جار التحميل...', 
  size = 'md',
  className 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
      <p className={cn(COMPONENT_STYLES.loadingText, 'mt-2')}>
        {message}
      </p>
    </div>
  );
}
