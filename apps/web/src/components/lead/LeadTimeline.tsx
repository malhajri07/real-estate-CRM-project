/**
 * LeadTimeline.tsx — Lead Activity Timeline Component
 *
 * Location: apps/web/src/components/lead/LeadTimeline.tsx
 *
 * Features:
 * - Vertical timeline with colored dots
 * - Activity types: call, email, meeting, viewing, note, status_change
 * - Each entry: icon, title, description, timestamp, user
 * - Expandable notes
 * - "Add activity" inline button
 * - Empty state
 * - Grouped by date
 *
 * Dependencies:
 * - @/components/ui/card
 * - @/components/ui/button
 * - @/components/ui/badge
 * - lucide-react icons
 * - @/lib/utils (cn)
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  Phone,
  Mail,
  Users,
  Eye,
  StickyNote,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  MessageSquare,
  FileText,
  type LucideIcon,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LeadActivityType =
  | "call"
  | "email"
  | "meeting"
  | "viewing"
  | "note"
  | "status_change"
  | "message"
  | "document"
  | string;

export interface LeadTimelineEntry {
  id: string;
  type: LeadActivityType;
  title: string;
  description?: string;
  notes?: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    duration?: string;
    outcome?: string;
    [key: string]: string | undefined;
  };
}

export interface LeadTimelineProps {
  entries: LeadTimelineEntry[];
  leadName?: string;
  isLoading?: boolean;
  onAddActivity?: () => void;
  onEntryClick?: (entry: LeadTimelineEntry) => void;
  className?: string;
}

// ─── Activity Type Config ────────────────────────────────────────────────────

interface ActivityTypeConfig {
  icon: LucideIcon;
  label: string;
  dotColor: string;
  iconColor: string;
  bgColor: string;
  badgeVariant: "default" | "secondary" | "success" | "warning" | "info" | "purple" | "orange";
}

const ACTIVITY_TYPE_CONFIGS: Record<string, ActivityTypeConfig> = {
  call: {
    icon: Phone,
    label: "مكالمة",
    dotColor: "bg-accent0",
    iconColor: "text-accent-foreground",
    bgColor: "bg-accent dark:bg-accent-foreground/30",
    badgeVariant: "info",
  },
  email: {
    icon: Mail,
    label: "بريد إلكتروني",
    dotColor: "bg-primary/100",
    iconColor: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/90/30",
    badgeVariant: "success",
  },
  meeting: {
    icon: Users,
    label: "اجتماع",
    dotColor: "bg-secondary0",
    iconColor: "text-secondary-foreground",
    bgColor: "bg-secondary dark:bg-secondary-foreground/30",
    badgeVariant: "purple",
  },
  viewing: {
    icon: Eye,
    label: "معاينة عقار",
    dotColor: "bg-[hsl(var(--warning)/0.1)]0",
    iconColor: "text-[hsl(var(--warning))]",
    bgColor: "bg-[hsl(var(--warning)/0.1)] dark:bg-[hsl(var(--warning))]/30",
    badgeVariant: "warning",
  },
  note: {
    icon: StickyNote,
    label: "ملاحظة",
    dotColor: "bg-gray-400",
    iconColor: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    badgeVariant: "secondary",
  },
  status_change: {
    icon: RefreshCw,
    label: "تغيير الحالة",
    dotColor: "bg-[hsl(var(--warning)/0.1)]0",
    iconColor: "text-[hsl(var(--warning))]",
    bgColor: "bg-[hsl(var(--warning)/0.1)] dark:bg-[hsl(var(--warning))]/30",
    badgeVariant: "orange",
  },
  message: {
    icon: MessageSquare,
    label: "رسالة",
    dotColor: "bg-primary/100",
    iconColor: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/90/30",
    badgeVariant: "default",
  },
  document: {
    icon: FileText,
    label: "مستند",
    dotColor: "bg-accent0",
    iconColor: "text-accent-foreground",
    bgColor: "bg-accent dark:bg-accent-foreground/30",
    badgeVariant: "info",
  },
};

const DEFAULT_TYPE_CONFIG: ActivityTypeConfig = {
  icon: Calendar,
  label: "نشاط",
  dotColor: "bg-muted-foreground",
  iconColor: "text-muted-foreground",
  bgColor: "bg-muted",
  badgeVariant: "secondary",
};

function getTypeConfig(type: LeadActivityType): ActivityTypeConfig {
  return ACTIVITY_TYPE_CONFIGS[type] ?? DEFAULT_TYPE_CONFIG;
}

// ─── Date Formatting ─────────────────────────────────────────────────────────

function formatEntryTimestamp(iso: string): {
  time: string;
  date: string;
  relative: string;
} {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let relative: string;
    if (diffHours < 1) relative = "منذ قليل";
    else if (diffHours < 24) relative = `منذ ${diffHours} ساعة`;
    else if (diffDays === 1) relative = "أمس";
    else if (diffDays < 7) relative = `منذ ${diffDays} أيام`;
    else relative = d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });

    return {
      time: d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      date: d.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      relative,
    };
  } catch {
    return { time: "", date: iso, relative: iso };
  }
}

function getDateGroup(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const entryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (entryDate.getTime() === today.getTime()) return "اليوم";
    if (entryDate.getTime() === yesterday.getTime()) return "أمس";

    const diffDays = Math.floor((today.getTime() - entryDate.getTime()) / 86400000);
    if (diffDays < 7) return "هذا الأسبوع";
    if (diffDays < 30) return "هذا الشهر";

    return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
  } catch {
    return "غير محدد";
  }
}

// ─── User Initials ───────────────────────────────────────────────────────────

function UserBubble({ user }: { user?: LeadTimelineEntry["user"] }) {
  if (!user) return null;

  const initials = user.name
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
    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
      {initials}
    </div>
  );
}

// ─── Single Timeline Entry ───────────────────────────────────────────────────

function TimelineEntryCard({
  entry,
  isLast,
  onClick,
}: {
  entry: LeadTimelineEntry;
  isLast: boolean;
  onClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = getTypeConfig(entry.type);
  const Icon = config.icon;
  const ts = formatEntryTimestamp(entry.timestamp);

  const hasExpandableContent = Boolean(entry.notes);

  return (
    <div className="relative flex gap-4">
      {/* Timeline rail */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-card shadow-sm z-10",
            config.dotColor
          )}
        >
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border min-h-[24px]" />}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex-1 pb-5 min-w-0",
          isLast && "pb-0",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground leading-tight">
                {entry.title}
              </h4>
              <Badge variant={config.badgeVariant} className="text-[10px]">
                {config.label}
              </Badge>
            </div>

            {/* Description */}
            {entry.description && (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {entry.description}
              </p>
            )}

            {/* Status change metadata */}
            {entry.type === "status_change" && entry.metadata?.oldStatus && (
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {entry.metadata.oldStatus}
                </span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                  {entry.metadata.newStatus}
                </span>
              </div>
            )}

            {/* Call duration / outcome */}
            {entry.metadata?.duration && (
              <p className="mt-1 text-xs text-muted-foreground">
                المدة: {entry.metadata.duration}
                {entry.metadata.outcome && ` - النتيجة: ${entry.metadata.outcome}`}
              </p>
            )}
          </div>

          {/* Timestamp + user */}
          <div className="flex items-center gap-2 shrink-0">
            <UserBubble user={entry.user} />
            <div className="text-end">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ts.time}
              </p>
              <p className="text-[10px] text-muted-foreground">{ts.relative}</p>
            </div>
          </div>
        </div>

        {/* Expandable notes */}
        {hasExpandableContent && (
          <div className="mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  إخفاء الملاحظات
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  عرض الملاحظات
                </>
              )}
            </button>

            {expanded && (
              <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground leading-relaxed">
                {entry.notes}
              </div>
            )}
          </div>
        )}

        {/* User attribution */}
        {entry.user && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            بواسطة {entry.user.name}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function TimelineEmptyState({ onAddActivity }: { onAddActivity?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">
        لا توجد أنشطة بعد
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-4">
        سجل أنشطتك مع هذا العميل المحتمل لتتبع التقدم في الصفقة.
      </p>
      {onAddActivity && (
        <Button size="sm" onClick={onAddActivity} className="gap-1.5">
          <Plus className="h-4 w-4" />
          إضافة نشاط
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LeadTimeline({
  entries,
  leadName,
  isLoading = false,
  onAddActivity,
  onEntryClick,
  className,
}: LeadTimelineProps) {
  // Group entries by date
  const groupedEntries = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const groups: { label: string; items: LeadTimelineEntry[] }[] = [];
    let currentGroup: string | null = null;

    for (const entry of sorted) {
      const group = getDateGroup(entry.timestamp);
      if (group !== currentGroup) {
        groups.push({ label: group, items: [] });
        currentGroup = group;
      }
      groups[groups.length - 1].items.push(entry);
    }

    return groups;
  }, [entries]);

  if (isLoading) {
    return (
      <Card className={cn("rounded-2xl shadow-sm", className)}>
        <CardContent className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader className="p-6 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">
            {leadName ? `سجل أنشطة ${leadName}` : "سجل الأنشطة"}
          </CardTitle>
          {onAddActivity && entries.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddActivity}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              نشاط جديد
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {entries.length === 0 ? (
          <TimelineEmptyState onAddActivity={onAddActivity} />
        ) : (
          <div className="space-y-6">
            {groupedEntries.map((group) => (
              <div key={group.label}>
                {/* Date group label */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Entries */}
                <div>
                  {group.items.map((entry, idx) => (
                    <TimelineEntryCard
                      key={entry.id}
                      entry={entry}
                      isLast={idx === group.items.length - 1}
                      onClick={onEntryClick ? () => onEntryClick(entry) : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LeadTimeline;
