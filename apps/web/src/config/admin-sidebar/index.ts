/**
 * Admin Sidebar Configuration
 * 
 * Centralized configuration for admin sidebar navigation
 * 
 * This file combines all sidebar sections into a single configuration array.
 * Each section is organized by functional area for better maintainability.
 */

import {
  AlertCircle,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileText,
  Layers,
  LineChart,
  Plug,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  Users
} from "lucide-react";
import type { AdminSidebarItemConfig } from "./types";

// Import the original config (we'll refactor sections incrementally)
// For now, we maintain backward compatibility by re-exporting from the original file
export { adminSidebarConfig } from "../admin-sidebar";
export type { AdminSidebarItemConfig, AdminSidebarChildConfig, AdminSidebarContentSection } from "./types";

