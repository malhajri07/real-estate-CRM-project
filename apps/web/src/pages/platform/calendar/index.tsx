
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER, CARD_HOVER, GRID_THREE_COL } from "@/config/platform-theme";
import { DELETE_BUTTON_STYLES } from "@/config/design-tokens";
import { getCalendarStatusVariant } from "@/lib/status-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, XCircle, Plus, ChevronsUpDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import EmptyState from "@/components/ui/empty-state";
import { CalendarSkeleton } from "@/components/skeletons/page-skeletons";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPut } from "@/lib/apiClient";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Lead } from "@shared/types";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const appointmentSchema = z.object({
  customerId: z.string().min(1, "يرجى اختيار العميل"),
  scheduledAt: z.string().min(1, "يرجى تحديد التاريخ والوقت"),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

type Appointment = {
    id: number;
    scheduledAt: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
    notes?: string;
    customer?: { firstName: string; lastName: string; email: string; phone: string };
    agent?: { firstName: string; lastName: string };
    property?: { title: string; address: string };
};

const STATUS_LABELS: Record<string, string> = {
    SCHEDULED: "مجدول",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
    RESCHEDULED: "معاد جدولته",
};

function AppointmentForm({
    leads,
    isPending,
    onSubmit,
}: {
    leads: Lead[];
    isPending: boolean;
    onSubmit: (data: { customerId: string; scheduledAt: string; notes?: string }) => void;
}) {
    const [customerOpen, setCustomerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [timeValue, setTimeValue] = useState("");

    const form = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            customerId: "",
            scheduledAt: "",
            notes: "",
        },
    });

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            const [hours, minutes] = timeValue ? timeValue.split(":") : ["09", "00"];
            const combined = new Date(date);
            combined.setHours(parseInt(hours || "9"), parseInt(minutes || "0"));
            form.setValue("scheduledAt", combined.toISOString(), { shouldValidate: true });
        }
    };

    const handleTimeChange = (time: string) => {
        setTimeValue(time);
        if (selectedDate) {
            const [hours, minutes] = time.split(":");
            const combined = new Date(selectedDate);
            combined.setHours(parseInt(hours || "9"), parseInt(minutes || "0"));
            form.setValue("scheduledAt", combined.toISOString(), { shouldValidate: true });
        }
    };

    const selectedLead = leads.find((l) => l.id === form.watch("customerId") || l.customerId === form.watch("customerId"));

    const handleSubmit = (data: AppointmentFormData) => {
        // Send the actual customer ID (not the lead ID)
        const lead = leads.find((l) => l.id === data.customerId);
        const actualCustomerId = lead?.customerId || data.customerId;
        onSubmit({
            customerId: actualCustomerId,
            scheduledAt: data.scheduledAt,
            notes: data.notes || undefined,
        });
        form.reset();
        setSelectedDate(undefined);
        setTimeValue("");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4 max-w-lg mx-auto">
                {/* Customer selection via searchable Command combobox */}
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>العميل</FormLabel>
                            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={customerOpen}
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            data-testid="select-customer"
                                        >
                                            {selectedLead
                                                ? `${selectedLead.firstName} ${selectedLead.lastName}`
                                                : "اختر العميل..."}
                                            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="ابحث عن عميل..." />
                                        <CommandList>
                                            <CommandEmpty>لا يوجد عملاء</CommandEmpty>
                                            <CommandGroup>
                                                {leads.map((lead) => (
                                                    <CommandItem
                                                        key={lead.id}
                                                        value={`${lead.firstName} ${lead.lastName} ${lead.phone || ""}`}
                                                        onSelect={() => {
                                                            field.onChange(lead.id);
                                                            setCustomerOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "me-2 h-4 w-4",
                                                                field.value === lead.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {lead.firstName} {lead.lastName} {lead.phone ? `(${lead.phone})` : ""}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Date selection via Calendar + Popover */}
                <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={() => (
                        <FormItem className="flex flex-col">
                            <FormLabel>التاريخ والوقت</FormLabel>
                            <div className="flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "flex-1 justify-start text-start font-normal",
                                                    !selectedDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="me-2 h-4 w-4" />
                                                {selectedDate ? format(selectedDate, "PPP", { locale: ar }) : "اختر تاريخ"}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={handleDateSelect}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    type="time"
                                    value={timeValue}
                                    onChange={(e) => handleTimeChange(e.target.value)}
                                    className="w-28"
                                />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ملاحظات</FormLabel>
                            <FormControl>
                                <Textarea {...field} placeholder="تفاصيل الاجتماع..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <SheetFooter>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "جاري الإنشاء..." : "جدولة الموعد"}
                    </Button>
                </SheetFooter>
            </form>
        </Form>
    );
}

export default function AppointmentsManager() {
    const { t, dir, language } = useLanguage();
    const { toast } = useToast();
    const showSkeleton = useMinLoadTime();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: appointments, isLoading, isError, refetch } = useQuery<Appointment[]>({
        queryKey: ["/api/appointments"],
    });

    const { data: leads } = useQuery<Lead[]>({
        queryKey: ["/api/leads"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => apiPost("/api/appointments", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            setIsCreateOpen(false);
            toast({ title: t("common.success"), description: "تم إنشاء الموعد بنجاح" });
        },
        onError: () => {
            toast({ title: t("common.error"), description: "فشل إنشاء الموعد", variant: "destructive" });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) =>
            apiPut(`/api/appointments/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            toast({ title: t("common.success"), description: "تم تحديث الحالة" });
        }
    });

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "PPP p", { locale: language === 'ar' ? ar : enUS });
    };

    if (isError) {
        return (
            <div className={PAGE_WRAPPER} dir={dir}>
                <PageHeader title={t("nav.calendar") || "المواعيد"} />
                <QueryErrorFallback message="فشل تحميل المواعيد" onRetry={() => refetch()} />
            </div>
        );
    }

    return (
        <div className={PAGE_WRAPPER} dir={dir}>
            <PageHeader title={t("nav.calendar") || "المواعيد"}>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t("common.create") || "موعد جديد"}
                </Button>
            </PageHeader>

            {/* ── Bottom Drawer: New Appointment ── */}
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <SheetContent side="bottom">
                    <SheetHeader>
                        <SheetTitle>موعد جديد</SheetTitle>
                        <SheetDescription>أدخل تفاصيل الموعد الجديد</SheetDescription>
                    </SheetHeader>
                    <AppointmentForm
                        leads={leads ?? []}
                        isPending={createMutation.isPending}
                        onSubmit={(data) => createMutation.mutate(data)}
                    />
                </SheetContent>
            </Sheet>

            <div className={GRID_THREE_COL}>
                <Card className={CARD_HOVER}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">إجمالي المواعيد</CardTitle>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{appointments?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className={CARD_HOVER}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">القادمة</CardTitle>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                            <Clock className="h-6 w-6" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {appointments?.filter(a => new Date(a.scheduledAt) > new Date() && a.status === 'SCHEDULED').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card className={CARD_HOVER}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">المكتملة</CardTitle>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {appointments?.filter(a => a.status === 'COMPLETED').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>قائمة المواعيد</CardTitle>
                </CardHeader>
                <CardContent>
                    {(isLoading || showSkeleton) ? (
                        <CalendarSkeleton />
                    ) : appointments && appointments.length > 0 ? (
                        <div className="space-y-4">
                            {appointments.map((appointment) => (
                                <Card key={appointment.id} className={CARD_HOVER}>
                                    <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-4">
                                        <div className="flex items-start space-x-4 rtl:space-x-reverse mb-4 md:mb-0">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                                <CalendarIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">
                                                    {appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : "عميل غير معروف"}
                                                </h3>
                                                <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-3 rtl:space-x-reverse">
                                                    <span className="flex items-center">
                                                        <Clock className="w-3 h-3 ms-1" />
                                                        {formatDate(appointment.scheduledAt)}
                                                    </span>
                                                    {appointment.property && (
                                                        <span className="flex items-center">
                                                            <MapPin className="w-3 h-3 ms-1" />
                                                            {appointment.property.title}
                                                        </span>
                                                    )}
                                                </div>
                                                {appointment.notes && (
                                                    <p className="text-sm text-muted-foreground mt-2 max-w-xl">{appointment.notes}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                            <Badge variant={getCalendarStatusVariant(appointment.status)}>
                                                {STATUS_LABELS[appointment.status] || appointment.status}
                                            </Badge>

                                            {appointment.status === 'SCHEDULED' && (
                                                <div className="flex space-x-1 rtl:space-x-reverse">
                                                    <Button size="sm" variant="outline" className="text-muted-foreground hover:text-foreground/80 hover:bg-muted/50"
                                                        onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'COMPLETED' })}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className={DELETE_BUTTON_STYLES}
                                                        onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'CANCELLED' })}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={CalendarIcon}
                            title="لا توجد مواعيد"
                            description="قم بجدولة أول موعد للبدء."
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
