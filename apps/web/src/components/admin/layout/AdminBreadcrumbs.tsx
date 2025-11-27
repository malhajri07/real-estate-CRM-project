/**
 * AdminBreadcrumbs.tsx - Admin Breadcrumbs Component
 * 
 * Location: apps/web/src/ → Components/ → Admin Components → layout/ → AdminBreadcrumbs.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin breadcrumbs component. Provides:
 * - Navigation breadcrumbs
 * - RTL support
 * - Breadcrumb navigation
 * 
 * Related Files:
 * - Used in admin pages for navigation
 */

import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface AdminBreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
    const [, setLocation] = useLocation();

    return (
        <nav className={cn('flex items-center gap-2 text-sm', className)} aria-label="Breadcrumb">
            <button
                onClick={() => setLocation('/admin/overview/main-dashboard')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Home"
            >
                <Home className="h-4 w-4" />
            </button>

            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                    {item.href ? (
                        <button
                            onClick={() => setLocation(item.href!)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {item.label}
                        </button>
                    ) : (
                        <span className="text-foreground font-medium">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}
