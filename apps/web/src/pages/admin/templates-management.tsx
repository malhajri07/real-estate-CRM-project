/**
 * templates-management.tsx - Templates Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → templates-management.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Content template management page. Provides:
 * - Template listing and search
 * - Template CRUD operations
 * - Template type management
 * 
 * Route: /admin/content/content-templates
 * 
 * Related Files:
 * - apps/api/routes/cms-templates.ts - Template API routes
 * - apps/api/services/templateService.ts - Template service
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

interface Template {
  id: string;
  name: string;
  slug: string;
  type: string;
  content: string;
  contentJson?: any;
  variables?: any;
  description?: string;
  category?: string;
  versionCount: number;
  createdAt: string;
}

const fetchTemplates = async (params: {
  type?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{
  items: Template[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append("type", params.type);
  if (params.category) queryParams.append("category", params.category);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  if (params.search) queryParams.append("search", params.search);

  const res = await fetch(`/api/cms/templates?${queryParams.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
};

export default function TemplatesManagement() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["templates", typeFilter, page, searchTerm],
    queryFn: () =>
      fetchTemplates({
        type: typeFilter === "all" ? undefined : typeFilter,
        page,
        pageSize: 20,
        search: searchTerm || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/cms/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء القالب بنجاح" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/cms/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      toast({ title: "تم تحديث القالب بنجاح" });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cms/templates/${id}/clone`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clone template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "تم نسخ القالب بنجاح" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cms/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "تم حذف القالب بنجاح" });
    },
  });

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleSubmit = (formData: any) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة القوالب</h1>
          <p className="text-gray-600">قوالب البريد الإلكتروني والمقالات وصفحات الهبوط</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="ml-2 h-4 w-4" />
          إنشاء قالب جديد
        </Button>
      </div>

      <div className="space-y-6">
        {/* ... (rest of the content remains same) */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="بحث في القوالب..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="max-w-sm"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="نوع القالب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="email">بريد إلكتروني</SelectItem>
                  <SelectItem value="landing_section">قسم صفحة هبوط</SelectItem>
                  <SelectItem value="article">مقال</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8">جار التحميل...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                حدث خطأ في تحميل القوالب
              </div>
            ) : !data?.items.length ? (
              <div className="text-center py-8">لا توجد قوالب</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.items.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline">{template.type}</Badge>
                        <span className="text-xs text-gray-500">
                          {template.versionCount} إصدار
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cloneMutation.mutate(template.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <TemplateDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          template={editingTemplate}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </div>
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("email");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setSlug(template.slug);
        setType(template.type);
        setContent(template.content);
        setDescription(template.description || "");
        setCategory(template.category || "");
      } else {
        setName("");
        setSlug("");
        setType("email");
        setContent("");
        setDescription("");
        setCategory("");
      }
    }
  }, [open, template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      type,
      content,
      description,
      category,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "تعديل القالب" : "إنشاء قالب جديد"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "قم بتعديل معلومات القالب"
              : "املأ المعلومات لإنشاء قالب جديد"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">الرابط (Slug)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="سيتم إنشاؤه تلقائياً من الاسم"
            />
          </div>
          <div>
            <Label htmlFor="type">النوع</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">بريد إلكتروني</SelectItem>
                <SelectItem value="landing_section">قسم صفحة هبوط</SelectItem>
                <SelectItem value="article">مقال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="content">المحتوى</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : template ? "تحديث" : "إنشاء"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

