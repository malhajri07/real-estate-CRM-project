import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Page header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-72 rounded-lg" />
            </div>

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

            {/* Row 1: Pipeline + Revenue (2 cards) */}
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
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${30 + Math.random() * 70}%` }} />
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

            {/* Row 2: Recent Leads + Recent Activity (2 cards) */}
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
