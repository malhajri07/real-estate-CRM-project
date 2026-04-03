/**
 * StatusIndicator — Reusable status display components
 *
 * Provides consistent status indicators across the application:
 * - StatusDot: colored dot with label
 * - StatusBadge: badge with icon and label
 * - StatusTimeline: horizontal status progression
 * - ConnectionStatus: online/offline indicator
 * - HealthStatus: service health display
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Loader2,
  Circle, Wifi, WifiOff, Server, Database, Shield,
  Activity, Zap, Heart,
} from "lucide-react";

// ── Status Types ────────────────────────────────────────────────────────────

export type StatusType = "success" | "warning" | "error" | "info" | "pending" | "inactive" | "loading";

const STATUS_CONFIG: Record<StatusType, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  dotColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    label: "نشط",
    dotColor: "bg-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    label: "تحذير",
    dotColor: "bg-amber-500",
  },
  error: {
    icon: XCircle,
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    label: "خطأ",
    dotColor: "bg-rose-500",
  },
  info: {
    icon: Activity,
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    label: "معلومات",
    dotColor: "bg-sky-500",
  },
  pending: {
    icon: Clock,
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    label: "قيد الانتظار",
    dotColor: "bg-yellow-500",
  },
  inactive: {
    icon: Circle,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    label: "غير نشط",
    dotColor: "bg-gray-400",
  },
  loading: {
    icon: Loader2,
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-primary/20",
    label: "جاري التحميل",
    dotColor: "bg-primary",
  },
};

// ── StatusDot ───────────────────────────────────────────────────────────────

interface StatusDotProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

/**
 * StatusDot — Small colored dot indicator
 *
 * Usage:
 * ```tsx
 * <StatusDot status="success" label="متصل" />
 * <StatusDot status="error" pulse />
 * ```
 */
export function StatusDot({ status, label, size = "md", pulse = false, className }: StatusDotProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  }[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex">
        {pulse && (
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", config.dotColor)} />
        )}
        <span className={cn("relative inline-flex rounded-full", sizeClasses, config.dotColor)} />
      </span>
      {label && <span className={cn("text-xs font-bold", config.color)}>{label}</span>}
    </div>
  );
}

// ── StatusBadge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * StatusBadge — Badge with icon and colored background
 */
export function StatusBadge({ status, label, showIcon = true, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border",
        config.bgColor,
        config.color,
        config.borderColor,
        status === "loading" && "[&>svg]:animate-spin",
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {label || config.label}
    </Badge>
  );
}

// ── StatusTimeline ──────────────────────────────────────────────────────────

interface StatusTimelineStep {
  id: string;
  label: string;
  status: "completed" | "current" | "upcoming";
  date?: string;
}

interface StatusTimelineProps {
  steps: StatusTimelineStep[];
  className?: string;
}

/**
 * StatusTimeline — Horizontal step indicator
 */
export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full border-2 text-xs font-bold transition-colors",
                step.status === "completed" && "bg-primary border-primary text-primary-foreground",
                step.status === "current" && "border-primary text-primary bg-primary/10",
                step.status === "upcoming" && "border-border text-muted-foreground"
              )}>
                {step.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-bold">{step.label}</p>
              {step.date && <p className="text-xs opacity-80">{step.date}</p>}
            </TooltipContent>
          </Tooltip>
          {i < steps.length - 1 && (
            <div className={cn(
              "h-0.5 w-6 rounded-full",
              step.status === "completed" ? "bg-primary" : "bg-border"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── ConnectionStatus ────────────────────────────────────────────────────────

interface ConnectionStatusProps {
  isOnline: boolean;
  latency?: number;
  className?: string;
}

/**
 * ConnectionStatus — Online/offline indicator with latency
 */
export function ConnectionStatus({ isOnline, latency, className }: ConnectionStatusProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-primary" />
          <StatusDot status="success" pulse size="sm" />
          <span className="text-xs font-bold text-primary">متصل</span>
          {latency != null && (
            <span className="text-[10px] text-muted-foreground">{latency}ms</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <StatusDot status="error" size="sm" />
          <span className="text-xs font-bold text-destructive">غير متصل</span>
        </>
      )}
    </div>
  );
}

// ── HealthStatus ────────────────────────────────────────────────────────────

interface ServiceHealth {
  name: string;
  status: StatusType;
  responseTime?: number;
  uptime?: number;
  icon?: typeof Server;
}

interface HealthStatusProps {
  services: ServiceHealth[];
  className?: string;
}

/**
 * HealthStatus — System health overview
 */
export function HealthStatus({ services, className }: HealthStatusProps) {
  const allHealthy = services.every(s => s.status === "success");
  const hasWarnings = services.some(s => s.status === "warning");
  const hasErrors = services.some(s => s.status === "error");

  const overallStatus: StatusType = hasErrors ? "error" : hasWarnings ? "warning" : "success";
  const overallLabel = hasErrors ? "مشكلة في النظام" : hasWarnings ? "تحذيرات" : "جميع الخدمات تعمل";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <StatusBadge status={overallStatus} label={overallLabel} />
        <span className="text-[10px] text-muted-foreground">
          {services.filter(s => s.status === "success").length}/{services.length} نشط
        </span>
      </div>
      <div className="space-y-2">
        {services.map((service) => {
          const Icon = service.icon || Server;
          const config = STATUS_CONFIG[service.status];
          return (
            <div key={service.name} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", config.color)} />
                <span className="text-xs font-bold">{service.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {service.responseTime != null && (
                  <span className="text-[10px] text-muted-foreground">{service.responseTime}ms</span>
                )}
                {service.uptime != null && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Progress value={service.uptime} className="h-1.5 w-12" />
                    </TooltipTrigger>
                    <TooltipContent>{service.uptime}% وقت التشغيل</TooltipContent>
                  </Tooltip>
                )}
                <StatusDot status={service.status} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pre-built service configurations ────────────────────────────────────────

export const DEFAULT_SERVICES: ServiceHealth[] = [
  { name: "واجهة API", status: "success", responseTime: 45, uptime: 99.9, icon: Server },
  { name: "قاعدة البيانات", status: "success", responseTime: 12, uptime: 99.99, icon: Database },
  { name: "الأمان", status: "success", uptime: 100, icon: Shield },
  { name: "الإشعارات", status: "success", responseTime: 89, uptime: 99.5, icon: Zap },
  { name: "المراقبة", status: "success", uptime: 99.8, icon: Heart },
];
