/**
 * projects/index.tsx — Off-Plan Projects Management
 *
 * Stats row + project card grid + detail sheet with unit table.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { ProjectsSkeleton } from "@/components/skeletons/page-skeletons";
import {
  Building,
  Plus,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Ban,
  Home,
  User,
  Phone,
  Ruler,
  BedDouble,
  Bath,
  DollarSign,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/ui/page-header";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SarPrice } from "@/components/ui/sar-symbol";

// ── Types ──────────────────────────────────────────────────────────────────

interface ProjectStats {
  totalProjects: number;
  totalUnits: number;
  sold: number;
  available: number;
  reserved: number;
  soldPercent: number;
  revenue: number;
}

interface Project {
  id: string;
  name: string;
  developer?: string;
  city: string;
  district?: string;
  description?: string;
  status: string;
  completionDate?: string;
  totalUnits: number;
  coverImage?: string;
  unitsSold: number;
  unitsAvailable: number;
  unitsReserved: number;
  unitsTotal: number;
  createdAt: string;
}

interface ProjectUnit {
  id: string;
  projectId: string;
  unitNumber: string;
  floor?: number;
  type?: string;
  areaSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  price?: number;
  status: string;
  buyerName?: string;
  buyerPhone?: string;
  reservedAt?: string;
  paymentSchedule?: string;
}

interface ProjectDetail extends Omit<Project, "unitsSold" | "unitsAvailable" | "unitsReserved" | "unitsTotal"> {
  units: ProjectUnit[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PLANNING: { label: "تخطيط", variant: "outline" },
  UNDER_CONSTRUCTION: { label: "قيد الإنشاء", variant: "default" },
  COMPLETED: { label: "مكتمل", variant: "secondary" },
  ON_HOLD: { label: "متوقف", variant: "destructive" },
};

const UNIT_STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  AVAILABLE: { label: "متاح", variant: "secondary" },
  RESERVED: { label: "محجوز", variant: "default" },
  SOLD: { label: "مباع", variant: "destructive" },
  BLOCKED: { label: "محظور", variant: "outline" },
};

function formatDate(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateUnit, setShowCreateUnit] = useState(false);

  // form state - new project
  const [newProject, setNewProject] = useState({
    name: "",
    developer: "",
    city: "",
    district: "",
    description: "",
    status: "PLANNING",
    completionDate: "",
    totalUnits: 0,
  });

  // form state - new unit
  const [newUnit, setNewUnit] = useState({
    unitNumber: "",
    floor: "",
    type: "apartment",
    areaSqm: "",
    bedrooms: "",
    bathrooms: "",
    price: "",
  });

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: stats, isLoading: statsLoading } = useQuery<ProjectStats>({
    queryKey: ["/api/projects/stats"],
    queryFn: () => apiGet<ProjectStats>("/api/projects/stats"),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: () => apiGet<Project[]>("/api/projects"),
  });

  const { data: projectDetail, isLoading: detailLoading } = useQuery<ProjectDetail>({
    queryKey: ["/api/projects", selectedProjectId],
    queryFn: () => apiGet<ProjectDetail>(`/api/projects/${selectedProjectId}`),
    enabled: !!selectedProjectId,
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createProjectMutation = useMutation({
    mutationFn: (data: typeof newProject) => apiPost("/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/stats"] });
      setShowCreateProject(false);
      setNewProject({ name: "", developer: "", city: "", district: "", description: "", status: "PLANNING", completionDate: "", totalUnits: 0 });
      toast.success("تم إنشاء المشروع بنجاح");
    },
    onError: () => toast.error("فشل إنشاء المشروع"),
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: any) =>
      apiPost(`/api/projects/${selectedProjectId}/units`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/stats"] });
      setShowCreateUnit(false);
      setNewUnit({ unitNumber: "", floor: "", type: "apartment", areaSqm: "", bedrooms: "", bathrooms: "", price: "" });
      toast.success("تم إضافة الوحدة بنجاح");
    },
    onError: () => toast.error("فشل إضافة الوحدة"),
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ unitId, data }: { unitId: string; data: any }) =>
      apiPatch(`/api/projects/${selectedProjectId}/units/${unitId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/stats"] });
      toast.success("تم تحديث الوحدة بنجاح");
    },
    onError: () => toast.error("فشل تحديث الوحدة"),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleReserve(unit: ProjectUnit) {
    const buyerName = window.prompt("اسم المشتري:");
    if (!buyerName) return;
    const buyerPhone = window.prompt("رقم جوال المشتري:");
    updateUnitMutation.mutate({
      unitId: unit.id,
      data: {
        status: "RESERVED",
        buyerName,
        buyerPhone: buyerPhone || undefined,
        reservedAt: new Date().toISOString(),
      },
    });
  }

  function handleMarkSold(unit: ProjectUnit) {
    updateUnitMutation.mutate({
      unitId: unit.id,
      data: { status: "SOLD" },
    });
  }

  function handleSubmitProject() {
    if (!newProject.name || !newProject.city) {
      toast.error("الاسم والمدينة مطلوبان");
      return;
    }
    createProjectMutation.mutate(newProject);
  }

  function handleSubmitUnit() {
    if (!newUnit.unitNumber) {
      toast.error("رقم الوحدة مطلوب");
      return;
    }
    createUnitMutation.mutate({
      unitNumber: newUnit.unitNumber,
      floor: newUnit.floor ? parseInt(newUnit.floor) : undefined,
      type: newUnit.type || undefined,
      areaSqm: newUnit.areaSqm ? parseFloat(newUnit.areaSqm) : undefined,
      bedrooms: newUnit.bedrooms ? parseInt(newUnit.bedrooms) : undefined,
      bathrooms: newUnit.bathrooms ? parseInt(newUnit.bathrooms) : undefined,
      price: newUnit.price ? parseFloat(newUnit.price) : undefined,
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const isLoading = statsLoading || projectsLoading;

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="المشاريع" subtitle="إدارة مشاريع البيع على الخارطة" />
        <ProjectsSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="المشاريع" subtitle="إدارة مشاريع البيع على الخارطة">
        <Button onClick={() => setShowCreateProject(true)}>
          <Plus className="h-4 w-4 ml-2" />
          مشروع جديد
        </Button>
      </PageHeader>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">إجمالي المشاريع</p>
                <p className="text-2xl font-bold">{stats?.totalProjects ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">إجمالي الوحدات</p>
                <p className="text-2xl font-bold">{stats?.totalUnits ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">نسبة المبيعات</p>
                <p className="text-2xl font-bold">{stats?.soldPercent ?? 0}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">متاحة</p>
                <p className="text-2xl font-bold text-green-600">{stats?.available ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">محجوزة</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.reserved ?? 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Project Cards Grid ────────────────────────────────────────── */}
      {projectsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !projects?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">لا توجد مشاريع بعد</p>
            <p className="text-sm text-muted-foreground mt-1">ابدأ بإنشاء مشروع جديد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const badge = STATUS_BADGES[project.status] ?? STATUS_BADGES.PLANNING;
            const soldPct =
              project.unitsTotal > 0
                ? Math.round((project.unitsSold / project.unitsTotal) * 100)
                : 0;

            return (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProjectId(project.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {project.name}
                    </CardTitle>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  {project.developer && (
                    <p className="text-xs text-muted-foreground">{project.developer}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {project.city}
                      {project.district ? ` - ${project.district}` : ""}
                    </span>
                    {project.completionDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(project.completionDate)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      {project.unitsTotal} وحدة
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {project.unitsAvailable} متاح
                    </span>
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="h-3.5 w-3.5" />
                      {project.unitsReserved} محجوز
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">نسبة البيع</span>
                      <span className="font-medium">{soldPct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${soldPct}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Project Detail Sheet ──────────────────────────────────────── */}
      <Sheet
        open={!!selectedProjectId}
        onOpenChange={(open) => {
          if (!open) setSelectedProjectId(null);
        }}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{projectDetail?.name ?? "..."}</SheetTitle>
            <SheetDescription>
              {projectDetail?.city}
              {projectDetail?.district ? ` - ${projectDetail.district}` : ""}
              {projectDetail?.developer ? ` | ${projectDetail.developer}` : ""}
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="space-y-3 mt-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  الوحدات ({projectDetail?.units?.length ?? 0})
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateUnit(true)}
                >
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة وحدة
                </Button>
              </div>

              {!projectDetail?.units?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  لا توجد وحدات بعد
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الوحدة</TableHead>
                        <TableHead className="text-right">الطابق</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">المساحة</TableHead>
                        <TableHead className="text-right">السعر</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">المشتري</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectDetail.units.map((unit) => {
                        const uBadge =
                          UNIT_STATUS_BADGES[unit.status] ??
                          UNIT_STATUS_BADGES.AVAILABLE;
                        return (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">
                              {unit.unitNumber}
                            </TableCell>
                            <TableCell>{unit.floor ?? "-"}</TableCell>
                            <TableCell>{unit.type ?? "-"}</TableCell>
                            <TableCell>
                              {unit.areaSqm ? `${unit.areaSqm} م²` : "-"}
                            </TableCell>
                            <TableCell>
                              {unit.price ? (
                                <SarPrice value={unit.price} />
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={uBadge.variant}>
                                {uBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {unit.buyerName || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {unit.status === "AVAILABLE" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => handleReserve(unit)}
                                    disabled={updateUnitMutation.isPending}
                                  >
                                    حجز
                                  </Button>
                                )}
                                {(unit.status === "AVAILABLE" ||
                                  unit.status === "RESERVED") && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs"
                                    onClick={() => handleMarkSold(unit)}
                                    disabled={updateUnitMutation.isPending}
                                  >
                                    بيع
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Create Project Sheet ──────────────────────────────────────── */}
      <Sheet open={showCreateProject} onOpenChange={setShowCreateProject}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>مشروع جديد</SheetTitle>
            <SheetDescription>أدخل بيانات المشروع</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم المشروع *</label>
              <Input
                value={newProject.name}
                onChange={(e) =>
                  setNewProject((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="مثال: مجمع النرجس السكني"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">المطور</label>
              <Input
                value={newProject.developer}
                onChange={(e) =>
                  setNewProject((p) => ({ ...p, developer: e.target.value }))
                }
                placeholder="اسم المطور العقاري"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">المدينة *</label>
                <Input
                  value={newProject.city}
                  onChange={(e) =>
                    setNewProject((p) => ({ ...p, city: e.target.value }))
                  }
                  placeholder="الرياض"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الحي</label>
                <Input
                  value={newProject.district}
                  onChange={(e) =>
                    setNewProject((p) => ({ ...p, district: e.target.value }))
                  }
                  placeholder="النرجس"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <Select
                value={newProject.status}
                onValueChange={(v) =>
                  setNewProject((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">تخطيط</SelectItem>
                  <SelectItem value="UNDER_CONSTRUCTION">قيد الإنشاء</SelectItem>
                  <SelectItem value="COMPLETED">مكتمل</SelectItem>
                  <SelectItem value="ON_HOLD">متوقف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">تاريخ الإنجاز المتوقع</label>
              <Input
                type="date"
                value={newProject.completionDate}
                onChange={(e) =>
                  setNewProject((p) => ({
                    ...p,
                    completionDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الوصف</label>
              <Input
                value={newProject.description}
                onChange={(e) =>
                  setNewProject((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="وصف مختصر للمشروع"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmitProject}
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? "جار الإنشاء..." : "إنشاء المشروع"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Create Unit Sheet ─────────────────────────────────────────── */}
      <Sheet open={showCreateUnit} onOpenChange={setShowCreateUnit}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>إضافة وحدة جديدة</SheetTitle>
            <SheetDescription>أدخل بيانات الوحدة</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">رقم الوحدة *</label>
              <Input
                value={newUnit.unitNumber}
                onChange={(e) =>
                  setNewUnit((u) => ({ ...u, unitNumber: e.target.value }))
                }
                placeholder="مثال: A-101"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">الطابق</label>
                <Input
                  type="number"
                  value={newUnit.floor}
                  onChange={(e) =>
                    setNewUnit((u) => ({ ...u, floor: e.target.value }))
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">النوع</label>
                <Select
                  value={newUnit.type}
                  onValueChange={(v) =>
                    setNewUnit((u) => ({ ...u, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">شقة</SelectItem>
                    <SelectItem value="villa">فيلا</SelectItem>
                    <SelectItem value="townhouse">تاون هاوس</SelectItem>
                    <SelectItem value="duplex">دوبلكس</SelectItem>
                    <SelectItem value="studio">استوديو</SelectItem>
                    <SelectItem value="penthouse">بنتهاوس</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">المساحة (م²)</label>
                <Input
                  type="number"
                  value={newUnit.areaSqm}
                  onChange={(e) =>
                    setNewUnit((u) => ({ ...u, areaSqm: e.target.value }))
                  }
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">غرف نوم</label>
                <Input
                  type="number"
                  value={newUnit.bedrooms}
                  onChange={(e) =>
                    setNewUnit((u) => ({ ...u, bedrooms: e.target.value }))
                  }
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">دورات مياه</label>
                <Input
                  type="number"
                  value={newUnit.bathrooms}
                  onChange={(e) =>
                    setNewUnit((u) => ({ ...u, bathrooms: e.target.value }))
                  }
                  placeholder="2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">السعر (ر.س)</label>
              <Input
                type="number"
                value={newUnit.price}
                onChange={(e) =>
                  setNewUnit((u) => ({ ...u, price: e.target.value }))
                }
                placeholder="500000"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmitUnit}
              disabled={createUnitMutation.isPending}
            >
              {createUnitMutation.isPending ? "جار الإضافة..." : "إضافة الوحدة"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
