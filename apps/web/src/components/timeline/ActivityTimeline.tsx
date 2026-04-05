/**
 * ActivityTimeline.tsx - Activity Timeline Component
 *
 * Location: apps/web/src/ -> Components/ -> timeline/ -> ActivityTimeline.tsx
 *
 * Reusable vertical timeline for displaying activity history on leads, deals,
 * properties, and agent profiles. Features:
 * - Vertical timeline with dots and connecting lines
 * - Color-coded icons by activity type (call, email, meeting, note)
 * - Expandable detail sections
 * - "Load more" pagination
 * - Empty state fallback
 *
 * Dependencies:
 * - lucide-react icons
 * - framer-motion for animations
 * - @/components/ui/button, @/components/ui/avatar (optional)
 */

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Mail,
  Users,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Loader2,
  Inbox,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BORDER_RADIUS } from "@/config/design-tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType = "call" | "email" | "meeting" | "note" | string;

export interface TimelineItem {
  /** Unique identifier */
  id: string;
  /** Activity type determines icon and color */
  type: ActivityType;
  /** Short title */
  title: string;
  /** Optional description / summary */
  description?: string;
  /** Extended detail text (shown when expanded) */
  details?: string;
  /** ISO timestamp */
  timestamp: string;
  /** User who performed the activity */
  user?: {
    name: string;
    avatarUrl?: string;
    initials?: string;
  };
}

export interface ActivityTimelineProps {
  /** Items to display */
  items: TimelineItem[];
  /** Whether more items can be loaded */
  hasMore?: boolean;
  /** Called when "Load more" is clicked */
  onLoadMore?: () => void;
  /** Whether more items are currently loading */
  isLoadingMore?: boolean;
  /** Title shown above the timeline */
  title?: string;
  /** Message shown when items is empty */
  emptyMessage?: string;
  /** Additional className */
  className?: string;
  /** Max items to show initially (default: all) */
  initialVisibleCount?: number;
}

// ---------------------------------------------------------------------------
// Activity type configuration
// ---------------------------------------------------------------------------

interface ActivityConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

const ACTIVITY_CONFIGS: Record<string, ActivityConfig> = {
  call: {
    icon: Phone,
    color: "text-accent-foreground",
    bgColor: "bg-accent",
    borderColor: "border-primary/30",
    label: "مكالمة",
  },
  email: {
    icon: Mail,
    color: "text-primary",
    bgColor: "bg-primary/15",
    borderColor: "border-primary/30",
    label: "بريد إلكتروني",
  },
  meeting: {
    icon: Users,
    color: "text-secondary-foreground",
    bgColor: "bg-secondary",
    borderColor: "border-secondary-foreground/30",
    label: "اجتماع",
  },
  note: {
    icon: StickyNote,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    label: "ملاحظة",
  },
};

const DEFAULT_CONFIG: ActivityConfig = {
  icon: Calendar,
  color: "text-muted-foreground",
  bgColor: "bg-muted",
  borderColor: "border-border",
  label: "نشاط",
};

function getActivityConfig(type: ActivityType): ActivityConfig {
  return ACTIVITY_CONFIGS[type] ?? DEFAULT_CONFIG;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" }),
      time: d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { date: iso, time: "" };
  }
}

function UserAvatar({ user }: { user?: TimelineItem["user"] }) {
  if (!user) return null;

  const initials =
    user.initials ??
    user.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="h-6 w-6 rounded-full object-cover border border-border"
      />
    );
  }

  return (
    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border">
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline Item
// ---------------------------------------------------------------------------

function TimelineEntry({
  item,
  isLast,
  index,
}: {
  item: TimelineItem;
  isLast: boolean;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = getActivityConfig(item.type);
  const Icon = config.icon;
  const ts = formatTimestamp(item.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative flex gap-4"
    >
      {/* Timeline column: dot + line */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
            config.bgColor,
            config.borderColor,
          )}
        >
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground leading-tight">
                {item.title}
              </h4>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                  config.bgColor,
                  config.color,
                )}
              >
                {config.label}
              </span>
            </div>
            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {/* Timestamp + avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <UserAvatar user={item.user} />
            <div className="text-end">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ts.time}
              </p>
              <p className="text-xs text-muted-foreground">{ts.date}</p>
            </div>
          </div>
        </div>

        {/* Expandable details */}
        {item.details && (
          <>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  إخفاء التفاصيل
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  عرض التفاصيل
                </>
              )}
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground leading-relaxed">
                    {item.details}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* User name */}
        {item.user && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            بواسطة {item.user.name}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function TimelineEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ActivityTimeline({
  items,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  title,
  emptyMessage = "لا توجد أنشطة بعد",
  className,
  initialVisibleCount,
}: ActivityTimelineProps) {
  const [showAll, setShowAll] = useState(!initialVisibleCount);

  const visibleItems = useMemo(() => {
    if (showAll || !initialVisibleCount) return items;
    return items.slice(0, initialVisibleCount);
  }, [items, showAll, initialVisibleCount]);

  const canExpand = initialVisibleCount != null && items.length > initialVisibleCount && !showAll;

  if (items.length === 0) {
    return (
      <div className={className}>
        {title && (
          <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>
        )}
        <TimelineEmpty message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      )}

      <div className="relative">
        {visibleItems.map((item, index) => (
          <TimelineEntry
            key={item.id}
            item={item}
            isLast={index === visibleItems.length - 1 && !hasMore && !canExpand}
            index={index}
          />
        ))}
      </div>

      {/* Show all / load more */}
      <div className="flex justify-center gap-3">
        {canExpand && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(true)}
            className="gap-1.5"
          >
            <ChevronDown className="h-4 w-4" />
            عرض الكل ({items.length})
          </Button>
        )}

        {hasMore && onLoadMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="gap-1.5"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التحميل...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                تحميل المزيد
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default ActivityTimeline;
