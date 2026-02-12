import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Welcome header skeleton */}
            <div className="bg-slate-50/80 rounded-3xl p-8 border border-slate-100">
                <Skeleton className="h-8 w-32 rounded-full mb-4" />
                <Skeleton className="h-12 w-64 mb-3" />
                <Skeleton className="h-6 w-48" />
            </div>

            {/* Metric cards skeleton */}
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-3xl p-6 border border-slate-100 bg-white/60 backdrop-blur-sm">
                        <div className="flex justify-between mb-4">
                            <Skeleton className="h-14 w-14 rounded-2xl" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-20 mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </section>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                    <Skeleton className="h-72 w-full rounded-3xl" />
                    <Skeleton className="h-96 w-full rounded-3xl" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-64 w-full rounded-3xl" />
                    <Skeleton className="h-72 w-full rounded-3xl" />
                </div>
            </div>
        </div>
    );
}
