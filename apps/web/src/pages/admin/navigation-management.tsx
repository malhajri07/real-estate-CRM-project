/**
 * navigation-management.tsx - Navigation Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Admin Pages → admin/ → navigation-management.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Navigation menu management page. Provides:
 * - Navigation link CRUD operations
 * - Link ordering and visibility
 * - Navigation menu structure management
 * 
 * Route: /admin/content/navigation
 * 
 * Related Files:
 * - apps/api/routes/cms-navigation.ts - Navigation API routes
 * - apps/api/services/navigationService.ts - Navigation service
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

interface NavigationLink {
  id: string;
  label: string;
  href: string;
  order: number;
  visible: boolean;
  target?: "_self" | "_blank";
  icon?: string;
}

const fetchNavigationLinks = async (): Promise<NavigationLink[]> => {
  const res = await apiRequest("GET", "/api/cms/navigation/all");
  return res.json();
};

export default function NavigationManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<NavigationLink | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading, error } = useQuery({
    queryKey: ["navigation-links"],
    queryFn: fetchNavigationLinks,
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedLinks: NavigationLink[]) => {
      const res = await apiRequest("PUT", "/api/cms/navigation", updatedLinks);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links-public"] });
      toast({ title: "تم تحديث روابط التنقل بنجاح" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<NavigationLink>) => {
      const res = await apiRequest("POST", "/api/cms/navigation", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء رابط التنقل بنجاح" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const updatedLinks = links.filter((link) => link.id !== id).map((link, index) => ({
        ...link,
        order: index,
      }));
      const res = await apiRequest("PUT", "/api/cms/navigation", updatedLinks);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({ title: "تم حذف رابط التنقل بنجاح" });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const updatedLinks = links.map((link) =>
        link.id === id ? { ...link, visible } : link
      );
      const res = await apiRequest("PUT", "/api/cms/navigation", updatedLinks);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links-public"] });
      toast({ title: "تم تحديث حالة الرابط بنجاح" });
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedLinks = items.map((link, index) => ({
      ...link,
      order: index,
    }));

    updateMutation.mutate(updatedLinks);
  };

  const handleCreate = () => {
    setEditingLink(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (link: NavigationLink) => {
    setEditingLink(link);
    setIsDialogOpen(true);
  };

  const handleSubmit = (formData: Partial<NavigationLink>) => {
    if (editingLink) {
      const updatedLinks = links.map((link) =>
        link.id === editingLink.id
          ? { ...link, ...formData }
          : link
      );
      updateMutation.mutate(updatedLinks);
      setIsDialogOpen(false);
    } else {
      const newLink = {
        ...formData,
        order: links.length,
        visible: formData.visible ?? true,
      };
      createMutation.mutate(newLink);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة روابط التنقل</h1>
          <p className="text-gray-600">تخصيص القائمة العلوية وروابط الموقع</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة رابط جديد
        </Button>
      </div>

      <div className="space-y-6">
        {/* ... (rest of the content remains same) */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">جار التحميل...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                حدث خطأ في تحميل روابط التنقل
              </div>
            ) : !links.length ? (
              <div className="text-center py-8">لا توجد روابط تنقل</div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="navigation-links">
                  {(provided) => (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>النص</TableHead>
                          <TableHead>الرابط</TableHead>
                          <TableHead>الهدف</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {links.map((link, index) => (
                          <Draggable
                            key={link.id}
                            draggableId={link.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={snapshot.isDragging ? "bg-gray-50" : ""}
                              >
                                <TableCell {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {link.label}
                                </TableCell>
                                <TableCell>
                                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                    {link.href}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  {link.target === "_blank" ? (
                                    <Badge variant="outline">نافذة جديدة</Badge>
                                  ) : (
                                    <Badge variant="secondary">نفس الصفحة</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={link.visible}
                                      onCheckedChange={(checked) =>
                                        toggleVisibilityMutation.mutate({
                                          id: link.id,
                                          visible: checked,
                                        })
                                      }
                                    />
                                    {link.visible ? (
                                      <Eye className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <EyeOff className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(link)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteMutation.mutate(link.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    </Table>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>

        <NavigationLinkDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          link={editingLink}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </div>
  );
}

function NavigationLinkDialog({
  open,
  onOpenChange,
  link,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: NavigationLink | null;
  onSubmit: (data: Partial<NavigationLink>) => void;
  isLoading: boolean;
}) {
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const [target, setTarget] = useState<"_self" | "_blank">("_self");
  const [visible, setVisible] = useState(true);
  const [icon, setIcon] = useState("");

  useEffect(() => {
    if (open) {
      if (link) {
        setLabel(link.label);
        setHref(link.href);
        setTarget(link.target || "_self");
        setVisible(link.visible);
        setIcon(link.icon || "");
      } else {
        setLabel("");
        setHref("");
        setTarget("_self");
        setVisible(true);
        setIcon("");
      }
    }
  }, [open, link]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      label,
      href,
      target,
      visible,
      icon: icon || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {link ? "تعديل رابط التنقل" : "إضافة رابط تنقل جديد"}
          </DialogTitle>
          <DialogDescription>
            {link
              ? "قم بتعديل معلومات رابط التنقل"
              : "أضف رابطاً جديداً إلى قائمة التنقل العلوية"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="label">النص</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: المدونة"
              required
            />
          </div>
          <div>
            <Label htmlFor="href">الرابط</Label>
            <Input
              id="href"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="مثال: /blog أو https://example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="target">الهدف</Label>
            <Select value={target} onValueChange={(v: "_self" | "_blank") => setTarget(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">نفس الصفحة</SelectItem>
                <SelectItem value="_blank">نافذة جديدة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="icon">الأيقونة (اختياري)</Label>
            <Input
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="اسم أيقونة Lucide (مثال: BookOpen)"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="visible"
              checked={visible}
              onCheckedChange={setVisible}
            />
            <Label htmlFor="visible">مرئي في القائمة</Label>
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
              {isLoading ? "جاري الحفظ..." : link ? "تحديث" : "إنشاء"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
