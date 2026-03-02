/**
 * AdminBreadcrumbs.tsx - Admin Breadcrumbs Component
 * 
 * Location: apps/web/src/ → Components/ → Admin Components → layout/ → AdminBreadcrumbs.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Admin breadcrumbs component using shadcn Breadcrumb. Provides:
 * - Navigation breadcrumbs
 * - RTL support (via shadcn's built-in separator)
 * - Breadcrumb navigation
 * 
 * Related Files:
 * - Used in admin pages for navigation
 */

import { Home } from 'lucide-react';
import { useLocation } from 'wouter';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItemData {
    label: string;
    href?: string;
}

interface AdminBreadcrumbsProps {
    items: BreadcrumbItemData[];
    className?: string;
}

export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
    const [, setLocation] = useLocation();

    return (
        <Breadcrumb className={className}>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink
                        asChild
                    >
                        <button onClick={() => setLocation('/admin/overview/main-dashboard')}>
                            <Home className="h-4 w-4" />
                        </button>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {items.map((item, index) => (
                    <BreadcrumbItem key={index}>
                        <BreadcrumbSeparator />
                        {item.href ? (
                            <BreadcrumbLink asChild>
                                <button onClick={() => setLocation(item.href!)}>
                                    {item.label}
                                </button>
                            </BreadcrumbLink>
                        ) : (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        )}
                    </BreadcrumbItem>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
