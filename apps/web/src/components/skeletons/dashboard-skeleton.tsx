import { Skeleton } from "@/components/ui/skeleton";

/**
 * DashboardSkeleton — Mirrors the exact dashboard layout during loading.
 * Used inside PlatformShell (sidebar + header already present).
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Metric cards row (4 cards) */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3">
                        <Skeleton className="h-4 w-24 rounded-lg" />
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="h-3 w-16 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Row 1: 2 cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-24 rounded-lg" />
                            <Skeleton className="h-3 w-40 rounded-lg" />
                        </div>
                    </div>
                    <div className="flex items-end gap-2 h-32">
                        {[40, 65, 45, 80, 55].map((h, i) => (
                            <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-28 rounded-lg" />
                            <Skeleton className="h-3 w-44 rounded-lg" />
                        </div>
                    </div>
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            </div>

            {/* Row 2: 2 cards with list items */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, card) => (
                    <div key={card} className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="p-6 flex items-center justify-between border-b border-border">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-28 rounded-lg" />
                                    <Skeleton className="h-3 w-40 rounded-lg" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-32 rounded-lg" />
                                        <Skeleton className="h-3 w-20 rounded-lg" />
                                    </div>
                                    <Skeleton className="h-6 w-14 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * FullPageSkeleton — Includes sidebar + header frame for use OUTSIDE PlatformShell.
 * Used as the Suspense fallback in App.tsx before the shell loads.
 */
export function FullPageSkeleton() {
    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar skeleton */}
            <div className="hidden md:flex w-64 shrink-0 flex-col border-e border-border bg-card animate-pulse">
                {/* Logo area */}
                <div className="p-4 border-b border-border">
                    <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
                {/* Nav items */}
                <div className="flex-1 p-3 space-y-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                            <Skeleton className="h-5 w-5 rounded-md shrink-0" />
                            <Skeleton className="h-4 rounded-lg" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </div>
                    ))}
                    {/* Spacer */}
                    <div className="pt-4">
                        <Skeleton className="h-3 w-16 rounded-lg mx-3 mb-2" />
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={`s${i}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                                <Skeleton className="h-5 w-5 rounded-md shrink-0" />
                                <Skeleton className="h-4 rounded-lg" style={{ width: `${50 + Math.random() * 50}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
                {/* User area */}
                <div className="p-4 border-t border-border flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24 rounded-lg" />
                        <Skeleton className="h-3 w-16 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header skeleton */}
                <div className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 animate-pulse">
                    <Skeleton className="h-8 w-8 rounded-lg md:hidden" />
                    <Skeleton className="h-4 w-32 rounded-lg" />
                    <div className="flex-1" />
                    <Skeleton className="h-10 w-64 rounded-2xl hidden sm:block" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>

                {/* Page content skeleton */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div className="w-full max-w-7xl mx-auto">
                        <DashboardSkeleton />
                    </div>
                </div>
            </div>
        </div>
    );
}
