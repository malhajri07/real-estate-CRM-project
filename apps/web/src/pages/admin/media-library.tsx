import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Search, Grid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const res = await fetch(`/api/cms/media?${queryParams.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch media");
  return res.json();
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
      const res = await fetch("/api/cms/media", {
        method: "POST",
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
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cms/media/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to delete media" }));
        throw new Error(error.message || "Failed to delete media");
      }
    },
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

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>مكتبة الوسائط</CardTitle>
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
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,application/pdf"
                />
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
            <select
              value={mimeTypeFilter}
              onChange={(e) => setMimeTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">جميع الأنواع</option>
              <option value="image">صور</option>
              <option value="video">فيديو</option>
              <option value="application/pdf">PDF</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">جار التحميل...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
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
                    <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-400">
                        {item.mimeType.split("/")[1]}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 text-xs truncate">{item.originalName}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(item.size)}
                      </span>
                      {item.usageCount > 0 && (
                        <span className="text-xs text-blue-600">
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
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">
                        {item.mimeType.split("/")[1]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{item.originalName}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(item.size)} • {item.mimeType}
                      {item.usageCount > 0 && (
                        <span className="text-blue-600 mr-2">
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
  );
}

