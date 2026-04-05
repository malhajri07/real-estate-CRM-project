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

// ── Page-specific skeletons ─────���───────────────────────────────────────────

/** Pipeline / Kanban board skeleton */
export function PipelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

/** Calendar / Weekly grid skeleton (Google Calendar style) */
export function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
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
        {/* Day headers */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border">
          <Skeleton className="h-16 w-full" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 text-center border-s border-border space-y-1">
              <Skeleton className="h-3 w-8 rounded mx-auto" />
              <Skeleton className="h-7 w-7 rounded mx-auto" />
            </div>
          ))}
        </div>
        {/* Time rows */}
        {Array.from({ length: 8 }).map((_, row) => (
          <div key={row} className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border last:border-0" style={{ minHeight: "48px" }}>
            <div className="border-e border-border flex items-start justify-center pt-1">
              <Skeleton className="h-3 w-10 rounded" />
            </div>
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="border-s border-border p-1">
                {(row === 1 && col === 2) || (row === 3 && col === 5) || (row === 5 && col === 0) ? (
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

/** Reports / Analytics skeleton */
export function ReportsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      <SkeletonMetricRow count={4} />
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

/** Settings skeleton */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
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

/** Forum / Community skeleton */
export function ForumSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Channel sidebar */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <Skeleton className="h-5 w-20 rounded-lg mb-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        {/* Posts feed */}
        <div className="lg:col-span-3 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-16 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-6 w-12 rounded-lg" />
                <Skeleton className="h-6 w-12 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Saved searches skeleton */
export function SavedSearchesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28 rounded-lg" />
              <Skeleton className="h-6 w-6 rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24 rounded-lg" />
          </div>
        ))}
      </div>
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

// Re-export existing skeletons for convenience
export { DashboardSkeleton, FullPageSkeleton } from "./dashboard-skeleton";
export { TableSkeleton } from "./table-skeleton";
