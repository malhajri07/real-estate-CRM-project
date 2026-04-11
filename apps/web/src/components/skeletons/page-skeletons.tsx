/**
 * page-skeletons.tsx — Structural skeleton components for every page type
 *
 * Each skeleton mirrors the actual page layout so users see the page
 * structure during loading, not a generic spinner.
 */

import { Skeleton } from "@/components/ui/skeleton";

// ── Shared building blocks ──────────────────────────────────────────────────

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 space-y-3 ${className}`}>
      <Skeleton className="h-4 w-24 rounded-lg" />
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-3 w-20 rounded-lg" />
    </div>
  );
}

function SkeletonMetricRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}


function SkeletonChartArea({ height = "h-72" }: { height?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 ${height}`}>
      <Skeleton className="h-4 w-32 rounded-lg mb-4" />
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  );
}

function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border last:border-0">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40 rounded-lg" />
        <Skeleton className="h-3 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// ── Page-specific skeletons ──────────────────────────────────────────────

/** Pipeline / Kanban board skeleton — 4 stat cards + 5-col kanban */
export function PipelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-3 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* 5-column kanban */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-20 rounded-lg" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            {Array.from({ length: col === 0 ? 3 : 2 }).map((_, card) => (
              <div key={card} className="rounded-xl border border-border p-3 space-y-2">
                <Skeleton className="h-4 w-28 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-lg" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16 rounded-lg" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Calendar skeleton — 5 stat cards + week nav + weekly grid */
export function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 5 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-3 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-16 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-48 rounded-lg" />
      </div>
      {/* Weekly grid */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border">
          <Skeleton className="h-16 w-full" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 text-center border-s border-border space-y-1">
              <Skeleton className="h-3 w-8 rounded mx-auto" />
              <Skeleton className="h-7 w-7 rounded mx-auto" />
            </div>
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, row) => (
          <div key={row} className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border last:border-0" style={{ minHeight: "48px" }}>
            <div className="border-e border-border flex items-start justify-center pt-1">
              <Skeleton className="h-3 w-10 rounded" />
            </div>
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="border-s border-border p-1">
                {(row === 1 && col === 2) || (row === 3 && col === 5) || (row === 5 && col === 0) || (row === 7 && col === 3) ? (
                  <Skeleton className="h-6 w-full rounded" />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Agencies / Card grid skeleton */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="space-y-6 animate-pulse">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded-lg" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Favorites / Property card grid */
export function FavoritesSkeleton() {
  return <CardGridSkeleton cards={6} />;
}

/** Client detail skeleton (sidebar + main) */
export function ClientDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 3 stat cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-3 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Sidebar + content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client info sidebar */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-28 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-20 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
          ))}
        </div>
        {/* Activity list */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-5 w-28 rounded-lg" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Notifications skeleton */
export function NotificationsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    </div>
  );
}

/** Reports / Analytics skeleton — filter bar + 4 metrics + 6 tabs + charts */
export function ReportsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Period filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-lg" />
        ))}
      </div>
      <SkeletonMetricRow count={4} />
      {/* 6 tabs */}
      <div className="grid w-full grid-cols-6 gap-1 rounded-lg bg-muted p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChartArea />
        <SkeletonChartArea />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-5 w-32 rounded-lg mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg flex-1" />
            <Skeleton className="h-4 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Settings skeleton — profile summary + sidebar nav + form content */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile summary card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-5">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3 w-48 rounded-lg" />
            <Skeleton className="h-2 w-full max-w-xs rounded-full" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      {/* Sidebar + content */}
      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 shrink-0 hidden md:block space-y-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        {/* Form content */}
        <div className="flex-1 min-w-0 rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Forum / Community skeleton — channel sidebar (lg:col-span-1) + compose box + posts (lg:col-span-3) */
