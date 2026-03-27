/**
 * AdminStatusBadge.tsx - Admin Status Badge Component
 *
 * Displays user approval/active status as a colored badge.
 * Uses status-badge-* utility classes from tailwind.config for consistent color tokens.
 *
 * Related Files:
 * - apps/web/src/pages/admin/user-management.tsx - Uses this badge
 * - apps/web/src/constants/labels.ts - Label strings
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminUserApprovalStatus } from "@/lib/rbacAdmin";
import { USER_STATUS_LABELS, USER_STATUS_BADGE_CLASS } from "@/constants/labels";

interface AdminStatusBadgeProps {
  approvalStatus?: AdminUserApprovalStatus | null;
  isActive: boolean;
  className?: string;
}

const resolveStatusKey = (
  approvalStatus: AdminUserApprovalStatus | null | undefined,
  isActive: boolean,
): string => {
  const normalized = approvalStatus?.toUpperCase();

  if (normalized === "PENDING") return "pending";
  if (normalized === "NEEDS_INFO") return "needsInfo";
  if (normalized === "REJECTED") return "rejected";
  if (normalized === "APPROVED") return isActive ? "active" : "inactive";

  return isActive ? "active" : "inactive";
};

export const AdminStatusBadge = ({ approvalStatus, isActive, className }: AdminStatusBadgeProps) => {
  const statusKey = resolveStatusKey(approvalStatus, isActive);
  const label = USER_STATUS_LABELS[statusKey] ?? USER_STATUS_LABELS.unknown;
  const badgeClass = USER_STATUS_BADGE_CLASS[statusKey] ?? "status-badge-inactive";

  return (
    <Badge className={cn("border", badgeClass, className)}>
      {label}
    </Badge>
  );
};
