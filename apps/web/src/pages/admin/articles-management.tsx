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
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const res = await apiRequest("GET", `/api/cms/articles?${queryParams.toString()}`);
  return res.json();
};

const fetchCategories = async () => {
  const res = await apiRequest("GET", "/api/cms/articles/categories");
  return res.json();
};

const fetchTags = async () => {
  const res = await apiRequest("GET", "/api/cms/articles/tags");
  return res.json();
};

interface ArticleVersion {
  id: string;
  articleId: string;
  version: number;
  snapshot: any;
  createdBy?: string;
  createdAt: string;
}

function ArticleVersionHistory({ articleId, onRestore }: { articleId: string; onRestore: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["article-versions", articleId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/cms/articles/${articleId}/versions`);
      return res.json() as Promise<ArticleVersion[]>;
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (version: number) => {
      const res = await apiRequest("POST", `/api/cms/articles/${articleId}/versions/${version}/restore`);
      return res.json();
    },
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
    return <div className="text-center py-8 text-gray-500">لا توجد إصدارات سابقة</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        تم العثور على {versions.length} إصدار
      </div>
      <div className="space-y-3">
        {versions.map((version) => {
          const snapshot = version.snapshot as any;
          return (
            <Card key={version.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between" dir="rtl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">الإصدار {version.version}</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(version.createdAt).toLocaleString("ar-SA")}
                      </span>
                      {version.createdBy && (
                        <span className="text-sm text-gray-500">
                          بواسطة: {version.createdBy}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{snapshot.title || "بدون عنوان"}</div>
                      {snapshot.excerpt && (
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {snapshot.excerpt}
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
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/cms/articles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء المقال بنجاح" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/cms/articles/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setIsDialogOpen(false);
      setEditingArticle(null);
      toast({ title: "تم تحديث المقال بنجاح" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/cms/articles/${id}/publish`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "تم نشر المقال بنجاح" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cms/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "تم حذف المقال بنجاح" });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, articleIds }: { action: string; articleIds: string[] }) => {
      const res = await apiRequest("POST", "/api/cms/articles/bulk", { action, articleIds });
      return res.json();
    },
    onSuccess: (data) => {
      const successCount = data.results.filter((r: any) => r.success).length;
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setSelectedArticles(new Set());
      toast({
        title: "تم تنفيذ الإجراء بنجاح",
        description: `تم معالجة ${successCount} من ${data.results.length} مقال`,
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

  const handleSubmit = (formData: any) => {
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
    const labels: Record<string, string> = {
      published: "منشور",
      draft: "مسودة",
      archived: "مؤرشف",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المقالات</h1>
          <p className="text-gray-600">إدارة ونشر المحتوى والمقالات</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="ml-2 h-4 w-4" />
          إنشاء مقال جديد
        </Button>
      </div>

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
              <div className="text-center py-8 text-red-600">
                <div>حدث خطأ في تحميل المقالات</div>
                <div className="text-sm mt-2 text-gray-500">
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
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
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
                          {new Date(article.createdAt).toLocaleDateString("ar-SA")}
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
          categories={categories}
          tags={tags}
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
  onSubmit: (data: any) => void;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {article ? "تعديل المقال" : "إنشاء مقال جديد"}
          </DialogTitle>
          <DialogDescription>
            {article
              ? "قم بتعديل معلومات المقال"
              : "املأ المعلومات لإنشاء مقال جديد"}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="edit" className="w-full" dir="rtl">
          <TabsList>
            <TabsTrigger value="edit">تحرير</TabsTrigger>
            <TabsTrigger value="preview">معاينة</TabsTrigger>
            {article && <TabsTrigger value="versions">سجل الإصدارات</TabsTrigger>}
          </TabsList>
          <TabsContent value="edit">
            <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
              <div>
                <Label htmlFor="title">العنوان</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">الرابط (Slug)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="سيتم إنشاؤه تلقائياً من العنوان"
                />
              </div>
              <div>
                <Label htmlFor="excerpt">الملخص</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="content">المحتوى</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="اكتب محتوى المقال هنا..."
                />
              </div>
              <div>
                <Label>الصورة المميزة</Label>
                <div className="mt-2 space-y-2">
                  {featuredImageUrl && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={featuredImageUrl}
                        alt="Featured"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 left-1 rtl:left-auto rtl:right-1"
                        onClick={() => {
                          setFeaturedImageId(undefined);
                          setFeaturedImageUrl(undefined);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMediaSelectorOpen(true)}
                  >
                    <ImageIcon className="ml-2 rtl:ml-0 rtl:mr-2 h-4 w-4" />
                    {featuredImageUrl ? "تغيير الصورة" : "اختر صورة"}
                  </Button>
                </div>
              </div>
              <div>
                <Label>التصنيفات</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      type="button"
                      variant={
                        selectedCategories.includes(cat.id) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedCategories((prev) =>
                          prev.includes(cat.id)
                            ? prev.filter((id) => id !== cat.id)
                            : [...prev, cat.id]
                        );
                      }}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>الوسوم</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant={
                        selectedTags.includes(tag.id) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedTags((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-start gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "جاري الحفظ..." : article ? "تحديث" : "إنشاء"}
                </Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="preview" dir="rtl">
            <div className="space-y-4">
              {featuredImageUrl && (
                <div className="w-full h-64 overflow-hidden rounded-lg">
                  <img
                    src={featuredImageUrl}
                    alt={title || "Featured"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h1 className="text-3xl font-bold">{title || "عنوان المقال"}</h1>
              {excerpt && <p className="text-lg text-gray-600">{excerpt}</p>}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: content || "<p>لا يوجد محتوى</p>" }}
              />
              {selectedCategories.length > 0 && (
                <div className="flex gap-2">
                  {selectedCategories.map((catId) => {
                    const cat = categories.find((c) => c.id === catId);
                    return cat ? (
                      <Badge key={catId} variant="outline">
                        {cat.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
              {selectedTags.length > 0 && (
                <div className="flex gap-2">
                  {selectedTags.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} variant="secondary">
                        {tag.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          {article && (
            <TabsContent value="versions" dir="rtl">
              <ArticleVersionHistory articleId={article.id} onRestore={() => {
                onOpenChange(false);
                queryClient.invalidateQueries({ queryKey: ["articles"] });
              }} />
            </TabsContent>
          )}
        </Tabs>
        <MediaSelector
          open={isMediaSelectorOpen}
          onOpenChange={setIsMediaSelectorOpen}
          filterType="image"
          onSelect={(media: { id: string; url: string }) => {
            setFeaturedImageId(media.id);
            setFeaturedImageUrl(media.url);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

