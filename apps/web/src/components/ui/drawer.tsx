import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './button';
import { useLanguage } from '@/contexts/LanguageContext';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  side?: 'left' | 'right';
}

/**
 * Drawer Component
 * 
 * A slide-out panel that appears from the start or end side of the screen.
 * Uses logical properties for RTL support.
 */
export default function Drawer({ 
  open, 
  onOpenChange, 
  children, 
  title,
  description,
  className,
  side = 'left'
}: DrawerProps) {
  const { dir } = useLanguage();
  if (!open) return null;

  const isStart = side === 'left';
  const closedTransform = isStart
    ? (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')
    : (dir === 'rtl' ? '-translate-x-full' : 'translate-x-full');

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
          isStart ? 'start-0' : 'end-0',
          open ? 'translate-x-0' : closedTransform,
          className
        )}
        dir={dir}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex-1">
              {title && (
                <h2 className="text-lg font-semibold text-slate-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-slate-600 mt-1">
                  {description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {children}
        </div>
      </div>
    </>
  );
}