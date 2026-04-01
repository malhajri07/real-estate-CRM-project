/**
 * articles-management.tsx - Articles Management Page
 *
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → articles-management.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 *
 * CMS articles management page. Provides:
 * - Article listing and search
 * - Article CRUD operations
 * - Article publishing and status management
 * - SEO metadata management
 *
 * Route: /admin/content/articles
 *
 * Related Files:
 * - apps/api/routes/cms-articles.ts - Articles API routes
 * - apps/api/services/articleService.ts - Article service
 *
 * TODO: This component is too large (880+ lines). Extract sub-components:
 * - ArticleTable (list display and pagination)
 * - ArticleForm (create/edit form)
 * - ArticleFilters (search and status filtering)
 * - SEOMetadataForm (SEO field management)
 */

import { useState, useEffect } from "react";
import { PageSectionHeader } from "@/components/ui/page-section-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { formatAdminDate } from "@/lib/formatters";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminSheet,
  AdminSheetContent,
  AdminSheetHeader,
  AdminSheetTitle,
  AdminSheetDescription,
  AdminSheetFooter,
} from "@/components/admin";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Eye, Search, Image as ImageIcon, CheckSquare, Square, MoreVertical, History, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MediaSelector } from "@/components/cms/MediaSelector";
import { RichTextEditor } from "@/components/cms/RichTextEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import DOMPurify from 'isomorphic-dompurify';
import { LISTING_STATUS_LABELS, LISTING_STATUS_BADGE_CLASS } from "@/constants/labels";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  featuredImageId?: string;
  featuredImage?: { id: string; url: string; alt?: string };
}

