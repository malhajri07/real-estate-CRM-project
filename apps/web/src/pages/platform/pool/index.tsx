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
        <div className="min-h-screen bg-gray-50/50 pb-20" dir={dir}>
            {/* Header Section */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            {t("nav.pool") || "Marketplace Pool"}
                        </h1>
                        <p className="mt-1 text-gray-500">
                            {t("pool.subtitle") || "Real-time stream of verified customer requests."}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2 rounded-full border-gray-200 bg-white shadow-sm hover:bg-gray-50">
                            <Filter className="h-4 w-4" />
                            <span>Filter</span>
                        </Button>
                        <Button className="gap-2 rounded-full bg-emerald-600 shadow-lg hover:bg-emerald-700 shadow-emerald-900/20">
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
                    className="mt-6 flex items-center rounded-2xl bg-white p-2 shadow-sm border border-gray-100 ring-1 ring-gray-900/5"
                >
                    <Search className="ml-4 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by city (e.g. Riyadh)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border-none bg-transparent px-4 py-2 text-sm outline-none placeholder:text-gray-400 focus:ring-0"
                    />
                    <Badge variant="secondary" className="mr-2 hidden rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 sm:flex">
                        All Areas
                    </Badge>
                </motion.div>
            </div>

            {/* Request Grid */}
            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 rounded-[24px] bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {requests.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                                <Ticket className="h-12 w-12 mb-4 opacity-50" />
                                <p>No active requests found.</p>
                            </div>
                        )}
                        {requests.map((req: any, index: number) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1"
                            >
                                {/* Card Content */}
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <Badge
                                            className={`rounded-full px-3 py-1 ${req.type === "Buy"
                                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                                                }`}
                                        >
                                            {req.type || "Request"}
                                        </Badge>
                                        <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                            {req.type} in {req.city}
                                        </h3>
                                        <div className="mt-2 flex items-center gap-2 text-emerald-600 font-bold">
                                            <Wallet className="h-4 w-4" />
                                            {req.minPrice?.toLocaleString()} - {req.maxPrice?.toLocaleString()} SAR
                                        </div>
                                    </div>

                                    <p className="text-sm leading-relaxed text-gray-500 line-clamp-2">
                                        {req.notes || "No additional details provided."}
                                    </p>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {req.minBedrooms && (
                                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                {req.minBedrooms} Beds
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Footer / Action */}
                                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">Verified Client</span>
                                    </div>

                                    <Button
                                        size="sm"
                                        className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
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
