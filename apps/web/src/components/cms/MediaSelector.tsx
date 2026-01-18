/**
 * MediaSelector.tsx - Media Selector Component
 * 
 * Location: apps/web/src/ → Components/ → CMS Components → MediaSelector.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Media selector component for CMS. Provides:
 * - Media library browsing
 * - Media selection interface
 * - Image preview
 * 
 * Related Files:
 * - apps/web/src/pages/admin/media-library.tsx - Media library page
 * - apps/api/routes/cms-media.ts - Media API routes
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Grid, List, Search, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface MediaSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: MediaItem) => void;
  filterType?: "image" | "video" | "all";
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

export function MediaSelector({
  open,
  onOpenChange,
  onSelect,
  filterType = "image",
}: MediaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const mimeTypeFilter =
    filterType === "image"
      ? "image"
      : filterType === "video"
      ? "video"
      : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["media-selector", mimeTypeFilter, page, searchTerm],
    queryFn: () =>
      fetchMedia({
        page,
        pageSize: 50,
        search: searchTerm || undefined,
        mimeType: mimeTypeFilter,
      }),
    enabled: open,
  });

  const handleSelect = (media: MediaItem) => {
    onSelect(media);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>اختر من المكتبة</DialogTitle>
          <DialogDescription>
            اختر ملفاً من مكتبة الوسائط
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث في الملفات..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
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
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">جار التحميل...</div>
          ) : !data?.items.length ? (
            <div className="text-center py-8">لا توجد ملفات</div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-2 hover:shadow-md transition cursor-pointer"
                  onClick={() => handleSelect(item)}
                >
                  {item.mimeType.startsWith("image/") ? (
                    <img
                      src={item.url}
                      alt={item.alt || item.title || item.originalName}
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="mt-2 text-xs truncate">{item.originalName}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelect(item)}
                >
                  {item.mimeType.startsWith("image/") ? (
                    <img
                      src={item.url}
                      alt={item.alt || item.title || item.originalName}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{item.originalName}</div>
                    <div className="text-sm text-gray-500">
                      {item.mimeType}
                    </div>
                  </div>
                  <Button size="sm">اختر</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