const fetchArticles = async (params: {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append("status", params.status);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  if (params.search) queryParams.append("search", params.search);

  if (params.search) queryParams.append("search", params.search);
  return apiGet(`api/cms/articles?${queryParams.toString()}`);
};

const fetchCategories = async () => apiGet("api/cms/articles/categories");

const fetchTags = async () => apiGet("api/cms/articles/tags");

interface ArticleVersion {
  id: string;
  articleId: string;
  version: number;
  snapshot: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
}

function ArticleVersionHistory({ articleId, onRestore }: { articleId: string; onRestore: () => void }) {
  const { dir } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["article-versions", articleId],
    queryFn: async () => apiGet<ArticleVersion[]>(`api/cms/articles/${articleId}/versions`),
  });

  const restoreMutation = useMutation({
    mutationFn: async (version: number) =>
      apiPost(`api/cms/articles/${articleId}/versions/${version}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-versions", articleId] });
      toast({ title: "تم استعادة الإصدار بنجاح" });
      onRestore();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  if (versions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">لا توجد إصدارات سابقة</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        تم العثور على {versions.length} إصدار
      </div>
      <div className="space-y-4">
        {versions.map((version) => {
          const snapshot = version.snapshot;
          return (
            <Card key={version.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between" dir={dir}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">الإصدار {version.version}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(version.createdAt).toLocaleString("ar-SA")}
                      </span>
                      {version.createdBy && (
                        <span className="text-sm text-muted-foreground">
                          بواسطة: {version.createdBy}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{String(snapshot.title || "بدون عنوان")}</div>
                      {snapshot.excerpt != null && String(snapshot.excerpt) && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {String(snapshot.excerpt)}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`هل تريد استعادة الإصدار ${version.version}؟`)) {
                        restoreMutation.mutate(version.version);
                      }
                    }}
                    disabled={restoreMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
                    استعادة
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function ArticlesManagement() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["articles", statusFilter, page, searchTerm],
    queryFn: () =>
      fetchArticles({
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        pageSize: 20,
        search: searchTerm || undefined,
      }),
    retry: 1,
    retryDelay: 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["article-categories"],
    queryFn: fetchCategories,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["article-tags"],
    queryFn: fetchTags,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => apiPost("api/cms/articles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء المقال بنجاح" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiPut(`api/cms/articles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setIsDialogOpen(false);
      setEditingArticle(null);
      toast({ title: "تم تحديث المقال بنجاح" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => apiPost(`api/cms/articles/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "تم نشر المقال بنجاح" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiDelete(`api/cms/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "تم حذف المقال بنجاح" });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, articleIds }: { action: string; articleIds: string[] }) =>
      apiPost("api/cms/articles/bulk", { action, articleIds }) as Promise<{ results?: Array<{ success?: boolean }> }>,
    onSuccess: (data: { results?: Array<{ success?: boolean }> }) => {
      const results = data?.results ?? [];
      const successCount = results.filter((r) => r.success).length;
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setSelectedArticles(new Set());
      toast({
        title: "تم تنفيذ الإجراء بنجاح",
        description: `تم معالجة ${successCount} من ${results.length} مقال`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل تنفيذ الإجراء",
        variant: "destructive",
      });
    },
  });

  const handleBulkAction = (action: "publish" | "archive" | "delete") => {
    if (selectedArticles.size === 0) {
      toast({
        title: "تحذير",
        description: "يرجى اختيار مقال واحد على الأقل",
        variant: "destructive",
      });
      return;
    }
    bulkActionMutation.mutate({
      action,
      articleIds: Array.from(selectedArticles),
    });
  };

  const toggleSelectArticle = (articleId: string) => {
    setSelectedArticles((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedArticles.size === data?.items.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(data?.items.map((a) => a.id) || []));
    }
  };

  const handleCreate = () => {
    setEditingArticle(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setIsDialogOpen(true);
  };

  const handleSubmit = (formData: Record<string, unknown>) => {
    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      published: "default",
      draft: "secondary",
      archived: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className={LISTING_STATUS_BADGE_CLASS[status]}>
        {LISTING_STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  return (
    <div className={PAGE_WRAPPER}>
      <PageSectionHeader
        title="إدارة المقالات"
        subtitle="إدارة ونشر المحتوى والمقالات"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="ml-2 h-4 w-4" />
            إنشاء مقال جديد
          </Button>
        }
      />

      <div className="space-y-6">
        {/* ... (rest of the content remains same) */}
        <Card>

          <CardContent className="pt-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="بحث في المقالات..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="max-w-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="حالة المقال" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8">جار التحميل...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <div>حدث خطأ في تحميل المقالات</div>
                <div className="text-sm mt-2 text-muted-foreground">
                  {error instanceof Error ? error.message : "خطأ غير معروف"}
                </div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            ) : !data?.items.length ? (
              <div className="text-center py-8">لا توجد مقالات</div>
            ) : (
              <>
                {selectedArticles.size > 0 && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
                    <span className="text-sm font-medium">
                      تم اختيار {selectedArticles.size} مقال
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction("publish")}
                        disabled={bulkActionMutation.isPending}
                      >
                        نشر
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction("archive")}
                        disabled={bulkActionMutation.isPending}
                      >
                        أرشفة
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBulkAction("delete")}
                        disabled={bulkActionMutation.isPending}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedArticles.size === data.items.length && data.items.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التصنيفات</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedArticles.has(article.id)}
                            onCheckedChange={() => toggleSelectArticle(article.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {article.title}
                        </TableCell>
                        <TableCell>{getStatusBadge(article.status)}</TableCell>
                        <TableCell>
                          {article.categories.map((cat) => (
                            <Badge key={cat.id} variant="outline" className="ml-1">
                              {cat.name}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell>
                          {formatAdminDate(article.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(article)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {article.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => publishMutation.mutate(article.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(article.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        <ArticleDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          article={editingArticle}
          categories={(categories ?? []) as Array<{ id: string; name: string }>}
          tags={(tags ?? []) as Array<{ id: string; name: string }>}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </div>
  );
}

function ArticleDialog({
  open,
  onOpenChange,
  article,
  categories,
  tags,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: Article | null;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featuredImageId, setFeaturedImageId] = useState<string | undefined>(undefined);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>(undefined);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const { dir } = useLanguage();
  const queryClient = useQueryClient();

  // Reset form when dialog opens/closes or article changes
  useEffect(() => {
    if (open) {
      if (article) {
        setTitle(article.title);
        setSlug(article.slug);
        setExcerpt(article.excerpt || "");
        setContent(article.content || "");
        setSelectedCategories(article.categories.map((c) => c.id));
        setSelectedTags(article.tags.map((t) => t.id));
        setFeaturedImageId(article.featuredImageId);
        setFeaturedImageUrl(article.featuredImage?.url);
      } else {
        setTitle("");
        setSlug("");
        setExcerpt("");
        setContent("");
        setSelectedCategories([]);
        setSelectedTags([]);
        setFeaturedImageId(undefined);
        setFeaturedImageUrl(undefined);
      }
    }
  }, [open, article]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
      excerpt,
      content,
      categoryIds: selectedCategories,
      tagIds: selectedTags,
      featuredImageId,
    });
  };

  return (
    <AdminSheet open={open} onOpenChange={onOpenChange}>
      <AdminSheetContent side="start" className="w-full sm:max-w-4xl overflow-y-auto">
        <AdminSheetHeader>
          <AdminSheetTitle>
            {article ? "تعديل المقال" : "إنشاء مقال جديد"}
          </AdminSheetTitle>
          <AdminSheetDescription>
            {article
              ? "قم بتعديل معلومات المقال"
              : "املأ المعلومات لإنشاء مقال جديد"}
          </AdminSheetDescription>
        </AdminSheetHeader>
        <div className="py-6">
          <Tabs defaultValue="edit" className="w-full" dir={dir}>
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
              <TabsTrigger
                value="edit"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary/20 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2"
              >
                تحرير
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary/20 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2"
              >
                معاينة
              </TabsTrigger>
              {article && (
                <TabsTrigger
                  value="versions"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary/20 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 opacity-50 cursor-not-allowed hidden sm:block"
                  disabled
                >
                  سجل الإصدارات (قريباً)
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="edit" className="pt-6">
              <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">العنوان</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="h-11 bg-card/50 border-border focus:bg-card transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">الرابط (Slug)</Label>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="سيتم إنشاؤه تلقائياً من العنوان"
                        className="h-11 bg-card/50 border-border focus:bg-card transition-all font-mono text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">الملخص</Label>
                    <Textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      rows={5}
                      className="bg-card/50 border-border focus:bg-card transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">المحتوى</Label>
                  <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="اكتب محتوى المقال هنا..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                  <div className="space-y-4">
                    <div>
                      <Label className="block mb-2">التصنيفات</Label>
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-xl border border-border min-h-[60px]">
                        {categories.map((cat) => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategories((prev) =>
                                prev.includes(cat.id)
                                  ? prev.filter((id) => id !== cat.id)
                                  : [...prev, cat.id]
                              );
                            }}
                            className={cn(
                              "cursor-pointer px-3 py-1.5 rounded-full text-sm transition-all border select-none",
                              selectedCategories.includes(cat.id)
                                ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                                : "bg-card border-border text-foreground hover:border-border hover:bg-muted"
                            )}
                          >
                            {cat.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="block mb-2">الوسوم</Label>
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-xl border border-border min-h-[60px]">
                        {tags.map((tag) => (
                          <div
                            key={tag.id}
                            onClick={() => {
                              setSelectedTags((prev) =>
                                prev.includes(tag.id)
                                  ? prev.filter((id) => id !== tag.id)
                                  : [...prev, tag.id]
                              );
                            }}
                            className={cn(
                              "cursor-pointer px-3 py-1.5 rounded-full text-sm transition-all border select-none",
                              selectedTags.includes(tag.id)
                                ? "bg-foreground border-foreground text-background shadow-sm"
                                : "bg-card border-border text-foreground hover:border-border hover:bg-muted"
                            )}
                          >
                            {tag.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الصورة المميزة</Label>
                    <div className="mt-2 space-y-3">
                      {featuredImageUrl ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border shadow-sm group">
                          <img
                            src={featuredImageUrl}
                            alt="Featured"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setIsMediaSelectorOpen(true)}
                              className="bg-white/90 hover:bg-card"
                            >
                              تغيير
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setFeaturedImageId(undefined);
                                setFeaturedImageUrl(undefined);
                              }}
                            >
                              حذف
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsMediaSelectorOpen(true)}
                          className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center cursor-pointer gap-2 text-muted-foreground hover:text-primary"
                        >
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-sm font-medium">اضغط لاختيار صورة</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <AdminSheetFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="mt-2 sm:mt-0"
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={isLoading} className="min-w-[100px]">
                    {isLoading ? <Spinner size="sm" /> : article ? "تحديث" : "إنشاء"}
                  </Button>
                </AdminSheetFooter>
              </form>
            </TabsContent>
            <TabsContent value="preview" dir={dir} className="pt-6">
              <div className="space-y-6 max-w-none prose prose-slate prose-lg dark:prose-invert mx-auto">
                <div className="space-y-4 not-prose border-b pb-6">
                  {featuredImageUrl && (
                    <div className="w-full h-[300px] overflow-hidden rounded-2xl mb-6 shadow-lg">
                      <img
                        src={featuredImageUrl}
                        alt={title || "Featured"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    {selectedCategories.map(catId => {
                      const cat = categories.find(c => c.id === catId);
                      return cat ? <Badge key={catId} variant="secondary">{cat.name}</Badge> : null;
                    })}
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                    {title || "عنوان المقال"}
                  </h1>
                  {excerpt && (
                    <p className="text-xl text-muted-foreground leading-relaxed font-light">
                      {excerpt}
                    </p>
                  )}
                </div>

                <div
                  className="prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-md"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || "<p class='text-muted-foreground/70 italic'>لا يوجد محتوى...</p>") }}
                />
              </div>
            </TabsContent>
            {article && (
              <TabsContent value="versions" dir={dir} className="pt-6">
                {/* Pending implementation */}
                <div className="text-center py-12 text-muted-foreground/70 bg-muted/30 rounded-xl border border-dashed text-sm">
                  سجل الإصدارات سيكون متاحاً قريباً
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </AdminSheetContent>

      <MediaSelector
        open={isMediaSelectorOpen}
        onOpenChange={setIsMediaSelectorOpen}
        onSelect={(media) => {
          setFeaturedImageId(media.id);
          setFeaturedImageUrl(media.url);
          setIsMediaSelectorOpen(false);
        }}
      />
    </AdminSheet>
  );
}
