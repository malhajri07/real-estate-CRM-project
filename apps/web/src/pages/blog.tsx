/**
 * blog.tsx - Blog Listing Page
 * 
 * Location: apps/web/src/ → Pages/ → Public Pages → blog.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Public blog listing page. Displays:
 * - Blog articles listing
 * - Article search and filtering
 * - Article sharing
 * 
 * Route: /blog
 * 
 * Related Files:
 * - apps/api/routes/cms-articles.ts - Articles API routes
 * - apps/web/src/pages/admin/articles-management.tsx - Article management
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import DOMPurify from "isomorphic-dompurify";
import { apiGet } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, User, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, ArrowLeft, Filter, X } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import { useSEO } from "@/hooks/useSEO";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  featuredImageId?: string;
  featuredImage?: { id: string; url: string; alt?: string };
  metaTitle?: string;
  metaDescription?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

const fetchArticles = async (params: {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  tagId?: string;
}): Promise<{
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const queryParams = new URLSearchParams();
  queryParams.append("status", "published");
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.categoryId) queryParams.append("categoryId", params.categoryId);
  if (params.tagId) queryParams.append("tagId", params.tagId);

  return apiGet<{
    items: Article[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(`api/cms/articles?${queryParams.toString()}`);
};

const fetchArticleBySlug = async (slug: string): Promise<Article> =>
  apiGet<Article>(`api/cms/articles/slug/${slug}`);

const fetchCategories = async (): Promise<Category[]> =>
  apiGet<Category[]>("api/cms/articles/categories").catch(() => []);

const fetchTags = async (): Promise<Tag[]> =>
  apiGet<Tag[]>("api/cms/articles/tags").catch(() => []);

export default function BlogPage() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Check if we're viewing a single article
  const slugMatch = location.match(/^\/blog\/(.+)$/);
  const articleSlug = slugMatch ? slugMatch[1] : null;

  const { data: article, isLoading: isLoadingArticle } = useQuery({
    queryKey: ["article", articleSlug],
    queryFn: () => fetchArticleBySlug(articleSlug!),
    enabled: !!articleSlug,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["article-categories"],
    queryFn: fetchCategories,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["article-tags"],
    queryFn: fetchTags,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["articles", "published", page, searchTerm, selectedCategory, selectedTag],
    queryFn: () =>
      fetchArticles({
        page,
        pageSize: 12,
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
        tagId: selectedTag || undefined,
      }),
    enabled: !articleSlug,
  });

  // Apply SEO meta tags
  useSEO(
    articleSlug ? `/blog/${articleSlug}` : "/blog",
    articleSlug ? (article?.metaTitle || article?.title) : "المدونة",
    articleSlug ? (article?.metaDescription || article?.excerpt) : "اقرأ آخر المقالات والأخبار في عالم العقارات"
  );

  const shareUrl = articleSlug ? `${window.location.origin}/blog/${articleSlug}` : `${window.location.origin}/blog`;
  const shareTitle = articleSlug ? article?.title : "المدونة";

  const handleShare = (platform: "facebook" | "twitter" | "linkedin" | "copy") => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle || "");
    const text = encodeURIComponent(article?.excerpt || "");

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        break;
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchTerm("");
    setPage(1);
  };

  const hasActiveFilters = selectedCategory || selectedTag || searchTerm;

  if (articleSlug) {
    // Single article view
    if (isLoadingArticle) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white" dir="rtl">
          <PublicHeader />
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center text-muted-foreground">جار التحميل...</div>
          </div>
        </div>
      );
    }

    if (!article) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white" dir="rtl">
          <PublicHeader />
          <div className="max-w-4xl mx-auto px-4 py-16">
            <Card>
              <CardContent className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">المقال غير موجود</h1>
                <p className="text-muted-foreground mb-6">عذراً، لم يتم العثور على المقال المطلوب.</p>
                <Button onClick={() => setLocation("/blog")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  العودة إلى المدونة
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white" dir="rtl">
        <PublicHeader />
        <article className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/blog">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                العودة إلى المدونة
              </Button>
            </Link>
          </div>
          <Card className="overflow-hidden">
            {article.featuredImage?.url && (
              <div className="w-full h-64 md:h-96 overflow-hidden">
                <img
                  src={article.featuredImage.url}
                  alt={article.featuredImage.alt || article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{article.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
                {article.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(article.publishedAt).toLocaleDateString("ar-SA", { 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}</span>
                  </div>
                )}
                {article.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.categories.map((cat) => (
                      <Badge key={cat.id} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {article.excerpt && (
                <p className="text-lg text-foreground/80 mb-8 leading-relaxed">{article.excerpt}</p>
              )}
              <div
                className="prose prose-lg max-w-none mb-8 prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-primary prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
              />
              {article.tags.length > 0 && (
                <div className="mb-8 pt-6 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground font-medium">الوسوم:</span>
                    {article.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="bg-muted/50 text-foreground/80 hover:bg-slate-200">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-foreground/80">شارك المقال:</span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("facebook")}
                      className="gap-2"
                    >
                      <Facebook className="h-4 w-4" />
                      فيسبوك
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("twitter")}
                      className="gap-2"
                    >
                      <Twitter className="h-4 w-4" />
                      تويتر
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("linkedin")}
                      className="gap-2"
                    >
                      <Linkedin className="h-4 w-4" />
                      لينكد إن
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("copy")}
                      className="gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      نسخ الرابط
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </article>
      </div>
    );
  }

  // Article list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white" dir="rtl">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">المدونة</h1>
          <p className="text-lg text-muted-foreground mb-6">اقرأ آخر المقالات والأخبار في عالم العقارات</p>
          
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
              <Input
                placeholder="بحث في المقالات..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pr-10"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                إزالة الفلاتر
              </Button>
            )}
          </div>

          {/* Categories Filter */}
          {categories.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(null);
                    setPage(1);
                  }}
                  className={cn(
                    selectedCategory === null
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-white hover:bg-muted/30"
                  )}
                >
                  الكل
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setPage(1);
                    }}
                    className={cn(
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-white hover:bg-muted/30"
                    )}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTag === tag.id ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedTag === tag.id
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-white hover:bg-primary/10"
                    )}
                    onClick={() => {
                      setSelectedTag(selectedTag === tag.id ? null : tag.id);
                      setPage(1);
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="text-muted-foreground">جار التحميل...</div>
          </div>
        ) : !data?.items.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground text-lg mb-4">لا توجد مقالات</div>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  إزالة الفلاتر
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data.items.map((article) => (
                <Card key={article.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                  {article.featuredImage?.url && (
                    <div className="relative w-full h-48 overflow-hidden">
                      <img
                        src={article.featuredImage.url}
                        alt={article.featuredImage.alt || article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted-foreground">
                      {article.publishedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(article.publishedAt).toLocaleDateString("ar-SA")}</span>
                        </div>
                      )}
                      {article.categories.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {article.categories[0].name}
                        </Badge>
                      )}
                    </div>
                    <Link href={`/blog/${article.slug}`}>
                      <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-foreground/80 transition-colors cursor-pointer line-clamp-2">
                        {article.title}
                      </h2>
                    </Link>
                    {article.excerpt && (
                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">{article.excerpt}</p>
                    )}
                    <Link href={`/blog/${article.slug}`}>
                      <Button variant="outline" className="w-full mt-auto">
                        اقرأ المزيد
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  السابق
                </Button>
                <span className="px-4 py-2 text-foreground/80">
                  صفحة {page} من {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="gap-2"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
