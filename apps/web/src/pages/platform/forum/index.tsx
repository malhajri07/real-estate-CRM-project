import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PenLine, Heart, MessageCircle, Share2, MoreHorizontal, User, Award, TrendingUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

export default function ForumPage() {
    const { t, dir } = useLanguage();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPostContent, setNewPostContent] = useState("");

    const { data: feedData, isLoading } = useQuery({
        queryKey: ["/api/community/feed"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/community/feed?page=1&limit=50`);
            return res.json();
        }
    });

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
        <div className={cn("w-full space-y-6", "pb-20")} dir={dir}>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-2xl font-bold">
                        {t("nav.forum") || "Community Forum"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Connect, share deals, and discuss market trends.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
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
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
                            <ul className="space-y-3">
                                {['Market Trends', 'Legal Updates', 'General Discussion', 'Commercial', 'Off-Plan'].map((topic) => (
                                    <li key={topic} className="flex items-center justify-between rounded-xl p-2 text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                                        <span className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                                            {topic}
                                        </span>
                                        <Badge variant="secondary">12</Badge>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Feed Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search Input for Mobile/Tablet */}
                    <Card className="flex items-center p-3 lg:hidden">
                        <Search className="ms-2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search discussions..."
                            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                        />
                    </Card>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Spinner size="lg" className="text-emerald-600" />
                        </div>
                    ) : (
                        <AnimatePresence>
                            {posts.map((post: any, i: number) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card className="p-6">
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted overflow-hidden">
                                                    {post.author?.avatarUrl ? (
                                                        <img src={post.author.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <User className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold">
                                                            {post.author?.firstName} {post.author?.lastName}
                                                        </span>
                                                        {post.author?.role === "WEBSITE_ADMIN" && <Award className="h-3 w-3 text-emerald-500" />}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {post.author?.organization?.tradeName || "Agent"} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>

                                        <p className="text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                                            {post.content}
                                        </p>

                                        {post.tags && (
                                            <div className="mb-4 flex flex-wrap gap-2">
                                                {(JSON.parse(post.tags as string || "[]") as string[]).map(tag => (
                                                    <Badge key={tag} variant="secondary">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 border-t pt-4 text-muted-foreground">
                                            <Button variant="ghost" size="sm" className="gap-2 hover:text-red-500">
                                                <Heart className="h-4 w-4" />
                                                <span>{post.likes}</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="gap-2 hover:text-blue-500">
                                                <MessageCircle className="h-4 w-4" />
                                                <span>{post._count?.comments || 0}</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="gap-2 hover:text-foreground ms-auto">
                                                <Share2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Right Sidebar (Stats/Profile) */}
                <div className="hidden lg:block lg:col-span-1">
                    <Card className="border-s-4 border-emerald-500">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-2">Top Contributor</h3>
                            <p className="text-sm text-emerald-700 mb-4">You are in the top 5% of active agents this week!</p>
                            <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                                <div className="h-full w-[75%] bg-emerald-500 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
