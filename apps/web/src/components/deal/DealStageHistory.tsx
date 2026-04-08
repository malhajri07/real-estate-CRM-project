/**
 * DealStageHistory.tsx — Deal Stage Progression Timeline
 *
 * Location: apps/web/src/components/deal/DealStageHistory.tsx
 *
 * Features:
 * - Horizontal step indicator showing deal pipeline
 * - Each stage: name, date entered, duration in stage
 * - Current stage highlighted with pulse animation
 * - Won/Lost final state with date
 * - Color progression from gray to primary
 * - Responsive: horizontal on desktop, vertical on mobile
 *
 * Dependencies:
 * - @/components/ui/card
 * - lucide-react icons
 * - @/lib/utils (cn)
 */

import React, { useMemo } from "react";
import {
  Check,
  Clock,
  Trophy,
  XCircle,
  ArrowRight,
  CalendarDays,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StageHistoryEntry {
  stage: string;
  label: string;
  enteredAt: string;
  exitedAt?: string;
  durationDays?: number;
}

export type DealOutcome = "won" | "lost" | "active";

export interface DealStageHistoryProps {
  stages: StageHistoryEntry[];
  currentStage: string;
  outcome?: DealOutcome;
  outcomeDate?: string;
  className?: string;
}

// ─── Stage Config ────────────────────────────────────────────────────────────

const PIPELINE_ORDER = [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
  "closing",
];

const STAGE_LABELS: Record<string, string> = {
  prospecting: "استكشاف",
  qualification: "تأهيل",
  proposal: "عرض",
  negotiation: "تفاوض",
  closing: "إغلاق",
  won: "مكسب",
  lost: "خسارة",
};

function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar-SA", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatFullDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function computeDuration(enteredAt: string, exitedAt?: string): number {
  try {
    const start = new Date(enteredAt).getTime();
    const end = exitedAt ? new Date(exitedAt).getTime() : Date.now();
    return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

function formatDuration(days: number): string {
  if (days === 0) return "أقل من يوم";
  if (days === 1) return "يوم واحد";
  if (days <= 10) return `${days} أيام`;
  return `${days} يوم`;
}

// ─── Stage Step (Desktop Horizontal) ─────────────────────────────────────────

type StepStatus = "completed" | "current" | "upcoming";

function getStepStatus(
  stageKey: string,
  currentStage: string,
  stageHistory: Set<string>
): StepStatus {
  if (stageKey === currentStage) return "current";
  if (stageHistory.has(stageKey)) return "completed";
  return "upcoming";
}

function StepIcon({
  status,
  outcome,
}: {
  status: StepStatus;
  outcome?: DealOutcome;
}) {
  if (status === "completed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm">
        <Check className="h-4 w-4" />
      </div>
    );
  }

  if (status === "current") {
    if (outcome === "won") {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/100 text-white shadow-md ring-4 ring-primary/15 dark:ring-primary/30">
          <Trophy className="h-4 w-4" />
        </div>
      );
    }
    if (outcome === "lost") {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/100 text-white shadow-md ring-4 ring-destructive/15 dark:ring-destructive/30">
          <XCircle className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md ring-4 ring-primary/20 animate-pulse">
        <Clock className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border-2 border-border text-muted-foreground">
      <div className="h-2 w-2 rounded-full bg-current" />
    </div>
  );
}

function HorizontalStep({
  stage,
  historyEntry,
  status,
  outcome,
  isLast,
}: {
  stage: string;
  historyEntry?: StageHistoryEntry;
  status: StepStatus;
  outcome?: DealOutcome;
  isLast: boolean;
}) {
  const label = getStageLabel(stage);
  const durationDays = historyEntry
    ? historyEntry.durationDays ?? computeDuration(historyEntry.enteredAt, historyEntry.exitedAt)
    : 0;

  return (
    <div className="flex flex-col items-center flex-1 min-w-0 relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute top-4 start-1/2 w-full h-0.5 z-0">
          <div
            className={cn(
              "h-full transition-colors",
              status === "completed" || status === "current"
                ? "bg-primary"
                : "bg-border"
            )}
          />
        </div>
      )}

      {/* Step icon */}
      <div className="relative z-10">
        <StepIcon status={status} outcome={status === "current" ? outcome : undefined} />
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <p
          className={cn(
            "text-xs font-bold",
            status === "current" ? "text-primary" : status === "completed" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </p>

        {historyEntry && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatShortDate(historyEntry.enteredAt)}
          </p>
        )}

        {historyEntry && status !== "upcoming" && (
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5">
            <Timer className="h-2.5 w-2.5" />
            {formatDuration(durationDays)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Vertical Step (Mobile) ──────────────────────────────────────────────────

function VerticalStep({
  stage,
  historyEntry,
  status,
  outcome,
  isLast,
}: {
  stage: string;
  historyEntry?: StageHistoryEntry;
  status: StepStatus;
  outcome?: DealOutcome;
  isLast: boolean;
}) {
  const label = getStageLabel(stage);
  const durationDays = historyEntry
    ? historyEntry.durationDays ?? computeDuration(historyEntry.enteredAt, historyEntry.exitedAt)
    : 0;

  return (
    <div className="flex gap-3">
      {/* Rail */}
      <div className="flex flex-col items-center">
        <StepIcon status={status} outcome={status === "current" ? outcome : undefined} />
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 min-h-[32px]",
              status === "completed" || status === "current"
                ? "bg-primary"
                : "bg-border"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn("pb-4 flex-1", isLast && "pb-0")}>
        <p
          className={cn(
            "text-sm font-bold",
            status === "current" ? "text-primary" : status === "completed" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </p>

        {historyEntry && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatFullDate(historyEntry.enteredAt)}
            </span>
            {status !== "upcoming" && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {formatDuration(durationDays)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Outcome Badge ───────────────────────────────────────────────────────────

function OutcomeBadge({
  outcome,
  date,
}: {
  outcome: DealOutcome;
  date?: string;
}) {
  if (outcome === "active") return null;

  const isWon = outcome === "won";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold",
        isWon
          ? "bg-primary/10 text-primary dark:bg-primary/90/30 dark:text-primary"
          : "bg-destructive/10 text-destructive dark:bg-destructive/90/30 dark:text-destructive"
      )}
    >
      {isWon ? (
        <Trophy className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <span>{isWon ? "صفقة ناجحة" : "صفقة خاسرة"}</span>
      {date && (
        <span className="text-xs opacity-70 ms-2">
          ({formatFullDate(date)})
        </span>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DealStageHistory({
  stages,
  currentStage,
  outcome = "active",
  outcomeDate,
  className,
}: DealStageHistoryProps) {
  const historyMap = useMemo(() => {
    const map = new Map<string, StageHistoryEntry>();
    for (const entry of stages) {
      map.set(entry.stage, entry);
    }
    return map;
  }, [stages]);

  const visitedStages = useMemo(
    () => new Set(stages.map((s) => s.stage)),
    [stages]
  );

  const pipelineStages = useMemo(() => {
    // Use standard pipeline or derive from history
    const allStages = [...PIPELINE_ORDER];
    // Include any custom stages from history that aren't in pipeline
    for (const entry of stages) {
      if (!allStages.includes(entry.stage)) {
        allStages.push(entry.stage);
      }
    }
    return allStages;
  }, [stages]);

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader className="p-6 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            مراحل الصفقة
          </CardTitle>
          <OutcomeBadge outcome={outcome} date={outcomeDate} />
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {/* Desktop: horizontal */}
        <div className="hidden md:flex items-start gap-0">
          {pipelineStages.map((stage, idx) => (
            <HorizontalStep
              key={stage}
              stage={stage}
              historyEntry={historyMap.get(stage)}
              status={getStepStatus(stage, currentStage, visitedStages)}
              outcome={outcome}
              isLast={idx === pipelineStages.length - 1}
            />
          ))}
        </div>

        {/* Mobile: vertical */}
        <div className="md:hidden">
          {pipelineStages.map((stage, idx) => (
            <VerticalStep
              key={stage}
              stage={stage}
              historyEntry={historyMap.get(stage)}
              status={getStepStatus(stage, currentStage, visitedStages)}
              outcome={outcome}
              isLast={idx === pipelineStages.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default DealStageHistory;
