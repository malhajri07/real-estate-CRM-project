/**
 * seo-management.tsx - SEO Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → seo-management.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * SEO settings management page. Provides:
 * - SEO metadata management
 * - Open Graph settings
 * - Page-specific SEO configuration
 * 
 * Route: /admin/content/seo-settings
 * 
 * Related Files:
 * - apps/api/routes/cms-seo.ts - SEO API routes
 * - apps/api/services/seoService.ts - SEO service
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, FileText, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

interface SEOSettings {
  pagePath: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robotsMeta?: string;
  canonicalUrl?: string;
}

const fetchSEOSettings = async (): Promise<SEOSettings[]> => {
  const res = await apiRequest("GET", "/api/cms/seo");
  return res.json();
};

const fetchSitemap = async (): Promise<string> => {
  const res = await apiRequest("GET", "/api/cms/seo/sitemap.xml");
  return res.text();
};

export default function SEOManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [formData, setFormData] = useState<SEOSettings>({
    pagePath: "",
  });

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["seo-settings"],
    queryFn: fetchSEOSettings,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SEOSettings) => {
      const res = await apiRequest("PUT", `/api/cms/seo${data.pagePath}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-settings"] });
      toast({ title: "تم حفظ إعدادات SEO بنجاح" });
    },
  });

  const sitemapMutation = useMutation({
    mutationFn: fetchSitemap,
    onSuccess: (xml) => {
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sitemap.xml";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "تم تنزيل ملف sitemap.xml" });
    },
  });

  const fetchRobotsTxt = async (): Promise<string> => {
    const res = await apiRequest("GET", "/api/cms/seo/robots.txt/content");
    const data = await res.json();
    return data.content;
  };

  const { data: robotsTxtContent = "", isLoading: isLoadingRobots } = useQuery({
    queryKey: ["robots-txt"],
    queryFn: fetchRobotsTxt,
  });

  const [robotsTxt, setRobotsTxt] = useState("");

  useEffect(() => {
    if (robotsTxtContent) {
      setRobotsTxt(robotsTxtContent);
    }
  }, [robotsTxtContent]);

  const robotsTxtMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("PUT", "/api/cms/seo/robots.txt", { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["robots-txt"] });
      toast({ title: "تم حفظ robots.txt بنجاح" });
    },
  });

  const handleSelectPage = (pagePath: string) => {
    const setting = settings.find((s) => s.pagePath === pagePath);
    setSelectedPage(pagePath);
    setFormData(
      setting || {
        pagePath,
        ogType: "website",
        twitterCard: "summary_large_image",
        robotsMeta: "index, follow",
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة SEO</h1>
        <p className="text-gray-600">تحسين محركات البحث وملفات sitemap</p>
      </div>

      <div className="space-y-6">
        {/* ... (rest of the content remains same) */}
        <Tabs defaultValue="seo" className="w-full">
          <TabsList>
            <TabsTrigger value="seo">إعدادات SEO</TabsTrigger>
            <TabsTrigger value="robots">Robots.txt</TabsTrigger>
          </TabsList>
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>إعدادات SEO</CardTitle>
                  <Button onClick={() => sitemapMutation.mutate()}>
                    <FileText className="h-4 w-4" />
                    إنشاء Sitemap
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <Label className="mb-2 block">الصفحات</Label>
                    <div className="space-y-2">
                      <Button
                        variant={selectedPage === "/" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleSelectPage("/")}
                      >
                        الصفحة الرئيسية (/)
                      </Button>
                      <Button
                        variant={selectedPage === "/blog" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleSelectPage("/blog")}
                      >
                        المدونة (/blog)
                      </Button>
                      {settings
                        .filter((s) => s.pagePath !== "/" && s.pagePath !== "/blog")
                        .map((setting) => (
                          <Button
                            key={setting.pagePath}
                            variant={
                              selectedPage === setting.pagePath ? "default" : "outline"
                            }
                            className="w-full justify-start"
                            onClick={() => handleSelectPage(setting.pagePath)}
                          >
                            {setting.pagePath}
                          </Button>
                        ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    {selectedPage ? (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="metaTitle">عنوان Meta</Label>
                          <Input
                            id="metaTitle"
                            value={formData.metaTitle || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, metaTitle: e.target.value })
                            }
                            maxLength={60}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.metaTitle?.length || 0}/60
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="metaDescription">وصف Meta</Label>
                          <Textarea
                            id="metaDescription"
                            value={formData.metaDescription || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                metaDescription: e.target.value,
                              })
                            }
                            maxLength={160}
                            rows={3}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.metaDescription?.length || 0}/160
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="metaKeywords">الكلمات المفتاحية</Label>
                          <Input
                            id="metaKeywords"
                            value={formData.metaKeywords || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, metaKeywords: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ogTitle">عنوان Open Graph</Label>
                          <Input
                            id="ogTitle"
                            value={formData.ogTitle || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, ogTitle: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ogDescription">وصف Open Graph</Label>
                          <Textarea
                            id="ogDescription"
                            value={formData.ogDescription || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ogDescription: e.target.value,
                              })
                            }
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="ogImage">صورة Open Graph</Label>
                          <Input
                            id="ogImage"
                            type="url"
                            value={formData.ogImage || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, ogImage: e.target.value })
                            }
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div>
                          <Label htmlFor="canonicalUrl">رابط Canonical</Label>
                          <Input
                            id="canonicalUrl"
                            type="url"
                            value={formData.canonicalUrl || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                canonicalUrl: e.target.value,
                              })
                            }
                            placeholder="https://example.com/page"
                          />
                        </div>
                        <Button type="submit" disabled={updateMutation.isPending}>
                          <Save className="h-4 w-4" />
                          {updateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                      </form>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        اختر صفحة لتعديل إعدادات SEO الخاصة بها
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="robots">
            <Card>
              <CardHeader>
                <CardTitle>Robots.txt Editor</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRobots ? (
                  <div className="text-center py-8">جار التحميل...</div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="robotsTxt">محتوى robots.txt</Label>
                      <Textarea
                        id="robotsTxt"
                        value={robotsTxt}
                        onChange={(e) => setRobotsTxt(e.target.value)}
                        rows={15}
                        className="font-mono text-sm"
                        placeholder="User-agent: *
Allow: /
Disallow: /admin/"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => robotsTxtMutation.mutate(robotsTxt)}
                        disabled={robotsTxtMutation.isPending}
                      >
                        <Save className="h-4 w-4" />
                        {robotsTxtMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const blob = new Blob([robotsTxt], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "robots.txt";
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        تنزيل
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

