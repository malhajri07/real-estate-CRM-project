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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { ForumSkeleton } from "@/components/skeletons/page-skeletons";
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
// Select replaced with DropdownMenu to prevent scroll-lock layout shift
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";

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
    agent_profiles?: {
      falLicenseNumber?: string | null;
      falLicenseType?: string | null;
      falStatus?: string | null;
      licenseNo?: string | null;
    } | null;
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

// --- Zod Schemas ---

const createPostSchema = z.object({
  content: z.string().min(1, "المحتوى مطلوب"),
  type: z.string().min(1),
  channelId: z.string().optional(),
});

type CreatePostFormValues = z.infer<typeof createPostSchema>;

const createChannelSchema = z.object({
  nameAr: z.string().min(1, "اسم القناة بالعربية مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
});

type CreateChannelFormValues = z.infer<typeof createChannelSchema>;

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
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isChannelOpen, setIsChannelOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | "all">("all");
  const [mediaUrls, setMediaUrls] = useState<{ url: string; type: "IMAGE" | "VIDEO" }[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");

  // --- Post Form (shared between compose box and sheet) ---
  const postForm = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: "",
      type: "DISCUSSION",
      channelId: "",
    },
  });

  // --- Channel Form ---
  const channelForm = useForm<CreateChannelFormValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      description: "",
    },
  });

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
    mutationFn: async (values: CreatePostFormValues) =>
      apiPost("api/community/post", {
        content: values.content,
        type: values.type,
        channelId: values.channelId || undefined,
        media: mediaUrls.length
          ? mediaUrls.map((m, i) => ({ url: m.url, type: m.type, order: i }))
          : undefined,
      }),
    onSuccess: () => {
      toast.success("تم نشر المنشور");
      postForm.reset();
      setMediaUrls([]);
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/channels"] });
    },
    onError: () => {
      toast.error("فشل نشر المنشور");
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (values: CreateChannelFormValues) =>
      apiPost("api/community/channels", {
        nameAr: values.nameAr,
        nameEn: values.nameEn || undefined,
        description: values.description || undefined,
      }),
    onSuccess: () => {
      toast.success("تم إنشاء القناة");
      channelForm.reset();
      setIsChannelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/community/channels"] });
    },
    onError: () => {
      toast.error("فشل إنشاء القناة");
    },
  });

  // Like a post
  const likeMutation = useMutation({
    mutationFn: (postId: string) => apiPost(`api/community/post/${postId}/like`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedQueryKey }),
  });

  // Delete own post
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => apiPost(`api/community/post/${postId}/delete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
      toast.success("تم حذف المنشور");
    },
    onError: () => toast.error("فشل حذف المنشور"),
  });

  // Comment on a post
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      apiPost(`api/community/post/${postId}/comment`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
      setCommentText("");
      setCommentingPostId(null);
      toast.success("تم إضافة التعليق");
    },
  });

  const handlePostSubmit = (values: CreatePostFormValues) => {
    createPostMutation.mutate(values);
  };

  const handleChannelSubmit = (values: CreateChannelFormValues) => {
    createChannelMutation.mutate(values);
  };

  const handleShare = (post: ForumPost) => {
    const text = post.content.substring(0, 100);
    navigator.clipboard.writeText(`${text}...\n\n${window.location.href}`);
    toast.success("تم نسخ الرابط");
  };

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
        message={"فشل نشر المنشور"}
        onRetry={() => refetch()}
      />
    );

  return (
    <div className={PAGE_WRAPPER}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title="المنتدى العقاري" />

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsChannelOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>{"إنشاء قناة"}</span>
          </Button>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <PenLine className="h-4 w-4" />
            <span>{"منشور جديد"}</span>
          </Button>
        </div>

        {/* -- Bottom Drawer: Create Channel -- */}
        <Sheet open={isChannelOpen} onOpenChange={setIsChannelOpen}>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{"إنشاء قناة"}</SheetTitle>
              <SheetDescription>{"وصف القناة"}</SheetDescription>
            </SheetHeader>
            <Form {...channelForm}>
              <form onSubmit={channelForm.handleSubmit(handleChannelSubmit)}>
                <div className="space-y-4 py-4 max-w-lg mx-auto">
                  <FormField
                    control={channelForm.control}
                    name="nameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{"اسم القناة (عربي)"}</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: أخبار السوق" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={channelForm.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{"اسم القناة (إنجليزي)"}</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: Market News" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={channelForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{"وصف القناة"}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={"وصف القناة"}
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <SheetFooter className="max-w-lg mx-auto">
                  <Button type="button" variant="outline" onClick={() => setIsChannelOpen(false)}>
                    {"إلغاء"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createChannelMutation.isPending}
                  >
                    {createChannelMutation.isPending ? "..." : "إنشاء قناة"}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>

        {/* -- Bottom Drawer: Create Post -- */}
        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{"ابدأ نقاش جديد"}</SheetTitle>
              <SheetDescription>{"اكتب منشورك هنا..."}</SheetDescription>
            </SheetHeader>
            <Form {...postForm}>
              <form onSubmit={postForm.handleSubmit(handlePostSubmit)}>
                <div className="space-y-4 py-4 max-w-lg mx-auto">
                  <FormField
                    control={postForm.control}
                    name="type"
                    render={() => (
                      <FormItem>
                        <FormLabel>{"نقاش"}</FormLabel>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                              {POST_TYPES.find(pt => pt.value === postForm.watch("type"))
                                ? t(POST_TYPES.find(pt => pt.value === postForm.watch("type"))!.key)
                                : "نقاش"}
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                            {POST_TYPES.map((pt) => (
                              <DropdownMenuItem key={pt.value} onClick={() => postForm.setValue("type", pt.value as any)}>
                                {t(pt.key)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {channels.length > 0 && (
                    <FormField
                      control={postForm.control}
                      name="channelId"
                      render={() => (
                        <FormItem>
                          <FormLabel>{"القنوات"}</FormLabel>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                                {postForm.watch("channelId")
                                  ? channels.find(c => c.id === postForm.watch("channelId"))?.nameAr || "كل القنوات"
                                  : "كل القنوات"}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                              <DropdownMenuItem onClick={() => postForm.setValue("channelId", "")}>
                                {"كل القنوات"}
                              </DropdownMenuItem>
                              {channels.map((ch) => (
                                <DropdownMenuItem key={ch.id} onClick={() => postForm.setValue("channelId", ch.id)}>
                                  {dir === "rtl" ? ch.nameAr : ch.nameEn || ch.nameAr}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={postForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{"اكتب منشورك هنا..."}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={"اكتب منشورك هنا..."}
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label>{"رابط صورة أو فيديو (اختياري)"}</Label>
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 rounded"
                              onClick={() => removeMedia(i)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <SheetFooter className="max-w-lg mx-auto">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    {"إلغاء"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? "جاري النشر..." : "نشر"}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Channel Sidebar */}
        <div className="hidden space-y-6 lg:block lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>{"القنوات"}</h3>
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
                    {"كل القنوات"}
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
          {/* -- Twitter-style Compose Box -- */}
          <Card className="p-4">
            <Form {...postForm}>
              <form onSubmit={postForm.handleSubmit(handlePostSubmit)}>
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10"><User className="h-5 w-5 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <FormField
                      control={postForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Textarea
                              placeholder={"اكتب منشورك هنا..."}
                              className="min-h-[80px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-base p-0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Media previews */}
                    {mediaUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {mediaUrls.map((m, i) => (
                          <div key={i} className="relative inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs bg-muted/50">
                            {m.type === "IMAGE" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                            <span className="max-w-[100px] truncate">{m.url}</span>
                            <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 rounded" onClick={() => removeMedia(i)}><X className="h-3 w-3" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-1">
                        {/* Channel selector — DropdownMenu (no scroll lock) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" className="h-8 gap-1 text-xs font-bold text-primary hover:bg-primary/5 rounded-full px-3">
                              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                              {postForm.watch("channelId")
                                ? channels.find(c => c.id === postForm.watch("channelId"))?.nameAr || "كل القنوات"
                                : "كل القنوات"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => postForm.setValue("channelId", "")}>
                              {"كل القنوات"}
                            </DropdownMenuItem>
                            {channels.map((ch) => (
                              <DropdownMenuItem key={ch.id} onClick={() => postForm.setValue("channelId", ch.id)}>
                                {dir === "rtl" ? ch.nameAr : ch.nameEn || ch.nameAr}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Post type — DropdownMenu (no scroll lock) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" className="h-8 gap-1 text-xs font-bold text-muted-foreground hover:bg-muted/50 rounded-full px-3">
                              <Award className="h-3.5 w-3.5 shrink-0" />
                              {POST_TYPES.find(pt => pt.value === postForm.watch("type"))
                                ? t(POST_TYPES.find(pt => pt.value === postForm.watch("type"))!.key)
                                : "نقاش"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {POST_TYPES.map((pt) => (
                              <DropdownMenuItem key={pt.value} onClick={() => postForm.setValue("type", pt.value as any)}>
                                {t(pt.key)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Media button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5"
                          onClick={() => {
                            const url = prompt("رابط صورة أو فيديو (اختياري)");
                            if (url?.trim()) {
                              const type = isVideoUrl(url) ? "VIDEO" : "IMAGE";
                              setMediaUrls((prev) => [...prev, { url: url.trim(), type }]);
                            }
                          }}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        className="rounded-full px-6 font-bold"
                        disabled={createPostMutation.isPending || !postForm.watch("content")?.trim()}
                      >
                        {createPostMutation.isPending ? "..." : ("نشر")}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </Card>

          {(isLoading || showSkeleton) ? (
            <ForumSkeleton />
          ) : posts.length === 0 ? (
            <EmptyState
              title={"لا توجد منشورات"}
              description={"كن أول من يشارك في هذا المجتمع"}
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
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={post.author?.avatarUrl ?? undefined} alt={`${post.author?.firstName} ${post.author?.lastName}`} />
                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">
                              {post.author?.firstName} {post.author?.lastName}
                            </span>
                            {(post.author?.agent_profiles?.falLicenseNumber || post.author?.agent_profiles?.licenseNo) && (
                              <Badge variant="outline" className="text-[10px] gap-0.5 border-primary/30 text-primary">
                                <ShieldCheck className="h-2.5 w-2.5" />
                                فال
                              </Badge>
                            )}
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
                                  <div key={m.id} className="rounded-lg overflow-hidden border bg-foreground aspect-video">
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

                    {/* Actions */}
                    <div className="flex items-center gap-4 border-t pt-4 text-muted-foreground">
                      <Button variant="ghost" size="sm" className="gap-1.5 hover:text-destructive" onClick={() => likeMutation.mutate(post.id)}>
                        <Heart className={cn("h-4 w-4", post.likes > 0 && "fill-destructive text-destructive")} />
                        <span>{post.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 hover:text-primary" onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}>
                        <MessageCircle className="h-4 w-4" />
                        <span>{post._count?.comments || 0}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 hover:text-foreground ms-auto" onClick={() => handleShare(post)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem className="text-destructive" onClick={() => deletePostMutation.mutate(post.id)}>حذف المنشور</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Inline comment box */}
                    {commentingPostId === post.id && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="اكتب تعليقاً..."
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && commentText.trim()) {
                              commentMutation.mutate({ postId: post.id, content: commentText.trim() });
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          disabled={!commentText.trim() || commentMutation.isPending}
                          onClick={() => commentText.trim() && commentMutation.mutate({ postId: post.id, content: commentText.trim() })}
                        >
                          {commentMutation.isPending ? "..." : "إرسال"}
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Right Sidebar — Stats & Channels */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
          {/* Forum stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-bold">{"إحصائيات"}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المنشورات</span>
                  <span className="font-bold">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">القنوات</span>
                  <span className="font-bold">{channels.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top channels */}
          {channels.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-bold">{"القنوات الشائعة"}</h3>
                {channels.slice(0, 5).map((ch) => (
                  <Button
                    key={ch.id}
                    variant={selectedChannelId === ch.id ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-between h-8"
                    onClick={() => setSelectedChannelId(ch.id)}
                  >
                    <span className="truncate">{ch.nameAr}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5">{ch._count.posts}</Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick tips */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold mb-2">نصائح</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• شارك تحديثات السوق مع الزملاء</li>
                <li>• اطرح أسئلتك حول الأنظمة العقارية</li>
                <li>• استخدم الوسوم لتصنيف منشوراتك</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
