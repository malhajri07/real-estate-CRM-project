/**
 * media-library.tsx - Media Library Page
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → media-library.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Media library management page. Provides:
 * - Media file listing
 * - Media upload functionality
 * - Media file deletion
 * - Media metadata management
 * 
 * Route: /admin/content/media-library
 * 
 * Related Files:
 * - apps/api/routes/cms-media.ts - Media API routes
 * - apps/api/services/mediaService.ts - Media service
 * - apps/web/src/components/cms/MediaSelector.tsx - Media selector component
 */

import { useState } from "react";
import { PageSectionHeader } from "@/components/ui/page-section-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete, getAuthHeaders } from "@/lib/apiClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Trash2, Search, Grid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageSkeleton } from "@/components/skeletons/page-skeletons";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PAGE_WRAPPER } from "@/config/platform-theme";

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  usageCount: number;
  createdAt: string;
}

const fetchMedia = async (params: {
  page?: number;
  pageSize?: number;
  search?: string;
  mimeType?: string;
}): Promise<{
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.mimeType) queryParams.append("mimeType", params.mimeType);

  if (params.mimeType) queryParams.append("mimeType", params.mimeType);

  return apiGet(`api/cms/media?${queryParams.toString()}`);
};

export default function MediaLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["media", mimeTypeFilter, page, searchTerm],
    queryFn: () =>
      fetchMedia({
        page,
        pageSize: 50,
        search: searchTerm || undefined,
        mimeType: mimeTypeFilter === "all" ? undefined : mimeTypeFilter,
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      // FormData uploads need raw fetch (apiClient auto-sets Content-Type to JSON)
      const res = await fetch("/api/cms/media", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload media");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast({ title: "تم رفع الملف بنجاح" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiDelete(`api/cms/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast({ title: "تم حذف الملف بنجاح" });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في حذف الملف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        uploadMutation.mutate(file);
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className={PAGE_WRAPPER}>
        <AdminPageSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageSectionHeader
        title="مكتبة الوسائط"
        subtitle="إدارة الملفات والوسائط"
        actions={
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="ml-2 h-4 w-4" />
              شبكة
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="ml-2 h-4 w-4" />
              قائمة
            </Button>
            <label>
              <Button asChild>
                <span>
                  <Upload className="ml-2 h-4 w-4" />
                  رفع ملفات
                </span>
              </Button>
              <Input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,video/*,application/pdf"
              />
            </label>
          </div>
        }
      />

      <div className="space-y-6">
        {/* ... (rest of the content remains same) */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="بحث في الملفات..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="max-w-sm"
              />
              <Select value={mimeTypeFilter} onValueChange={setMimeTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="image">صور</SelectItem>
                  <SelectItem value="video">فيديو</SelectItem>
                  <SelectItem value="application/pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <div className="text-center py-8 text-destructive">
                حدث خطأ في تحميل الملفات
              </div>
            ) : !data?.items.length ? (
              <div className="text-center py-8">لا توجد ملفات</div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {data.items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-2 hover:shadow-md transition"
                  >
                    {item.mimeType.startsWith("image/") ? (
                      <img
                        src={item.url}
                        alt={item.alt || item.title || item.originalName}
                        className="w-full h-32 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-32 bg-muted/50 rounded flex items-center justify-center">
                        <span className="text-muted-foreground/70">
                          {item.mimeType.split("/")[1]}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 text-xs truncate">{item.originalName}</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(item.size)}
                        </span>
                        {item.usageCount > 0 && (
                          <span className="text-xs text-primary">
                            مستخدم {item.usageCount} مرة
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (item.usageCount > 0) {
                            toast({
                              title: "لا يمكن حذف الملف",
                              description: `هذا الملف مستخدم في ${item.usageCount} مكان. يرجى إزالته من جميع الأماكن أولاً.`,
                              variant: "destructive",
                            });
                          } else {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        disabled={item.usageCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {data.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    {item.mimeType.startsWith("image/") ? (
                      <img
                        src={item.url}
                        alt={item.alt || item.title || item.originalName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted/50 rounded flex items-center justify-center">
                        <span className="text-muted-foreground/70 text-xs">
                          {item.mimeType.split("/")[1]}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{item.originalName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(item.size)} • {item.mimeType}
                        {item.usageCount > 0 && (
                          <span className="text-primary mr-2">
                            • مستخدم {item.usageCount} مرة
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (item.usageCount > 0) {
                          toast({
                            title: "لا يمكن حذف الملف",
                            description: `هذا الملف مستخدم في ${item.usageCount} مكان. يرجى إزالته من جميع الأماكن أولاً.`,
                            variant: "destructive",
                          });
                        } else {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      disabled={item.usageCount > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

