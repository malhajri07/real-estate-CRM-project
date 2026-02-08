import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PenLine, Heart, MessageCircle, Share2, MoreHorizontal, User, Award, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ForumPage() {
    const { t, dir } = useLanguage();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPostContent, setNewPostContent] = useState("");

    // Fetch Forum Feed
    const { data: feedData, isLoading } = useQuery({
        queryKey: ["/api/community/feed"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/community/feed?page=1&limit=50`);
            return res.json();
        }
    });

    // Create Post Mutation
    const createPostMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await apiRequest("POST", "/api/community/post", {
                content,
                type: "DISCUSSION",
                tags: ["General"]
            });
            return res.json();
        },
        onSuccess: () => {
            toast.success("Post created successfully!");
            setNewPostContent("");
            setIsCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
        },
        onError: () => {
            toast.error("Failed to create post.");
        }
    });

    const posts = feedData?.data || [];

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20" dir={dir}>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        {t("nav.forum") || "Community Forum"}
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Connect, share deals, and discuss market trends.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 rounded-full bg-emerald-600 shadow-xl shadow-emerald-900/20 hover:bg-emerald-700">
                                <PenLine className="h-4 w-4" />
                                <span>Start Discussion</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Start a Discussion</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Textarea
                                    placeholder="What's on your mind? Share a deal, a tip, or ask a question..."
                                    className="min-h-[150px] resize-none"
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={() => createPostMutation.mutate(newPostContent)}
                                    disabled={createPostMutation.isPending || !newPostContent.trim()}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {createPostMutation.isPending ? "Posting..." : "Post"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </motion.div>
            </div>

            {/* Main Content Layout */}
            <div className="grid gap-8 lg:grid-cols-4">

                {/* Left Sidebar (Topics) */}
                <div className="hidden space-y-6 lg:block lg:col-span-1">
                    <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <h3 className="mb-4 font-bold text-gray-900">Trending Topics</h3>
                        <ul className="space-y-3">
                            {['Market Trends', 'Legal Updates', 'General Discussion', 'Commercial', 'Off-Plan'].map((topic) => (
                                <li key={topic} className="flex items-center justify-between rounded-lg p-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <span className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                        {topic}
                                    </span>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-500">12</Badge>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Feed Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search Input for Mobile/Tablet */}
                    <div className="flex items-center rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-900/5 lg:hidden">
                        <Search className="ml-2 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="Search discussions..." className="flex-1 bg-transparent px-2 text-sm outline-none" />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                    ) : (
                        <AnimatePresence>
                            {posts.map((post: any, i: number) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-shadow hover:shadow-md"
                                >
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
                                                {post.author?.avatarUrl ? (
                                                    <img src={post.author.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">
                                                        {post.author?.firstName} {post.author?.lastName}
                                                    </span>
                                                    {post.author?.role === "WEBSITE_ADMIN" && <Award className="h-3 w-3 text-emerald-500" />}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {post.author?.organization?.tradeName || "Agent"} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-full">
                                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                        </Button>
                                    </div>

                                    <p className="mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {post.content}
                                    </p>

                                    {post.tags && (
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {(JSON.parse(post.tags as string || "[]") as string[]).map(tag => (
                                                <span key={tag} className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700`}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-6 border-t border-gray-100 pt-4 text-gray-500">
                                        <button className="flex items-center gap-2 text-sm hover:text-red-500 transition-colors">
                                            <Heart className="h-4 w-4" />
                                            <span>{post.likes}</span>
                                        </button>
                                        <button className="flex items-center gap-2 text-sm hover:text-blue-500 transition-colors">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>{post._count?.comments || 0}</span>
                                        </button>
                                        <button className="flex items-center gap-2 text-sm hover:text-gray-900 transition-colors ml-auto">
                                            <Share2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Right Sidebar (Stats/Profile) */}
                <div className="hidden lg:block lg:col-span-1">
                    {/* Placeholder for future widgets */}
                    <div className="rounded-[24px] bg-emerald-900 p-6 text-white shadow-lg">
                        <h3 className="mb-2 font-bold">Top Contributor</h3>
                        <p className="text-sm text-emerald-100/80 mb-4">You are in the top 5% of active agents this week!</p>
                        <div className="h-2 w-full bg-emerald-800 rounded-full overflow-hidden">
                            <div className="h-full w-[75%] bg-emerald-400 rounded-full" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
