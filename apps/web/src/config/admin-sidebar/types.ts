/**
 * Type definitions for Admin Sidebar Configuration
 */

import type { LucideIcon } from "lucide-react";

export type AdminSidebarContentSection = {
  title: string;
  items: string[];
};

export type AdminSidebarChildConfig = {
  id: string;
  labelKey: string;
  route: string;
  contentSections?: AdminSidebarContentSection[];
};

export type AdminSidebarItemConfig = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  children: AdminSidebarChildConfig[];
};

