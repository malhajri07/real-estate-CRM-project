
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-10 py-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-36 w-full rounded-2xl" />
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
