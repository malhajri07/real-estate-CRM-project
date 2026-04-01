/**
 * forum/index.tsx - Community Forum Page
 *
 * Route: /home/platform/forum
 *
 * Forum for agents to view, post news, announcements. Supports:
 * - Channels (subgroups)
 * - Rich media (images, video)
 * - RTL Arabic
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  PenLine,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  User,
  Award,
  TrendingUp,
  Plus,
  Image as ImageIcon,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER, TYPOGRAPHY } from "@/config/platform-theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/apiClient";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ForumChannel {
  id: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  _count: { posts: number };
}

interface PostMedia {
  id: string;
  url: string;
  type: string;
  order: number;
}

interface ForumPost {
  id: string;
  content: string;
  type: string;
  tags: string[] | string | null;
  likes: number;
  createdAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    organization?: { tradeName?: string | null } | null;
  };
  channel?: { id: string; nameAr: string; nameEn?: string | null } | null;
  media?: PostMedia[];
  _count?: { comments: number };
}

const POST_TYPES = [
  { value: "DISCUSSION", key: "forum.post_type.discussion" },
  { value: "NEWS", key: "forum.post_type.news" },
  { value: "ANNOUNCEMENT", key: "forum.post_type.announcement" },
  { value: "DEAL", key: "forum.post_type.deal" },
  { value: "ALERT", key: "forum.post_type.alert" },
];

function parseTags(tags: string[] | string | null): string[] {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function isVideoUrl(url: string): boolean {
  return /youtube|youtu\.be|vimeo|\.mp4|\.webm/i.test(url);
}

function getYouTubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

export default function ForumPage() {
  const { t, dir } = useLanguage();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isChannelOpen, setIsChannelOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | "all">("all");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState("DISCUSSION");
  const [newPostChannelId, setNewPostChannelId] = useState<string>("");
  const [mediaUrls, setMediaUrls] = useState<{ url: string; type: "IMAGE" | "VIDEO" }[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newChannelNameAr, setNewChannelNameAr] = useState("");
  const [newChannelNameEn, setNewChannelNameEn] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");

  const { data: channelsData } = useQuery({
    queryKey: ["/api/community/channels"],
    queryFn: async () => apiGet<{ data?: ForumChannel[] }>("api/community/channels"),
  });

  const channels = channelsData?.data ?? [];

  const feedQueryKey = ["/api/community/feed", selectedChannelId];
  const feedParams =
    selectedChannelId === "all"
      ? "?page=1&limit=50"
      : `?page=1&limit=50&channelId=${selectedChannelId}`;

  const { data: feedData, isLoading, isError, refetch } = useQuery({
    queryKey: feedQueryKey,
    queryFn: async () =>
      apiGet<{ data?: ForumPost[] }>(`api/community/feed${feedParams}`),
  });

  const createPostMutation = useMutation({
    mutationFn: async () =>
      apiPost("api/community/post", {
        content: newPostContent,
        type: newPostType,
        channelId: newPostChannelId || undefined,
        media: mediaUrls.length
          ? mediaUrls.map((m, i) => ({ url: m.url, type: m.type, order: i }))
          : undefined,
      }),
    onSuccess: () => {
      toast.success(t("forum.post_success"));
      setNewPostContent("");
      setNewPostType("DISCUSSION");
      setNewPostChannelId("");
      setMediaUrls([]);
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/channels"] });
    },
    onError: () => {
      toast.error(t("forum.post_error"));
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async () =>
      apiPost("api/community/channels", {
        nameAr: newChannelNameAr,
        nameEn: newChannelNameEn || undefined,
        description: newChannelDescription || undefined,
      }),
    onSuccess: () => {
      toast.success(t("forum.channel_success"));
      setNewChannelNameAr("");
      setNewChannelNameEn("");
      setNewChannelDescription("");
      setIsChannelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/community/channels"] });
    },
    onError: () => {
      toast.error(t("forum.channel_error"));
    },
  });

  const addMedia = () => {
    if (!newMediaUrl.trim()) return;
    const type = isVideoUrl(newMediaUrl) ? "VIDEO" : "IMAGE";
    setMediaUrls((prev) => [...prev, { url: newMediaUrl.trim(), type }]);
    setNewMediaUrl("");
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const posts = feedData?.data ?? [];

  if (isError)
    return (
      <QueryErrorFallback
        message={t("forum.post_error") || "فشل تحميل المنتدى"}
        onRetry={() => refetch()}
      />
    );

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title={t("forum.title") || t("nav.forum") || "المنتدى العقاري"} />

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsChannelOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>{t("forum.create_channel")}</span>
          </Button>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <PenLine className="h-4 w-4" />
            <span>{t("forum.create_post")}</span>
          </Button>
        </div>

        {/* ── Bottom Drawer: Create Channel ── */}
        <Sheet open={isChannelOpen} onOpenChange={setIsChannelOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl" dir={dir}>
            <SheetHeader>
              <SheetTitle>{t("forum.create_channel")}</SheetTitle>
              <SheetDescription>{t("forum.channel_description") || "إنشاء قناة جديدة في المنتدى"}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4 max-w-lg mx-auto">
              <div className="space-y-2">
                <Label>{t("forum.channel_name_ar")}</Label>
                <Input
                  value={newChannelNameAr}
                  onChange={(e) => setNewChannelNameAr(e.target.value)}
                  placeholder="مثال: أخبار السوق"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("forum.channel_name_en")}</Label>
                <Input
                  value={newChannelNameEn}
                  onChange={(e) => setNewChannelNameEn(e.target.value)}
                  placeholder="مثال: Market News"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("forum.channel_description")}</Label>
                <Textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder={t("forum.channel_description")}
                  rows={2}
                />
              </div>
            </div>
            <SheetFooter className="max-w-lg mx-auto">
              <Button variant="outline" onClick={() => setIsChannelOpen(false)}>
                {t("forum.cancel")}
              </Button>
              <Button
                onClick={() => createChannelMutation.mutate()}
                disabled={createChannelMutation.isPending || !newChannelNameAr.trim()}
              >
                {createChannelMutation.isPending ? "..." : t("forum.create_channel")}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* ── Bottom Drawer: Create Post ── */}
        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl" dir={dir}>
            <SheetHeader>
              <SheetTitle>{t("forum.start_discussion")}</SheetTitle>
              <SheetDescription>{t("forum.placeholder") || "ابدأ نقاشاً جديداً"}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4 max-w-lg mx-auto">
              <div className="space-y-2">
                <Label>{t("forum.post_type.discussion")}</Label>
                <Select value={newPostType} onValueChange={setNewPostType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {t(pt.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {channels.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("forum.channels")}</Label>
                  <Select
                    value={newPostChannelId || "none"}
                    onValueChange={(v) => setNewPostChannelId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("forum.all_channels")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("forum.all_channels")}</SelectItem>
                      {channels.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>
                          {dir === "rtl" ? ch.nameAr : ch.nameEn || ch.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("forum.placeholder")}</Label>
                <Textarea
                  placeholder={t("forum.placeholder")}
                  className="min-h-[120px] resize-none"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("forum.media_url_placeholder")}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMedia())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addMedia}>
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                {mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mediaUrls.map((m, i) => (
                      <div
                        key={i}
                        className="relative inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                      >
                        {m.type === "IMAGE" ? (
                          <ImageIcon className="h-3 w-3" />
                        ) : (
                          <Video className="h-3 w-3" />
                        )}
                        <span className="max-w-[120px] truncate">{m.url}</span>
                        <button
                          type="button"
                          onClick={() => removeMedia(i)}
                          className="rounded p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <SheetFooter className="max-w-lg mx-auto">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t("forum.cancel")}
              </Button>
              <Button
                onClick={() => createPostMutation.mutate()}
                disabled={createPostMutation.isPending || !newPostContent.trim()}
              >
                {createPostMutation.isPending ? t("forum.posting") : t("forum.post")}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Channel Sidebar */}
        <div className="hidden space-y-6 lg:block lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>{t("forum.channels")}</h3>
              <ul className="space-y-4">
                <li
                  className={cn(
                    "flex items-center justify-between rounded-xl p-2 text-sm cursor-pointer transition-colors",
                    selectedChannelId === "all"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedChannelId("all")}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t("forum.all_channels")}
                  </span>
                </li>
                {channels.map((ch) => (
                  <li
                    key={ch.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl p-2 text-sm cursor-pointer transition-colors",
                      selectedChannelId === ch.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedChannelId(ch.id)}
                  >
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {dir === "rtl" ? ch.nameAr : ch.nameEn || ch.nameAr}
                    </span>
                    <Badge variant="secondary">{ch._count?.posts ?? 0}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex items-center p-3 lg:hidden">
            <Search className={cn("h-5 w-5 text-muted-foreground", dir === "rtl" ? "ms-2" : "me-2")} />
            <Input
              type="text"
              placeholder={t("forum.search_placeholder")}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </Card>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              title={t("forum.no_posts")}
              description={t("forum.no_posts_description")}
            />
          ) : (
            <AnimatePresence>
              {posts.map((post: ForumPost, i: number) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted overflow-hidden shrink-0">
                          {post.author?.avatarUrl ? (
                            <img
                              src={post.author.avatarUrl}
                              alt={`${post.author?.firstName} ${post.author?.lastName}'s avatar`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">
                              {post.author?.firstName} {post.author?.lastName}
                            </span>
                            {post.channel && (
                              <Badge variant="secondary" className="text-xs">
                                {dir === "rtl" ? post.channel.nameAr : post.channel.nameEn || post.channel.nameAr}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {post.author?.organization?.tradeName || "وكيل"} •{" "}
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>

                    <p className="text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Media: Images */}
                    {post.media && post.media.length > 0 && (
                      <div className="mb-4 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {post.media
                            .filter((m) => m.type === "IMAGE")
                            .map((m) => (
                              <a
                                key={m.id}
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border aspect-video bg-muted"
                              >
                                <img
                                  src={m.url}
                                  alt="صورة المنشور"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </a>
                            ))}
                        </div>
                        {post.media.some((m) => m.type === "VIDEO") && (
                          <div className="space-y-2">
                            {post.media
                              .filter((m) => m.type === "VIDEO")
                              .map((m) => {
                                const ytEmbed = getYouTubeEmbedUrl(m.url);
                                const vimeoEmbed = getVimeoEmbedUrl(m.url);
                                return (
                                  <div key={m.id} className="rounded-lg overflow-hidden border bg-black aspect-video">
                                    {ytEmbed ? (
                                      <iframe
                                        src={ytEmbed}
                                        title="فيديو يوتيوب"
                                        className="w-full h-full"
                                        allowFullScreen
                                      />
                                    ) : vimeoEmbed ? (
                                      <iframe
                                        src={vimeoEmbed}
                                        title="فيديو فيميو"
                                        className="w-full h-full"
                                        allowFullScreen
                                      />
                                    ) : (
                                      <video src={m.url} controls className="w-full h-full" />
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}

                    {parseTags(post.tags).length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {parseTags(post.tags).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex items-center gap-6 border-t pt-4 text-muted-foreground",
                        dir === "rtl" ? "flex-row-reverse" : ""
                      )}
                    >
                      <Button variant="ghost" size="sm" className="gap-2 hover:text-destructive">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2 hover:text-primary">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post._count?.comments || 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-2 hover:text-foreground", dir === "rtl" ? "me-auto" : "ms-auto")}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="border-s-4 border-primary/20">
            <CardContent className="p-6">
              <h3 className={`${TYPOGRAPHY.sectionTitle} mb-2`}>{t("forum.trending_topics")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("forum.no_posts_description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