export function ForumSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-4 animate-pulse">
      {/* Channel sidebar */}
      <div className="hidden lg:block lg:col-span-1 space-y-3">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <Skeleton className="h-5 w-20 rounded-lg mb-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
      {/* Posts feed */}
      <div className="lg:col-span-3 space-y-4">
        {/* Compose box */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>
        {/* Post cards */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-3 w-16 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-7 w-14 rounded-lg" />
              <Skeleton className="h-7 w-14 rounded-lg" />
              <Skeleton className="h-7 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Saved searches skeleton — vertical card stack */
export function SavedSearchesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compare properties skeleton */
export function CompareSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-3 w-20 rounded-lg" />
                  <Skeleton className="h-3 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tenants page skeleton — 4 stat cards + tenancy card list */
export function TenantsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-3 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Tenancy card list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-36 rounded-lg" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-20 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-16 rounded-lg" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pool page skeleton — 2 tabs + 4 stat cards + filter bar + table */
export function PoolSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Tab bar */}
      <div className="grid w-full grid-cols-2 max-w-md gap-1 rounded-lg bg-muted p-1">
        <Skeleton className="h-9 rounded-md" />
        <Skeleton className="h-9 rounded-md" />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-3 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-6 w-px" />
        <Skeleton className="h-7 w-16 rounded-lg" />
        <Skeleton className="h-7 w-16 rounded-lg" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-14 rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/50 flex gap-4 px-4 py-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 rounded-lg" style={{ width: i === 0 ? 30 : i === 3 ? 80 : 60 }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
            <Skeleton className="h-4 w-6 rounded-lg" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Inbox page skeleton — conversation list sidebar + chat area */
export function InboxSkeleton() {
  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px] animate-pulse">
      {/* Conversation list */}
      <div className="w-80 flex-shrink-0 rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <Skeleton className="h-4 w-20 rounded-lg" />
        </div>
        <div className="p-2 space-y-2 border-b">
          <Skeleton className="h-8 w-full rounded-lg" />
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-12 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 divide-y divide-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-10 rounded-lg" />
                </div>
                <Skeleton className="h-3 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat area */}
      <div className="flex-1 rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl ms-auto" />
          <Skeleton className="h-10 w-56 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl ms-auto" />
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        <div className="p-3 border-t">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Projects page skeleton — 5 stat cards + project card grid */
export function ProjectsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 5 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-20 rounded-lg" />
            <Skeleton className="h-7 w-12 rounded-lg" />
          </div>
        ))}
      </div>
      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-5 w-36 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-24 rounded-lg" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-20 rounded-lg" />
                <Skeleton className="h-3 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24 rounded-lg" />
                <Skeleton className="h-3 w-12 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Broker requests page skeleton — 4 stat cards + search + filter chips + request cards grid */
