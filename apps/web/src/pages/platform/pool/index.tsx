import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, Building2, User, Clock, ArrowRight, Wallet, CheckCircle2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY, BUTTON_PRIMARY_CLASSES, LOADING_STYLES, BADGE_STYLES } from "@/config/platform-theme";
import { cn } from "@/lib/utils";

export default function PoolPage() {
    const { t, dir } = useLanguage();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch Pool Requests
    const { data, isLoading } = useQuery({
        queryKey: ["/api/pool/search", searchQuery],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/pool/search?page=1&pageSize=50${searchQuery ? `&city=${searchQuery}` : ""}`);
            return res.json();
        }
    });

    // Claim Request Mutation
    const claimMutation = useMutation({
        mutationFn: async (requestId: string) => {
            const res = await apiRequest("POST", `/api/pool/${requestId}/claim`, { notes: "Quick claim via Platform" });
            return res.json();
        },
        onSuccess: () => {
            toast.success("Request claimed successfully! Added to your pipeline.");
            queryClient.invalidateQueries({ queryKey: ["/api/pool/search"] });
        },
        onError: (error) => {
            toast.error("Failed to claim request. limit reached or already taken.");
        }
    });

    const requests = data?.data || [];

    return (
        <div className={cn(PAGE_WRAPPER, "pb-20")} dir={dir}>
            {/* Header Section */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                    <div>
                        <h1 className={TYPOGRAPHY.pageTitle}>
                            {t("nav.pool") || "Marketplace Pool"}
                        </h1>
                        <p className={TYPOGRAPHY.pageSubtitle}>
                            {t("pool.subtitle") || "Real-time stream of verified customer requests."}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50">
                            <Filter className="h-4 w-4" />
                            <span>Filter</span>
                        </Button>
                        <Button className={cn(BUTTON_PRIMARY_CLASSES, "gap-2")}>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>My Matches</span>
                        </Button>
                    </div>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={cn(CARD_STYLES.container, "mt-6 flex items-center p-2")}
                >
                    <Search className="ms-4 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by city (e.g. Riyadh)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border-none bg-transparent px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-0"
                    />
                    <Badge variant="secondary" className="me-2 hidden rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-600 sm:flex">
                        All Areas
                    </Badge>
                </motion.div>
            </div>

            {/* Request Grid */}
            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={cn(CARD_STYLES.container, "h-64 animate-pulse")} />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {requests.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                                <Ticket className="h-12 w-12 mb-4 opacity-50" />
                                <p className={TYPOGRAPHY.body}>No active requests found.</p>
                            </div>
                        )}
                        {requests.map((req: any, index: number) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(CARD_STYLES.container, "group relative flex flex-col justify-between overflow-hidden p-6")}
                            >
                                {/* Card Content */}
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <Badge
                                            className={cn(BADGE_STYLES.base, req.type === "Buy" ? BADGE_STYLES.info : BADGE_STYLES.purple)}
                                        >
                                            {req.type || "Request"}
                                        </Badge>
                                        <span className={cn(TYPOGRAPHY.caption, "flex items-center gap-1 font-medium text-slate-400")}>
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className={cn(TYPOGRAPHY.sectionTitle, "group-hover:text-emerald-600 transition-colors")}>
                                            {req.type} in {req.city}
                                        </h3>
                                        <div className="mt-2 flex items-center gap-2 text-emerald-600 font-bold">
                                            <Wallet className="h-4 w-4" />
                                            {req.minPrice?.toLocaleString()} - {req.maxPrice?.toLocaleString()} SAR
                                        </div>
                                    </div>

                                    <p className={cn(TYPOGRAPHY.body, "leading-relaxed text-slate-500 line-clamp-2")}>
                                        {req.notes || "No additional details provided."}
                                    </p>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {req.minBedrooms && (
                                            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                {req.minBedrooms} Beds
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Footer / Action */}
                                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <span className={cn(TYPOGRAPHY.body, "font-medium text-slate-700")}>Verified Client</span>
                                    </div>

                                    <Button
                                        size="sm"
                                        className={BUTTON_PRIMARY_CLASSES}
                                        onClick={() => claimMutation.mutate(req.id)}
                                        disabled={claimMutation.isPending}
                                    >
                                        {claimMutation.isPending ? "Claiming..." : "Claim"}
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
