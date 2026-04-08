import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Clock, Plus, Search, Phone, Mail, Users, CalendarDays, FileText, Trash2, Filter, ChevronDown, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import EmptyState from "@/components/ui/empty-state";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { ActivitiesSkeleton } from "@/components/skeletons/page-skeletons";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { formatAdminDate } from "@/lib/formatters";
import { apiPost, apiPatch, apiDelete } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import type { Activity, Lead } from "@shared/types";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { cn } from "@/lib/utils";

const ACTIVITY_TYPES = [
  { value: "CALL", label: "مكالمة", icon: Phone },
  { value: "EMAIL", label: "بريد إلكتروني", icon: Mail },
  { value: "MEETING", label: "اجتماع", icon: Users },
  { value: "VIEWING", label: "معاينة", icon: CalendarDays },
  { value: "NOTE", label: "ملاحظة", icon: FileText },
];

const activitySchema = z.object({
  leadId: z.string().min(1, "يرجى اختيار العميل"),
  type: z.string().min(1, "يرجى اختيار نوع النشاط"),
  title: z.string().min(1, "يرجى إدخال العنوان"),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
});

export default function Activities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const showSkeleton = useMinLoadTime();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities, isLoading, isError, refetch } = useQuery<Activity[]>({ queryKey: ["/api/activities"] });
  const { data: leads } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });

  const form = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: { leadId: "", type: "CALL", title: "", scheduledDate: "", notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof activitySchema>) => apiPost("/api/activities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "تم إنشاء النشاط بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل إنشاء النشاط", variant: "destructive" }),
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/api/activities/${id}/toggle-complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "تم تحديث الحالة" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setDetailActivity(null);
      toast({ title: "تم حذف النشاط" });
    },
  });

  // Filters
  const filtered = (activities || []).filter(a => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!(a.title || "").toLowerCase().includes(q) && !(a.type || "").toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (statusFilter === "completed" && !a.completed) return false;
    if (statusFilter === "pending" && a.completed) return false;
    return true;
  });

  // Stats
  const total = activities?.length || 0;
  const completed = activities?.filter(a => a.completed).length || 0;
  const pending = total - completed;
  const todayCount = activities?.filter(a => {
    const d = a.scheduledDate || a.createdAt;
    if (!d) return false;
    return new Date(d).toDateString() === new Date().toDateString();
  }).length || 0;

  const getTypeInfo = (type: string) => ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[4];
  const getLeadName = (leadId?: string | null) => {
    if (!leadId) return "—";
    const lead = leads?.find(l => l.id === leadId);
    return lead ? `${lead.firstName} ${lead.lastName}` : "—";
  };

  const activeFilters = [typeFilter !== "all", statusFilter !== "all"].filter(Boolean).length;

  if (isError) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="الأنشطة" />
        <QueryErrorFallback message="فشل تحميل الأنشطة" onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="الأنشطة" />
        <ActivitiesSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="الأنشطة" subtitle="تتبع المكالمات والاجتماعات والمعاينات">
        <Button size="sm" onClick={() => { form.reset(); setIsCreateOpen(true); }}>
          <Plus className="me-1.5" size={16} />
          نشاط جديد
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "الإجمالي", value: total, icon: FileText },
          { label: "مكتمل", value: completed, icon: Check },
          { label: "قيد الانتظار", value: pending, icon: Clock },
          { label: "اليوم", value: todayCount, icon: CalendarDays },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-9" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Filter className="h-3.5 w-3.5" />
              {typeFilter === "all" ? "النوع" : getTypeInfo(typeFilter).label}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTypeFilter("all")}>الكل</DropdownMenuItem>
            {ACTIVITY_TYPES.map(t => <DropdownMenuItem key={t.value} onClick={() => setTypeFilter(t.value)}>{t.label}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              {statusFilter === "all" ? "الحالة" : statusFilter === "completed" ? "مكتمل" : "قيد الانتظار"}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>الكل</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("completed")}>مكتمل</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("pending")}>قيد الانتظار</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => { setTypeFilter("all"); setStatusFilter("all"); }}>
            <X className="h-3 w-3" />مسح
          </Button>
        )}

        <span className="ms-auto text-xs text-muted-foreground">{filtered.length} نشاط</span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <EmptyState
              title={searchQuery ? "لا توجد نتائج" : "لا توجد أنشطة"}
              description={!searchQuery ? "أضف نشاطك الأول" : undefined}
              action={!searchQuery ? <Button onClick={() => setIsCreateOpen(true)}><Plus className="me-2" size={16} />إضافة نشاط</Button> : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[60px]"></TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((activity) => {
                    const typeInfo = getTypeInfo(activity.type);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <TableRow key={activity.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailActivity(activity)}>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); toggleCompleteMutation.mutate(activity.id); }}
                              >
                                <Check className={cn("w-4 h-4", activity.completed && "text-primary")} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{activity.completed ? "إلغاء" : "إكمال"}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1"><TypeIcon className="w-3 h-3" />{typeInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="font-bold">{activity.title || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{getLeadName((activity as any).leadId)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatAdminDate(activity.scheduledDate || activity.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={activity.completed ? "default" : "secondary"}>
                            {activity.completed ? "مكتمل" : "انتظار"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(activity.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Detail Sheet */}
      <Sheet open={!!detailActivity} onOpenChange={() => setDetailActivity(null)}>
        <SheetContent side="bottom">
          {detailActivity && (() => {
            const typeInfo = getTypeInfo(detailActivity.type);
            const TypeIcon = typeInfo.icon;
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <TypeIcon className="h-5 w-5" />
                    {detailActivity.title}
                  </SheetTitle>
                  <SheetDescription>{typeInfo.label} — {formatAdminDate(detailActivity.scheduledDate || detailActivity.createdAt)}</SheetDescription>
                </SheetHeader>
                <div className="py-4 max-w-lg mx-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">العميل</p>
                      <p className="font-bold text-sm">{getLeadName((detailActivity as any).leadId)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">الحالة</p>
                      <Badge variant={detailActivity.completed ? "default" : "secondary"}>
                        {detailActivity.completed ? "مكتمل" : "قيد الانتظار"}
                      </Badge>
                    </div>
                  </div>

                  {detailActivity.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                      <p className="text-sm bg-muted/30 rounded-xl p-3">{detailActivity.description}</p>
                    </div>
                  )}

                  {(detailActivity as any).notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                      <p className="text-sm bg-muted/30 rounded-xl p-3">{(detailActivity as any).notes}</p>
                    </div>
                  )}

                  {/* Cross-page navigation */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setDetailActivity(null); setLocation("/home/platform/leads"); }}>
                      <Users className="h-3.5 w-3.5" /> "العملاء
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setDetailActivity(null); setLocation("/home/platform/calendar"); }}>
                      <CalendarDays className="h-3.5 w-3.5" /> التقويم
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setDetailActivity(null); setLocation("/home/platform/pipeline"); }}>
                      <FileText className="h-3.5 w-3.5" /> المسار
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => { toggleCompleteMutation.mutate(detailActivity.id); setDetailActivity(null); }}
                    >
                      <Check className="h-4 w-4" />
                      {detailActivity.completed ? "إلغاء الإكمال" : "إكمال"}
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive"
                      onClick={() => deleteMutation.mutate(detailActivity.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Create Activity Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>نشاط جديد</SheetTitle>
            <SheetDescription>سجّل مكالمة، اجتماع، معاينة، أو ملاحظة</SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 py-4 max-w-lg mx-auto">
              {/* Activity Type */}
              <FormField control={form.control} name="type" render={() => (
                <FormItem>
                  <FormLabel>نوع النشاط</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_TYPES.map((at) => {
                      const Icon = at.icon;
                      return (
                        <Button key={at.value} type="button" variant={form.watch("type") === at.value ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => form.setValue("type", at.value)}>
                          <Icon className="w-3.5 h-3.5" />{at.label}
                        </Button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Lead selector */}
              <FormField control={form.control} name="leadId" render={() => (
                <FormItem>
                  <FormLabel>العميل *</FormLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                        {form.watch("leadId") ? (() => { const l = leads?.find(l => l.id === form.watch("leadId")); return l ? `${l.firstName} ${l.lastName}` : "عميل محدد"; })() : "اختر العميل..."}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                      {leads?.map((lead) => (
                        <DropdownMenuItem key={lead.id} onClick={() => form.setValue("leadId", lead.id, { shouldValidate: true })}>
                          <div><p className="font-bold">{lead.firstName} {lead.lastName}</p><p className="text-xs text-muted-foreground">{lead.phone || "—"}</p></div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Title + Scheduled Date */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان *</FormLabel>
                    <FormControl><Input {...field} placeholder="متابعة عرض الشقة" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="scheduledDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>التاريخ المحدد</FormLabel>
                    <FormControl><Input {...field} type="datetime-local" /></FormControl>
                  </FormItem>
                )} />
              </div>

              {/* Notes */}
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl><Textarea {...field} placeholder="تفاصيل إضافية..." rows={2} /></FormControl>
                </FormItem>
              )} />

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "..." : "حفظ النشاط"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