export function BrokerRequestsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-3 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="rounded-2xl border border-border bg-card p-2 flex items-center gap-3">
        <Skeleton className="h-5 w-5 ms-2 rounded" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>

      {/* Filter chips row */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-6 w-px" />
        <Skeleton className="h-7 w-16 rounded-lg" />
        <Skeleton className="h-7 w-16 rounded-lg" />
        <Skeleton className="h-7 w-16 rounded-lg" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-14 rounded-lg" />
      </div>

      {/* Request cards grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-36 rounded-lg" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-3 w-20 rounded-lg" />
              <Skeleton className="h-3 w-16 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-px w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 rounded-lg" />
              <Skeleton className="h-3 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Team management page skeleton — tab bar + 8 stat cards + 2×two-col rows */
export function TeamPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-lg" style={{ width: i === 0 ? 110 : i === 4 ? 100 : 80 }} />
        ))}
      </div>

      {/* 8 stat cards — grid-cols-2 sm:4 lg:8 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-3 space-y-2 text-center">
            <Skeleton className="h-4 w-4 mx-auto rounded" />
            <Skeleton className="h-6 w-10 mx-auto rounded-lg" />
            <Skeleton className="h-2 w-14 mx-auto rounded-lg" />
          </div>
        ))}
      </div>

      {/* Row 1: health card + leaderboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Health card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center p-2 rounded-xl bg-muted/50 space-y-2">
                <Skeleton className="h-5 w-8 mx-auto rounded-lg" />
                <Skeleton className="h-2 w-16 mx-auto rounded-lg" />
              </div>
            ))}
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
        {/* Leaderboard card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-8 w-[130px] rounded-lg" />
          </div>
          <div className="flex items-end justify-center gap-3 h-[140px]">
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-3 w-14 rounded-lg" />
              <Skeleton className="w-16 h-[50px] rounded-t-lg" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-lg" />
              <Skeleton className="w-16 h-[70px] rounded-t-lg" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-3 w-14 rounded-lg" />
              <Skeleton className="w-16 h-[35px] rounded-t-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: chart + activity list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonChartArea height="h-[350px]" />
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-5 w-36 rounded-lg" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Admin page skeleton — header card + metric row + table */
export function AdminPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      {/* Metric cards */}
      <SkeletonMetricRow count={4} />
      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
            <Skeleton className="h-4 w-8 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg flex-1" />
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Admin settings / config page skeleton */
export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-3 w-20 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Map page skeleton */
export function MapSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] animate-pulse">
      {/* Sidebar property list */}
      <div className="w-96 border-e border-border bg-card overflow-hidden shrink-0">
        <div className="p-4 border-b border-border space-y-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-border space-y-2">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-lg" />
          </div>
        ))}
      </div>
      {/* Map area */}
      <div className="flex-1 bg-muted/30">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}

/** Property detail skeleton — hero image + tabs + sidebar */
export function PropertyDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero image */}
      <Skeleton className="h-[400px] w-full rounded-2xl" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title + price */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-64 rounded-lg" />
                <Skeleton className="h-4 w-48 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            <Skeleton className="h-9 w-40 rounded-lg" />
            {/* Feature icons row */}
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
          {/* Description */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
          {/* Details grid */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-border">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Leads page skeleton — search bar + filter tabs + table */
export function LeadsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Search + filter bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      {/* Tab triggers */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-muted/50">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20 rounded-lg" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
            <Skeleton className="h-4 w-8 rounded-lg" />
            <Skeleton className="h-4 w-28 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg flex-1" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Properties list skeleton — view toggle + grid of property cards */
export function PropertiesGridSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Toolbar: search + view toggle */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>
      {/* Property cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-4 w-28 rounded-lg" />
              <div className="flex items-center gap-3 pt-1">
                <Skeleton className="h-4 w-14 rounded-lg" />
                <Skeleton className="h-4 w-14 rounded-lg" />
                <Skeleton className="h-4 w-14 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-32 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Post listing wizard skeleton — step indicator + form card */
export function PostListingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Step progress */}
      <div className="flex items-center justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-lg hidden sm:block" />
            {i < 3 && <Skeleton className="h-px w-12 mx-1" />}
          </div>
        ))}
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      {/* Form card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3 w-56 rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Activities skeleton — 4 stat cards + table */
export function ActivitiesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 5 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-3 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Search + filters */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-40 rounded-lg flex-1" />
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Campaigns skeleton — 4 stat cards + 6 tabs + suggestion cards */
export function CampaignsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-10 rounded-lg" />
              <Skeleton className="h-3 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* 6 tabs */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-lg" style={{ width: i === 0 ? 90 : 80 }} />
        ))}
      </div>
      {/* Suggestion cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-3 w-full rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Promotions skeleton — stats + cards with thumbnails */
export function PromotionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
            <Skeleton className="h-20 w-28 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
              <div className="grid grid-cols-4 gap-3 pt-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Re-export existing skeletons for convenience
export { DashboardSkeleton, FullPageSkeleton } from "./dashboard-skeleton";
export { TableSkeleton } from "./table-skeleton";
