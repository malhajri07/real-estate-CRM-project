import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminUserApprovalStatus } from "@/lib/rbacAdmin";

interface AdminStatusBadgeProps {
  approvalStatus?: AdminUserApprovalStatus | null;
  isActive: boolean;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "نشط", className: "bg-green-100 text-green-800 border-green-200" },
  inactive: { label: "غير نشط", className: "bg-gray-100 text-gray-800 border-gray-200" },
  pending: { label: "قيد المراجعة", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  needsInfo: { label: "مطلوب معلومات", className: "bg-orange-100 text-orange-800 border-orange-200" },
  rejected: { label: "مرفوض", className: "bg-red-100 text-red-800 border-red-200" },
  unknown: { label: "غير محدد", className: "bg-slate-100 text-slate-800 border-slate-200" },
};

const resolveStatusKey = (
  approvalStatus: AdminUserApprovalStatus | null | undefined,
  isActive: boolean,
): keyof typeof STATUS_MAP => {
  const normalized = approvalStatus?.toUpperCase();

  if (normalized === "PENDING") return "pending";
  if (normalized === "NEEDS_INFO") return "needsInfo";
  if (normalized === "REJECTED") return "rejected";

  if (normalized === "APPROVED") {
    return isActive ? "active" : "inactive";
  }

  return isActive ? "active" : "inactive";
};

export const AdminStatusBadge = ({ approvalStatus, isActive, className }: AdminStatusBadgeProps) => {
  const statusKey = resolveStatusKey(approvalStatus, isActive);
  const config = STATUS_MAP[statusKey] ?? STATUS_MAP.unknown;

  return (
    <Badge className={cn("border", config.className, className)}>
      {config.label}
    </Badge>
  );
};
