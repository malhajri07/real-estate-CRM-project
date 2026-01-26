import { adminSidebarConfig, type AdminSidebarItemConfig } from '@/config/admin-sidebar';
import type { SidebarItem } from '../layout/AdminSidebar';

export function mapConfigToSidebarItems(
    config: AdminSidebarItemConfig[],
    t?: (key: string) => string
): SidebarItem[] {
    return config.map(item => ({
        id: item.id,
        label: t ? t(item.labelKey) : item.labelKey,
        icon: item.icon,
        subPages: item.children.map(child => ({
            id: child.id,
            label: t ? t(child.labelKey) : child.labelKey,
            route: child.route
        }))
    }));
}

export function getActiveItemFromRoute(route: string, config: AdminSidebarItemConfig[]): string {
    for (const item of config) {
        if (item.children.some(child => route.startsWith(child.route) || route === child.route)) {
            return item.id;
        }
    }
    return '';
}

export function getExpandedItemsFromRoute(route: string, config: AdminSidebarItemConfig[]): string[] {
    const activeItem = getActiveItemFromRoute(route, config);
    return activeItem ? [activeItem] : [];
}
