/**
 * NotificationCenter.tsx — Notification Panel Component
 *
 * Location: apps/web/src/components/notification/NotificationCenter.tsx
 *
 * Features:
 * - Unread count badge in header
 * - Notification list grouped by date
 * - Notification types: lead, deal, appointment, system, message, alert
 * - Mark individual as read
 * - Mark all as read
 * - Click to navigate
 * - Empty state
 * - Loading skeleton
 * - Filter by type
 *
 * Dependencies:
 * - @/components/ui/card
 * - @/components/ui/button
 * - @/components/ui/badge
 * - @/components/ui/scroll-area
 * - lucide-react icons
 * - @/lib/utils (cn)
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Check,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Settings,
  Trash2,
  Filter,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType =
  | "lead"
  | "deal"
  | "appointment"
  | "system"
  | "message"
  | "alert";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  sender?: {
    name: string;
    avatarUrl?: string;
  };
  metadata?: Record<string, string>;
}

export interface NotificationCenterProps {
  notifications: NotificationItem[];
  isLoading?: boolean;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
  onNavigate?: (url: string) => void;
  className?: string;
}

// ─── Type Configs ───────────────────────────────────────────────────────────

interface NotifTypeConfig {
  icon: LucideIcon;
  label: string;
  dotColor: string;
  iconColor: string;
  bgColor: string;
}

const NOTIF_TYPE_CONFIGS: Record<NotificationType, NotifTypeConfig> = {
  lead: {
    icon: User,
    label: "عميل محتمل",
    dotColor: "bg-blue-500",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  deal: {
    icon: Building2,
    label: "صفقة",
    dotColor: "bg-emerald-500",
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  appointment: {
    icon: Calendar,
    label: "موعد",
    dotColor: "bg-purple-500",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  system: {
    icon: Settings,
    label: "نظام",
    dotColor: "bg-gray-500",
    iconColor: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  },
  message: {
    icon: MessageSquare,
    label: "رسالة",
    dotColor: "bg-teal-500",
    iconColor: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
  },
  alert: {
    icon: AlertTriangle,
    label: "تنبيه",
    dotColor: "bg-red-500",
    iconColor: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
};

// ─── Date Grouping ──────────────────────────────────────────────────────────

function getDateGroup(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const entryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (entryDate.getTime() === today.getTime()) return "اليوم";
    if (entryDate.getTime() === yesterday.getTime()) return "أمس";

    const diffDays = Math.floor(
      (today.getTime() - entryDate.getTime()) / 86400000
    );
    if (diffDays < 7) return "هذا الأسبوع";
    if (diffDays < 30) return "هذا الشهر";

    return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
  } catch {
    return "غير محدد";
  }
}

function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "الآن";
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return "أمس";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

// ─── Sender Avatar ──────────────────────────────────────────────────────────

function SenderAvatar({
  sender,
  typeConfig,
}: {
  sender?: NotificationItem["sender"];
  typeConfig: NotifTypeConfig;
}) {
  const Icon = typeConfig.icon;

  if (sender?.avatarUrl) {
    return (
      <img
        src={sender.avatarUrl}
        alt={sender.name}
        className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
        typeConfig.bgColor
      )}
    >
      <Icon className={cn("h-5 w-5", typeConfig.iconColor)} />
    </div>
  );
}

// ─── Single Notification ────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
  onNavigate,
}: {
  notification: NotificationItem;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onNavigate?: (url: string) => void;
}) {
  const config = NOTIF_TYPE_CONFIGS[notification.type];
  const relativeTime = formatRelativeTime(notification.createdAt);

  const handleClick = useCallback(() => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl && onNavigate) {
      onNavigate(notification.actionUrl);
    }
  }, [notification, onMarkRead, onNavigate]);

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-xl transition-colors group relative",
        !notification.isRead && "bg-primary/5 border border-primary/10",
        notification.isRead && "hover:bg-muted/50",
        (notification.actionUrl || onNavigate) && "cursor-pointer"
      )}
      onClick={handleClick}
      role={notification.actionUrl ? "button" : undefined}
      tabIndex={notification.actionUrl ? 0 : undefined}
      onKeyDown={
        notification.actionUrl
          ? (e) => e.key === "Enter" && handleClick()
          : undefined
      }
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-3 end-3 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Avatar */}
      <SenderAvatar sender={notification.sender} typeConfig={config} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4
            className={cn(
              "text-sm truncate",
              !notification.isRead
                ? "font-bold text-foreground"
                : "font-medium text-foreground"
            )}
          >
            {notification.title}
          </h4>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {notification.body}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
          >
            {config.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {relativeTime}
          </span>
          {notification.sender && (
            <span className="text-[10px] text-muted-foreground">
              من {notification.sender.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.isRead && onMarkRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            title="تعليم كمقروء"
          >
            <Check className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="حذف"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function NotificationEmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        {hasFilter ? (
          <Filter className="h-8 w-8 text-muted-foreground" />
        ) : (
          <BellOff className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">
        {hasFilter ? "لا توجد إشعارات بهذا الفلتر" : "لا توجد إشعارات"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {hasFilter
          ? "جرّب تغيير الفلتر لعرض إشعارات أخرى."
          : "ستظهر إشعاراتك هنا عندما يكون هناك تحديثات جديدة."}
      </p>
    </div>
  );
}

// ─── Filter Bar ─────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "lead", label: "عملاء" },
  { value: "deal", label: "صفقات" },
  { value: "appointment", label: "مواعيد" },
  { value: "message", label: "رسائل" },
  { value: "alert", label: "تنبيهات" },
  { value: "system", label: "نظام" },
];

function FilterBar({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: NotificationType | "all";
  onFilterChange: (filter: NotificationType | "all") => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onFilterChange(opt.value)}
          className={cn(
            "px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
            activeFilter === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function NotificationCenter({
  notifications,
  isLoading = false,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onNavigate,
  className,
}: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<NotificationType | "all">(
    "all"
  );
  const [showFilters, setShowFilters] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const filtered =
      activeFilter === "all"
        ? notifications
        : notifications.filter((n) => n.type === activeFilter);

    return [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, activeFilter]);

  const groupedNotifications = useMemo(() => {
    const groups: { label: string; items: NotificationItem[] }[] = [];
    let currentGroup: string | null = null;

    for (const notif of filteredNotifications) {
      const group = getDateGroup(notif.createdAt);
      if (group !== currentGroup) {
        groups.push({ label: group, items: [] });
        currentGroup = group;
      }
      groups[groups.length - 1].items.push(notif);
    }

    return groups;
  }, [filteredNotifications]);

  const hasActiveFilter = activeFilter !== "all";

  if (isLoading) {
    return (
      <Card className={cn("rounded-2xl shadow-sm", className)}>
        <CardHeader className="p-6 pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            الإشعارات
          </CardTitle>
        </CardHeader>
        <NotificationSkeleton />
      </Card>
    );
  }

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader className="p-6 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            الإشعارات
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </CardTitle>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              {showFilters ? "إخفاء" : "فلتر"}
            </Button>
            {unreadCount > 0 && onMarkAllRead && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={onMarkAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                قراءة الكل
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="mt-3">
            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {filteredNotifications.length === 0 ? (
          <div className="px-6 pb-6">
            <NotificationEmptyState hasFilter={hasActiveFilter} />
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4 px-4 pb-4">
              {groupedNotifications.map((group) => (
                <div key={group.label}>
                  {/* Date group header */}
                  <div className="flex items-center gap-3 py-2 px-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Notification items */}
                  <div className="space-y-1">
                    {group.items.map((notification) => (
                      <NotificationRow
                        key={notification.id}
                        notification={notification}
                        onMarkRead={onMarkRead}
                        onDelete={onDelete}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationCenter;
