import React from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMPONENT_STYLES } from '@/config/theme';
import { Button } from './button';

interface FilterBarProps {
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClear?: () => void;
  className?: string;
}

/**
 * Unified Filter Bar Component
 * 
 * Provides consistent filter UI across all platform pages with:
 * - Collapsible filter panel
 * - Clear filters functionality
 * - Responsive grid layout
 * - Consistent styling
 */
export default function FilterBar({ 
  children, 
  isOpen, 
  onToggle, 
  onClear,
  className 
}: FilterBarProps) {
  return (
    <div className={cn(COMPONENT_STYLES.filterBar, className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">الفلاتر</span>
        </div>
        <div className="flex items-center gap-2">
          {onClear && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4 mr-1" />
              مسح الكل
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className="text-gray-600 hover:text-gray-800"
          >
            {isOpen ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
          </Button>
        </div>
      </div>
      
      {isOpen && (
        <div className={COMPONENT_STYLES.filterGrid}>
          {children}
        </div>
      )}
    </div>
  );
}
