
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Clock, Plus, Search, Phone, Mail, Users, CalendarDays, FileText, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { formatAdminDate } from "@/lib/formatters";
import { apiPost } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import type { Activity, Lead } from "@shared/types";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";

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
    notes: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;

export default function Activities() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { t, dir, language } = useLanguage();
    const showSkeleton = useMinLoadTime();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: activities, isLoading, isError, refetch } = useQuery<Activity[]>({
        queryKey: ["/api/activities"],
    });

    const { data: leads } = useQuery<Lead[]>({
        queryKey: ["/api/leads"],
    });

    const form = useForm<ActivityFormData>({
        resolver: zodResolver(activitySchema),
        defaultValues: { leadId: "", type: "CALL", title: "", notes: "" },
    });

    const createMutation = useMutation({
        mutationFn: async (data: ActivityFormData) => apiPost("/api/activities", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
            setIsCreateOpen(false);
            form.reset();
            toast({ title: "تم الإنشاء", description: "تم إضافة النشاط بنجاح" });
        },
        onError: () => {
            toast({ title: "خطأ", description: "فشل إنشاء النشاط", variant: "destructive" });
        },
    });

    const filteredActivities = activities?.filter(a =>
        (a.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.type || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTypeInfo = (type: string) => ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[4];

    if (isError) {
        return (
            <div className={PAGE_WRAPPER} dir={dir}>
                <PageHeader title={t("nav.activities") || "الأنشطة"} />
                <QueryErrorFallback message="فشل تحميل الأنشطة" onRetry={() => refetch()} />
            </div>
        );
    }

    if (isLoading || showSkeleton) {
        return (
            <div className={PAGE_WRAPPER} dir={dir}>
                <PageHeader title={t("nav.activities") || "الأنشطة"} />
                <TableSkeleton rows={5} cols={5} />
            </div>
        );
    }

    return (
        <div className={PAGE_WRAPPER} dir={dir}>
            <PageHeader title={`الأنشطة (${filteredActivities?.length || 0})`}>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute end-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pe-9"
                        />
                    </div>
                    <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="me-2" size={16} />
                        إضافة نشاط
                    </Button>
                </div>
            </PageHeader>

            <Card>
                <CardContent className="pt-6">
                    {!filteredActivities || filteredActivities.length === 0 ? (
                        <EmptyState
                            title={searchQuery ? "لا توجد نتائج" : "لا توجد أنشطة"}
                            description={!searchQuery ? "أضف نشاطك الأول لتتبع تواصلك مع العملاء" : undefined}
                            action={!searchQuery ? (
                                <Button onClick={() => setIsCreateOpen(true)}>
                                    <Plus className="me-2" size={16} />
                                    إضافة نشاط
                                </Button>
                            ) : undefined}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-start w-[80px]">{"الإجراءات"}</TableHead>
                                    <TableHead className="text-start">{"الحالة"}</TableHead>
                                    <TableHead className="text-start">{"التاريخ"}</TableHead>
                                    <TableHead className="text-start">{"النوع"}</TableHead>
                                    <TableHead className="text-start">{"العنوان"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredActivities.map((activity) => {
                                    const typeInfo = getTypeInfo(activity.type);
                                    const TypeIcon = typeInfo.icon;
                                    return (
                                    <TableRow key={activity.id}>
                                        <TableCell>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>إكمال</TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={activity.completed ? "success" : "secondary"}>
                                                {activity.completed ? "مكتمل" : "قيد الانتظار"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span>
                                                    {activity.scheduledDate
                                                        ? formatAdminDate(activity.scheduledDate)
                                                        : activity.createdAt
                                                            ? formatAdminDate(activity.createdAt)
                                                            : "—"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1">
                                                <TypeIcon className="w-3 h-3" />
                                                {typeInfo.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {activity.title || (activity as any).action || "—"}
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

            {/* Create Activity Bottom Drawer */}
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <SheetContent side="bottom">
                    <SheetHeader>
                        <SheetTitle>نشاط جديد</SheetTitle>
                        <SheetDescription>سجّل مكالمة، اجتماع، معاينة، أو ملاحظة</SheetDescription>
                    </SheetHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 py-4 max-w-lg mx-auto">
                            {/* Activity Type */}
                            <FormField
                                control={form.control}
                                name="type"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>نوع النشاط</FormLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {ACTIVITY_TYPES.map((at) => {
                                                const Icon = at.icon;
                                                const isSelected = form.watch("type") === at.value;
                                                return (
                                                    <Button
                                                        key={at.value}
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        size="sm"
                                                        className="gap-1.5"
                                                        onClick={() => form.setValue("type", at.value)}
                                                    >
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {at.label}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Lead/Customer selector */}
                            <FormField
                                control={form.control}
                                name="leadId"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>العميل</FormLabel>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                                                    {form.watch("leadId")
                                                        ? leads?.find(l => l.id === form.watch("leadId"))
                                                            ? `${leads.find(l => l.id === form.watch("leadId"))?.firstName} ${leads.find(l => l.id === form.watch("leadId"))?.lastName}`
                                                            : "عميل محدد"
                                                        : "اختر العميل..."}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                                                {leads?.map((lead) => (
                                                    <DropdownMenuItem key={lead.id} onClick={() => form.setValue("leadId", lead.id, { shouldValidate: true })}>
                                                        <div>
                                                            <div className="font-bold">{lead.firstName} {lead.lastName}</div>
                                                            <div className="text-xs text-muted-foreground">{lead.phone || lead.email || "—"}</div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                )) || <DropdownMenuItem disabled>لا يوجد عملاء</DropdownMenuItem>}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Title */}
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>العنوان</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="مثال: متابعة عرض الشقة" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ملاحظات</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} placeholder="تفاصيل إضافية..." rows={3} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <SheetFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "جاري الحفظ..." : "حفظ النشاط"}
                                </Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
