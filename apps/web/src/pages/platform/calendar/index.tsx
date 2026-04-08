/**
 * calendar/index.tsx — Weekly calendar with draggable 15-min appointments (Google Calendar style)
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, isToday, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { CalendarSkeleton } from "@/components/skeletons/page-skeletons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { apiPost, apiPut } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { cn } from "@/lib/utils";
import type { Lead } from "@shared/types";
import {
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, MapPin, User, CheckCircle, XCircle, Phone, ChevronDown, GripVertical,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Appointment {
  id: number;
  status: string;
  scheduledAt: string;
  notes?: string;
  customer?: { firstName: string; lastName: string; phone?: string };
  agent?: { firstName: string; lastName: string };
  property?: { title: string; address: string };
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  SCHEDULED: { bg: "bg-primary/10", border: "border-s-primary", text: "text-primary", label: "مجدول" },
  COMPLETED: { bg: "bg-primary/10", border: "border-s-primary", text: "text-primary", label: "مكتمل" },
  CANCELLED: { bg: "bg-destructive/10", border: "border-s-destructive", text: "text-destructive", label: "ملغي" },
  RESCHEDULED: { bg: "bg-[hsl(var(--warning)/0.1)]", border: "border-s-[hsl(var(--warning))]", text: "text-[hsl(var(--warning))]", label: "معاد جدولته" },
};

// 15-minute time slots from 08:00 to 18:00
interface TimeSlot { hour: number; minute: number }
const TIME_SLOTS: TimeSlot[] = [];
for (let h = 8; h <= 18; h++) {
  for (let m = 0; m < 60; m += 15) {
    if (h === 18 && m > 0) break;
    TIME_SLOTS.push({ hour: h, minute: m });
  }
}

const SLOT_HEIGHT = 28; // px per 15-min slot

function slotKey(dayKey: string, hour: number, minute: number) {
  return `${dayKey}-${hour}-${minute}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatSlotTime(hour: number, minute: number) {
  return `${pad2(hour)}:${pad2(minute)}`;
}

// ── Form Schema ────────────────────────────────────────────────────────────

const appointmentSchema = z.object({
  customerId: z.string().min(1, "يرجى اختيار العميل"),
  scheduledAt: z.string().min(1, "يرجى تحديد التاريخ والوقت"),
  notes: z.string().optional(),
});

// ── Main Component ─────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { dir, language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const showSkeleton = useMinLoadTime();
  const queryClient = useQueryClient();
  const locale = language === "ar" ? ar : enUS;
  const isAr = language === "ar";

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeValue, setTimeValue] = useState("");

  // Drag state
  const [draggedAppt, setDraggedAppt] = useState<Appointment | null>(null);
  const [dragOverSlotKey, setDragOverSlotKey] = useState<string | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  const { data: appointments, isLoading, isError, refetch } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  const { data: leads } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { customerId: "", scheduledAt: "", notes: "" },
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiPost("/api/appointments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsCreateOpen(false);
      form.reset();
      setSelectedDate(undefined);
      setTimeValue("");
      toast({ title: "تم بنجاح", description: "تم إنشاء الموعد" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل إنشاء الموعد", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => apiPut(`/api/appointments/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setSelectedAppointment(null);
      toast({ title: "تم التحديث" });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: number; scheduledAt: string }) =>
      apiPut(`/api/appointments/${id}`, { scheduledAt, status: "RESCHEDULED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "تم نقل الموعد", description: "تم تحديث وقت الموعد بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل نقل الموعد", variant: "destructive" }),
  });

  // ── Week days ────────────────────────────────────────────────────────────

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const DAY_NAMES = isAr
    ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    : ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  // Group appointments by 15-min slot
  const appointmentsBySlot = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    (appointments || []).forEach((appt) => {
      const date = parseISO(appt.scheduledAt);
      const dayKey = format(date, "yyyy-MM-dd");
      const hour = date.getHours();
      const minute = Math.floor(date.getMinutes() / 15) * 15;
      const key = slotKey(dayKey, hour, minute);
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    });
    return map;
  }, [appointments]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const goToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const goPrev = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goNext = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  // ── Form helpers ─────────────────────────────────────────────────────────

  const syncFormDateTime = useCallback((date: Date | undefined, time: string) => {
    if (date && time) {
      const [h, m] = time.split(":").map(Number);
      const combined = new Date(date);
      combined.setHours(h, m, 0, 0);
      form.setValue("scheduledAt", combined.toISOString(), { shouldValidate: true });
    }
  }, [form]);

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d);
    syncFormDateTime(d, timeValue);
  };

  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    syncFormDateTime(selectedDate, time);
  };

  const handleCellClick = (day: Date, hour: number, minute: number) => {
    setSelectedDate(day);
    const t = formatSlotTime(hour, minute);
    setTimeValue(t);
    const combined = new Date(day);
    combined.setHours(hour, minute, 0, 0);
    form.setValue("scheduledAt", combined.toISOString(), { shouldValidate: true });
    setIsCreateOpen(true);
  };

  // ── Drag handlers ────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, appt: Appointment) => {
    if (appt.status === "CANCELLED" || appt.status === "COMPLETED") return;
    setDraggedAppt(appt);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(appt.id));
    // Custom drag image
    const ghost = e.currentTarget.cloneNode(true) as HTMLDivElement;
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    ghost.style.opacity = "0.85";
    ghost.style.width = `${e.currentTarget.clientWidth}px`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 10);
    dragGhostRef.current = ghost;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedAppt(null);
    setDragOverSlotKey(null);
    if (dragGhostRef.current) {
      document.body.removeChild(dragGhostRef.current);
      dragGhostRef.current = null;
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlotKey(key);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSlotKey(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, day: Date, hour: number, minute: number) => {
    e.preventDefault();
    setDragOverSlotKey(null);
    if (!draggedAppt) return;

    const newDate = new Date(day);
    newDate.setHours(hour, minute, 0, 0);

    // Don't reschedule if same time
    const oldDate = parseISO(draggedAppt.scheduledAt);
    if (
      isSameDay(oldDate, newDate) &&
      oldDate.getHours() === hour &&
      Math.floor(oldDate.getMinutes() / 15) * 15 === minute
    ) {
      setDraggedAppt(null);
      return;
    }

    rescheduleMutation.mutate({ id: draggedAppt.id, scheduledAt: newDate.toISOString() });
    setDraggedAppt(null);
  }, [draggedAppt, rescheduleMutation]);

  // ── Stats ────────────────────────────────────────────────────────────────

  const allAppts = appointments || [];
  const totalThisWeek = allAppts.filter((a) => {
    const d = parseISO(a.scheduledAt);
    return d >= weekDays[0] && d <= addDays(weekDays[6], 1);
  }).length;

  const upcomingCount = allAppts.filter(
    (a) => parseISO(a.scheduledAt) > new Date() && a.status === "SCHEDULED"
  ).length;

  const todayCount = allAppts.filter((a) => isToday(parseISO(a.scheduledAt))).length;
  const completedCount = allAppts.filter((a) => a.status === "COMPLETED").length;
  const cancelledCount = allAppts.filter((a) => a.status === "CANCELLED").length;

  // ── Render ───────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="التقويم" />
        <QueryErrorFallback message="فشل تحميل المواعيد" onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="التقويم" />
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      {/* Header */}
      <PageHeader
        title="التقويم"
        subtitle={`${totalThisWeek} موعد هذا الأسبوع · ${upcomingCount} قادم`}
      >
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          موعد جديد
        </Button>
      </PageHeader>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToday}>اليوم</Button>
          <Button variant="outline" size="sm" onClick={goNext}><ChevronLeft className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-3">
          {/* Drag hint */}
          <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
            <GripVertical className="h-3 w-3" />
            اسحب المواعيد لإعادة الجدولة
          </span>
          <h2 className="text-lg font-bold text-foreground">
            {format(weekDays[0], "d MMM", { locale })} — {format(weekDays[6], "d MMM yyyy", { locale })}
          </h2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "اليوم", value: todayCount, color: "text-primary" },
          { label: "هذا الأسبوع", value: totalThisWeek, color: "text-primary" },
          { label: "قادم", value: upcomingCount, color: "text-primary" },
          { label: "مكتمل", value: completedCount, color: "text-primary" },
          { label: "ملغي", value: cancelledCount, color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-3">
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border sticky top-0 bg-card z-10">
              <div className="p-2 border-e border-border" />
              {weekDays.map((day, i) => {
                const today = isToday(day);
                return (
                  <div key={i} className={cn("p-3 text-center border-s border-border", today && "bg-primary/5")}>
                    <p className={cn("text-xs font-bold uppercase tracking-wider", today ? "text-primary" : "text-muted-foreground")}>
                      {DAY_NAMES[day.getDay()]}
                    </p>
                    <p className={cn("text-2xl font-black mt-0.5", today ? "text-primary" : "text-foreground")}>
                      {format(day, "d")}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time Slot Rows — 15-minute intervals */}
            {TIME_SLOTS.map(({ hour, minute }, slotIdx) => {
              const isHourStart = minute === 0;
              const isHalfHour = minute === 30;

              return (
                <div
                  key={slotIdx}
                  className={cn(
                    "grid grid-cols-[64px_repeat(7,1fr)]",
                    isHourStart && "border-t border-border",
                    isHalfHour && "border-t border-border/50",
                    !isHourStart && !isHalfHour && "border-t border-dashed border-border/25",
                  )}
                  style={{ minHeight: `${SLOT_HEIGHT}px` }}
                >
                  {/* Time Label */}
                  <div className="border-e border-border flex items-start justify-center px-1 pt-0.5">
                    {isHourStart && (
                      <span className="text-[11px] font-bold text-muted-foreground tabular-nums leading-tight">
                        {formatSlotTime(hour, 0)}
                      </span>
                    )}
                  </div>

                  {/* Day Cells */}
                  {weekDays.map((day, dayIdx) => {
                    const dayKey = format(day, "yyyy-MM-dd");
                    const key = slotKey(dayKey, hour, minute);
                    const slotAppointments = appointmentsBySlot[key] || [];
                    const today = isToday(day);
                    const isDragTarget = dragOverSlotKey === key;

                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "border-s border-border relative cursor-pointer transition-colors",
                          today && "bg-primary/[0.02]",
                          isDragTarget && "bg-primary/15 ring-1 ring-inset ring-primary/30",
                          !isDragTarget && "hover:bg-muted/50",
                        )}
                        style={{ minHeight: `${SLOT_HEIGHT}px` }}
                        onClick={() => slotAppointments.length === 0 && handleCellClick(day, hour, minute)}
                        onDragOver={(e) => handleDragOver(e, key)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day, hour, minute)}
                      >
                        {/* Drop indicator */}
                        {isDragTarget && (
                          <div className="absolute inset-x-1 top-0.5 bottom-0.5 rounded border-2 border-dashed border-primary/40 pointer-events-none flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary/60">{formatSlotTime(hour, minute)}</span>
                          </div>
                        )}

                        {/* Appointment blocks */}
                        {slotAppointments.map((appt) => {
                          const status = STATUS_COLORS[appt.status] || STATUS_COLORS.SCHEDULED;
                          const customerName = appt.customer
                            ? `${appt.customer.firstName} ${appt.customer.lastName}`
                            : "عميل";
                          const time = format(parseISO(appt.scheduledAt), "HH:mm");
                          const isDragging = draggedAppt?.id === appt.id;
                          const canDrag = appt.status === "SCHEDULED" || appt.status === "RESCHEDULED";

                          return (
                            <Tooltip key={appt.id}>
                              <TooltipTrigger asChild>
                                <div
                                  draggable={canDrag}
                                  onDragStart={(e) => handleDragStart(e, appt)}
                                  onDragEnd={handleDragEnd}
                                  className={cn(
                                    "absolute inset-x-0.5 top-0.5 rounded-md px-1.5 py-0.5 text-[11px] border-s-[3px] z-[1]",
                                    "select-none overflow-hidden",
                                    status.bg, status.border, status.text,
                                    canDrag && "cursor-grab active:cursor-grabbing hover:shadow-md hover:ring-1 hover:ring-primary/20",
                                    !canDrag && "opacity-60",
                                    isDragging && "opacity-30 ring-2 ring-primary",
                                    appt.status === "CANCELLED" && "line-through",
                                  )}
                                  style={{ minHeight: `${SLOT_HEIGHT - 4}px` }}
                                  onClick={(e) => { e.stopPropagation(); setSelectedAppointment(appt); }}
                                >
                                  <div className="flex items-center gap-1">
                                    {canDrag && <GripVertical className="h-3 w-3 flex-shrink-0 opacity-40" />}
                                    <span className="font-bold truncate">{customerName}</span>
                                  </div>
                                  <span className="opacity-70 tabular-nums">{time}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-bold">{customerName}</p>
                                <p className="text-xs">{format(parseISO(appt.scheduledAt), "PPP p", { locale })}</p>
                                {appt.property && <p className="text-xs opacity-80">{appt.property.title}</p>}
                                {appt.notes && <p className="text-xs opacity-70 mt-1">{appt.notes}</p>}
                                <Badge variant="outline" className="mt-1 text-[10px]">
                                  {status.label}
                                </Badge>
                                {canDrag && (
                                  <p className="text-[10px] opacity-50 mt-1">
                                    "اسحب لإعادة الجدولة
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── Appointment Detail Sheet ──────────────────────────────────────── */}
      <Sheet open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <SheetContent side="bottom">
          {selectedAppointment && (() => {
            const appt = selectedAppointment;
            const status = STATUS_COLORS[appt.status] || STATUS_COLORS.SCHEDULED;
            const customerName = appt.customer ? `${appt.customer.firstName} ${appt.customer.lastName}` : "عميل";
            return (
              <>
                <SheetHeader>
                  <SheetTitle>تفاصيل الموعد</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-4 max-w-lg mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{customerName}</p>
                      {appt.customer?.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {appt.customer.phone}
                        </p>
                      )}
                    </div>
                    <Badge className={cn("ms-auto", status.bg, status.text)}>
                      {status.label}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">التاريخ</p>
                        <p className="font-bold text-sm">{format(parseISO(appt.scheduledAt), "PPP", { locale })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">الوقت</p>
                        <p className="font-bold text-sm">{format(parseISO(appt.scheduledAt), "p", { locale })}</p>
                      </div>
                    </div>
                  </div>

                  {appt.property && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">العقار</p>
                        <p className="font-bold text-sm">{appt.property.title}</p>
                      </div>
                    </div>
                  )}

                  {appt.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                      <p className="text-sm bg-muted/30 rounded-xl p-3">{appt.notes}</p>
                    </div>
                  )}

                  {/* Quick contact actions */}
                  {appt.customer?.phone && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => window.open(`tel:${appt.customer!.phone}`, "_self")}>
                        <Phone className="h-3.5 w-3.5" /> "اتصال
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => window.open(`https://wa.me/${appt.customer!.phone?.replace(/[^0-9]/g, "")}`, "_blank")}>
                        <Clock className="h-3.5 w-3.5" /> واتساب
                      </Button>
                    </div>
                  )}

                  {/* Cross-page navigation */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setSelectedAppointment(null); setLocation("/home/platform/leads"); }}>
                      <User className="h-3.5 w-3.5" /> عرض العميل
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setSelectedAppointment(null); setLocation("/home/platform/activities"); }}>
                      <Clock className="h-3.5 w-3.5" /> تسجيل نشاط
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setSelectedAppointment(null); setLocation("/home/platform/pipeline"); }}>
                      <MapPin className="h-3.5 w-3.5" /> المسار
                    </Button>
                  </div>

                  {(appt.status === "SCHEDULED" || appt.status === "RESCHEDULED") && (
                    <>
                      <Separator />
                      <div className="flex gap-2">
                        <Button className="flex-1 gap-2" onClick={() => updateMutation.mutate({ id: appt.id, status: "COMPLETED" })}>
                          <CheckCircle className="h-4 w-4" /> إكمال
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2 text-destructive" onClick={() => updateMutation.mutate({ id: appt.id, status: "CANCELLED" })}>
                          <XCircle className="h-4 w-4" /> إلغاء
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Create Appointment Sheet ─────────────────────────────────────── */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>موعد جديد</SheetTitle>
            <SheetDescription>
              أدخل تفاصيل الموعد (الحد الأدنى 15 دقيقة)
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 py-4 max-w-lg mx-auto">
              {/* Customer */}
              <FormField control={form.control} name="customerId" render={() => (
                <FormItem>
                  <FormLabel>العميل *</FormLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                        {form.watch("customerId")
                          ? (() => {
                              const lead = leads?.find(l => l.id === form.watch("customerId"));
                              return lead ? `${lead.firstName} ${lead.lastName}` : "عميل محدد";
                            })()
                          : "اختر العميل..."}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                      {leads?.map((lead) => (
                        <DropdownMenuItem key={lead.id} onClick={() => form.setValue("customerId", lead.id, { shouldValidate: true })}>
                          <div>
                            <p className="font-bold">{lead.firstName} {lead.lastName}</p>
                            <p className="text-xs text-muted-foreground">{lead.phone || "—"}</p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Date + Time (15-min step) */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="scheduledAt" render={() => (
                  <FormItem>
                    <FormLabel>التاريخ *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start h-10 font-normal", !selectedDate && "text-muted-foreground")}>
                          <CalendarIcon className="h-4 w-4 me-2" />
                          {selectedDate ? format(selectedDate, "PPP", { locale }) : "اختر"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker mode="single" selected={selectedDate} onSelect={handleDateSelect} disabled={(d) => d < new Date()} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )} />
                <FormItem>
                  <FormLabel>الوقت *</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      value={timeValue}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      step={900}
                      min="08:00"
                      max="18:00"
                      className="h-10 tabular-nums"
                    />
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground">بفواصل 15 دقيقة</p>
                </FormItem>
              </div>
              <FormField control={form.control} name="scheduledAt" render={() => (<FormMessage />)} />

              {/* Notes */}
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl><Textarea {...field} placeholder="تفاصيل الموعد..." rows={2} /></FormControl>
                </FormItem>
              )} />

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "..." : "إنشاء الموعد"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
