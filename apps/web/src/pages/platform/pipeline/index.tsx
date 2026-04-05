/**
 * pipeline.tsx - Sales Pipeline Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → pipeline.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Sales pipeline management page with drag-and-drop functionality. Provides:
 * - Deal management by stage
 * - Drag-and-drop deal movement
 * - Pipeline visualization
 * - Deal CRUD operations
 * 
 * Route: /home/platform/pipeline or /pipeline
 * 
 * Related Files:
 * - apps/web/src/components/ui/ - UI components for pipeline
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, Mail, Calendar, Clock, Building2, User, FileText,
  TrendingUp, ArrowRightCircle, DollarSign, CheckCircle2,
  XCircle, MessageCircle, Briefcase, Activity, Calendar as CalendarLucide,
} from "lucide-react";
import { useLocation } from "wouter";
import { PipelineSkeleton } from "@/components/skeletons/page-skeletons";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { apiGet, apiPut, apiPost } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SarSymbol, SarPrice } from "@/components/ui/sar-symbol";
import type { Deal, Lead } from "@shared/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { STATUS_COLORS } from "@/config/design-tokens";
import type { BadgeVariant } from "@/lib/status-variants";
import { formatAdminDate } from "@/lib/formatters";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";

const STAGES: { id: string; title: string; badgeVariant: BadgeVariant; accent: string }[] = [
  { id: "NEW", title: "جديدة", badgeVariant: "secondary", accent: STATUS_COLORS.inactive.text },
  { id: "NEGOTIATION", title: "تفاوض", badgeVariant: "info", accent: STATUS_COLORS.info.text },
  { id: "UNDER_OFFER", title: "عرض قائم", badgeVariant: "warning", accent: STATUS_COLORS.warning.text },
  { id: "WON", title: "مكتملة", badgeVariant: "success", accent: STATUS_COLORS.success.text },
  { id: "LOST", title: "خاسرة", badgeVariant: "orange", accent: STATUS_COLORS.pending.text },
];

const STAGE_LABELS: Record<string, string> = {
  NEW: "جديدة",
  NEGOTIATION: "تفاوض",
  UNDER_OFFER: "عرض قائم",
  WON: "مكتملة",
  LOST: "خاسرة",
};

export default function Pipeline() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);
  const { dir, language } = useLanguage();
  const showSkeleton = useMinLoadTime();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  // Deal detail drawer state
  const [dealDetailOpen, setDealDetailOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealDetailTab, setDealDetailTab] = useState("info");

  const [createDealOpen, setCreateDealOpen] = useState(false);

  const dealSchema = z.object({
    customerName: z.string().min(1, "اسم العميل مطلوب"),
    phone: z.string().optional(),
    agreedPrice: z.string().optional(),
    expectedCloseDate: z.string().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
  });

  const createDealForm = useForm<z.infer<typeof dealSchema>>({
    resolver: zodResolver(dealSchema),
    defaultValues: { customerName: "", phone: "", agreedPrice: "", expectedCloseDate: "", source: "", notes: "" },
  });

  const { data: deals, isLoading, isError, refetch } = useQuery<Deal[]>({ queryKey: ["/api/deals"] });
  const { data: leads } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });

  type PropertyRequestSummary = {
    seekerId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    mobileNumber?: string | null;
    typeOfProperty?: string | null;
    region?: string | null;
    city?: string | null;
    budgetSize?: number | string | null;
  };

  const propertyRequestsQuery = useQuery<PropertyRequestSummary[]>({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      const body = await apiGet<PropertyRequestSummary[] | unknown>("api/requests");
      return Array.isArray(body) ? body : [];
    },
    enabled: showRequestDrawer,
  });
  const propertyRequests = propertyRequestsQuery.data ?? [];
  const requestsLoading = propertyRequestsQuery.isLoading;
  const requestsError = propertyRequestsQuery.isError;
  const propertyRequestsError = propertyRequestsQuery.error;

  useEffect(() => {
    if (propertyRequestsError) {
      const message =
        propertyRequestsError instanceof Error
          ? propertyRequestsError.message
          : "تعذر تحميل طلبات العملاء";
      toast({
        title: "خطأ",
        description: message,
        variant: "destructive",
      });
    }
  }, [propertyRequestsError, toast]);
  const updateDealMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) =>
      apiPut(`api/deals/${id}`, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      toast({ title: "نجح", description: "تم تحديث مرحلة الصفقة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث مرحلة الصفقة", variant: "destructive" });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: z.infer<typeof dealSchema>) => {
      // Create customer first, then deal
      const nameParts = data.customerName.trim().split(/\s+/);
      return apiPost("/api/deals", {
        firstName: nameParts[0] || data.customerName,
        lastName: nameParts.slice(1).join(" ") || "",
        phone: data.phone || undefined,
        agreedPrice: data.agreedPrice ? Number(data.agreedPrice) : undefined,
        expectedCloseDate: data.expectedCloseDate || undefined,
        source: data.source || "direct",
        notes: data.notes || undefined,
        stage: "NEW",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      setCreateDealOpen(false);
      createDealForm.reset();
      toast({ title: "تم إنشاء الصفقة بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في إنشاء الصفقة", variant: "destructive" }),
  });

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const currentDeal = deals?.find((deal) => deal.id === draggableId);
    if (!currentDeal) return;

    // Handle synthetic deals that were created from customer requests locally
    if (draggableId.startsWith('request-')) {
      queryClient.setQueryData<Deal[] | undefined>(["/api/deals"], (previous) => {
        if (!previous) return previous;
        return previous.map((deal) =>
          deal.id === draggableId ? { ...deal, stage: destination.droppableId } : deal
        );
      });

      toast({
        title: "تم التحديث",
        description: `تم نقل ${currentDeal.leadId ? 'الصفقة' : 'الطلب'} إلى مرحلة ${STAGE_LABELS[destination.droppableId] ?? destination.droppableId}.`,
      });
      return;
    }

    updateDealMutation.mutate({ id: draggableId, stage: destination.droppableId });
  };

  const getDealCustomerName = (deal: Deal) => {
    const customer = (deal as any).customer;
    if (customer) return `${customer.firstName} ${customer.lastName}`;
    // Fallback to lead lookup for backward compat
    if (deal.leadId) {
      const lead = leads?.find((l) => l.id === deal.leadId);
      if (lead) return `${lead.firstName} ${lead.lastName}`;
    }
    return "عميل غير معروف";
  };

  const toNumericAmount = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    const numeric = toNumericAmount(amount);
    if (numeric === null) return "لم يتم تحديد القيمة";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric) + "";
  };

  const formatBudget = (value: string | number | null | undefined) => {
    const numeric = toNumericAmount(value);
    if (numeric === null) return "غير محدد";
    return formatCurrency(numeric);
  };

  const getDealsByStage = (stage: string) => deals?.filter((deal) => deal.stage === stage) || [];

  const openDealDetail = (deal: Deal) => {
    setSelectedDeal(deal);
    setDealDetailTab("info");
    setDealDetailOpen(true);
  };

  const getCustomerInfoForDeal = (deal: Deal) => {
    if (deal.customer) return deal.customer;
    if (deal.leadId) {
      const lead = leads?.find((l) => l.id === deal.leadId);
      if (lead) return { firstName: lead.firstName, lastName: lead.lastName, email: lead.email ?? undefined, phone: lead.phone ?? undefined };
    }
    return null;
  };

  const getDealStageInfo = (stageId: string) => STAGES.find((s) => s.id === stageId);

  const getRevenueEstimate = (deal: Deal) => {
    const value = toNumericAmount(deal.agreedPrice ?? deal.dealValue);
    if (value === null) return null;
    const commission = toNumericAmount(deal.commission);
    return {
      dealValue: value,
      commission: commission ?? value * 0.025,
      net: value - (commission ?? value * 0.025),
    };
  };

  const maskPhoneNumber = (value: string | null | undefined) => {
    if (!value) return "غير متوفر";
    const digits = value.replace(/\D/g, "");
    if (!digits) return "غير متوفر";
    const visible = digits.slice(-3);
    const maskedLength = Math.max(digits.length - 3, 2);
    const masked = "•".repeat(Math.min(maskedLength, 6));
    return `${masked}${visible}`;
  };

  const handleConvertToPipeline = (request: PropertyRequestSummary, cacheKey: string) => {
    const fullName = `${request.firstName ?? ''} ${request.lastName ?? ''}`.trim() || 'طلب بدون اسم';
    const syntheticId = `request-${request.seekerId ?? request.mobileNumber ?? Date.now()}`;
    const now = new Date().toISOString();

    const rawBudget = request.budgetSize;
    const parsedBudget = toNumericAmount(rawBudget);

    const newDeal: any = {
      id: syntheticId,
      leadId: null,
      propertyId: null,
      agentId: '',
      organizationId: null,
      stage: 'NEW',
      status: 'open',
      dealValue: parsedBudget,
      value: parsedBudget,
      commission: null,
      createdAt: now,
      updatedAt: now,
      expectedCloseDate: null,
      notes: `تم تحويل الطلب من لوحة العملاء (${fullName})`,
    };

    queryClient.setQueryData<Deal[] | undefined>(["/api/deals"], (previous) => {
      const existing = previous ?? [];
      const filtered = existing.filter((deal) => deal.id !== syntheticId);
      return [...filtered, newDeal];
    });

    queryClient.setQueryData<PropertyRequestSummary[] | undefined>(["/api/requests"], (previous) => {
      if (!previous) return previous;
      return previous.filter((item, idx) => {
        const key = item.seekerId ?? `${item.mobileNumber ?? 'unknown'}-${idx}`;
        return key !== cacheKey;
      });
    });

    toast({
      title: "تم الإضافة",
      description: `${fullName} انتقل إلى مرحلة عميل محتمل في المسار.`,
    });

    setShowRequestDrawer(false);
  };

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="لوحة مسار الصفقات" subtitle="تابع تقدم الفرص البيعية عبر مراحل المسار المختلفة واسحب البطاقات لتحديث حالة الصفقة فوراً." />
        <PipelineSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="لوحة مسار الصفقات" subtitle="تابع تقدم الفرص البيعية عبر مراحل المسار المختلفة واسحب البطاقات لتحديث حالة الصفقة فوراً.">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRequestDrawer(true)}>
            طلبات العملاء
          </Button>
          <Button size="sm" onClick={() => { createDealForm.reset(); setCreateDealOpen(true); }}>
            إنشاء صفقة
          </Button>
        </div>
      </PageHeader>

      {/* Pipeline Summary Stats */}
      {deals && deals.length > 0 && (() => {
        const totalValue = deals.reduce((s, d) => s + (toNumericAmount(d.agreedPrice ?? d.dealValue) ?? 0), 0);
        const activeDeals = deals.filter(d => !["WON", "LOST"].includes(d.stage));
        const wonDeals = deals.filter(d => d.stage === "WON");
        const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Briefcase className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-black">{deals.length}</p><p className="text-xs text-muted-foreground">إجمالي الصفقات</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-black">{activeDeals.length}</p><p className="text-xs text-muted-foreground">صفقات نشطة</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-black">{winRate}%</p><p className="text-xs text-muted-foreground">نسبة الفوز</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div><SarPrice value={totalValue} className="text-2xl font-black" /><p className="text-xs text-muted-foreground">قيمة المسار</p></div>
            </CardContent></Card>
          </div>
        );
      })()}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {STAGES.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const stageValue = stageDeals.reduce((sum, deal) => {
              const value = toNumericAmount(deal.agreedPrice ?? deal.dealValue);
              return sum + (value ?? 0);
            }, 0);

            return (
              <Card key={stage.id} className="flex h-full flex-col">
                <CardHeader className="text-end">
                  <div className="flex items-center justify-between">
                    <div className={cn("text-sm font-bold", stage.accent)}>{stage.title}</div>
                    <Badge variant={stage.badgeVariant}>
                      {stageDeals.length} صفقة
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground"><SarPrice value={stageValue} /></div>
                </CardHeader>

                <CardContent className="flex-1 p-0">
                  <Droppable droppableId={stage.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex flex-1 flex-col"
                      >
                        <ScrollArea className="h-[calc(100vh-320px)]">
                          <div className="flex flex-col gap-4 px-4 py-4">
                            {stageDeals.map((deal, index) => (
                              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "text-end transition-shadow cursor-pointer hover:ring-1 hover:ring-primary/30",
                                      snapshot.isDragging && "shadow-lg"
                                    )}
                                    onClick={() => openDealDetail(deal)}
                                  >
                                    <CardContent className="p-4 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold">{getDealCustomerName(deal)}</h4>
                                        {(deal.agreedPrice || deal.dealValue) && (
                                          <span className="text-sm font-bold text-primary">
                                            <SarPrice value={deal.agreedPrice ?? deal.dealValue} />
                                          </span>
                                        )}
                                      </div>

                                      {deal.expectedCloseDate && (
                                        <div className="text-xs text-muted-foreground">
                                          متوقع في {formatAdminDate(deal.expectedCloseDate)}
                                        </div>
                                      )}

                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {deal.source && <Badge variant="outline" className="text-[10px]">{deal.source}</Badge>}
                                        <span className="text-[10px] text-muted-foreground">{formatAdminDate(deal.createdAt)}</span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}

                            {stageDeals.length === 0 && (
                              <EmptyState
                                title="لا توجد صفقات في هذه المرحلة حالياً"
                                className="py-6"
                              />
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DragDropContext>

      <Sheet open={showRequestDrawer} onOpenChange={setShowRequestDrawer}>
        <SheetContent side="right" className="w-full max-w-md flex flex-col">
          <SheetHeader className="text-end">
            <SheetTitle>طلبات العملاء</SheetTitle>
            <SheetDescription>عرض مختصر لأحدث الطلبات المسجلة</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-1.5 mt-4">
            {requestsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : requestsError ? (
              <Card className="border-destructive">
                <CardContent className="p-4 text-center text-sm text-destructive">
                  تعذر تحميل طلبات العملاء
                </CardContent>
              </Card>
            ) : propertyRequests.length === 0 ? (
              <EmptyState title="لا توجد طلبات متاحة حالياً" className="py-6" />
            ) : (
              propertyRequests.map((request, index) => {
                const firstName = request.firstName?.trim() || 'عميل';
                const key = request.seekerId ?? `${request.mobileNumber ?? 'unknown'}-${index}`;
                return (
                  <Card key={key} className="text-end">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold">{firstName}</h3>
                          <span className="block text-xs text-muted-foreground">{maskPhoneNumber(request.mobileNumber)}</span>
                        </div>
                        {request.typeOfProperty && (
                          <Badge variant="secondary" className="text-xs">
                            {request.typeOfProperty}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{request.region ?? 'غير محدد'}</span>
                        <span>{request.city ?? ''}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-primary text-xs">
                          {formatBudget(request.budgetSize)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 rounded-md border-primary/20 px-2 text-xs text-primary hover:bg-primary/10"
                          onClick={() => handleConvertToPipeline(request, key)}
                        >
                          نقل إلى عميل محتمل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Deal Detail Drawer ──────────────────────────────────────── */}
      <Sheet open={dealDetailOpen} onOpenChange={setDealDetailOpen}>
        <SheetContent side="right" className="w-full max-w-lg flex flex-col p-0">
          {selectedDeal && (
            <>
              {/* Header */}
              <div className="p-6 border-b bg-muted/30">
                <SheetHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <SheetTitle className="text-xl">
                        {getDealCustomerName(selectedDeal)}
                      </SheetTitle>
                      <SheetDescription>
                        صفقة {STAGE_LABELS[selectedDeal.stage] ?? selectedDeal.stage}
                      </SheetDescription>
                    </div>
                    <Badge variant={getDealStageInfo(selectedDeal.stage)?.badgeVariant ?? "secondary"} className="text-sm px-3 py-1">
                      {STAGE_LABELS[selectedDeal.stage] ?? selectedDeal.stage}
                    </Badge>
                  </div>
                </SheetHeader>

                {/* Value Summary */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">قيمة الصفقة</p>
                      <p className="text-lg font-bold text-primary">
                        <SarPrice value={selectedDeal.agreedPrice ?? selectedDeal.dealValue} />
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">الإغلاق المتوقع</p>
                      <p className="text-sm font-bold">
                        {selectedDeal.expectedCloseDate
                          ? formatAdminDate(selectedDeal.expectedCloseDate)
                          : "غير محدد"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stage Change Buttons */}
                <div className="mt-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">تغيير المرحلة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGES.map((stage) => (
                      <Button
                        key={stage.id}
                        variant={selectedDeal.stage === stage.id ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        disabled={selectedDeal.stage === stage.id}
                        onClick={() => {
                          if (!selectedDeal.id.startsWith('request-')) {
                            updateDealMutation.mutate({ id: selectedDeal.id, stage: stage.id });
                          }
                          setSelectedDeal({ ...selectedDeal, stage: stage.id });
                        }}
                      >
                        {stage.title}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Quick Cross-Page Actions */}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setDealDetailOpen(false); setLocation("/home/platform/calendar"); }}>
                    <CalendarLucide size={14} />
                    جدولة موعد
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setDealDetailOpen(false); setLocation("/home/platform/activities"); }}>
                    <Activity size={14} />
                    تسجيل نشاط
                  </Button>
                </div>
              </div>

              {/* Tabbed Content */}
              <Tabs value={dealDetailTab} onValueChange={setDealDetailTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4 border-b">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="info" className="text-xs">المعلومات</TabsTrigger>
                    <TabsTrigger value="timeline" className="text-xs">المراحل</TabsTrigger>
                    <TabsTrigger value="revenue" className="text-xs">الإيرادات</TabsTrigger>
                    <TabsTrigger value="regulatory" className="text-xs">التنظيمية</TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs">الملاحظات</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  {/* Info Tab */}
                  <TabsContent value="info" className="p-6 mt-0">
                    <div className="space-y-6">
                      {/* Customer Info Card */}
                      <div>
                        <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">بيانات العميل</h4>
                        {(() => {
                          const customer = getCustomerInfoForDeal(selectedDeal);
                          return customer ? (
                            <Card>
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <User size={18} className="text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{customer.email || "لا يوجد بريد"}</p>
                                  </div>
                                </div>
                                {customer.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone size={14} />
                                    <span>{customer.phone}</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ) : (
                            <Card>
                              <CardContent className="p-4 text-center text-muted-foreground text-sm">
                                لا توجد بيانات عميل مرتبطة
                              </CardContent>
                            </Card>
                          );
                        })()}
                      </div>

                      {/* Property Info Card */}
                      <div>
                        <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">بيانات العقار</h4>
                        {selectedDeal.propertyId ? (
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                  <Building2 size={18} className="text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">عقار مرتبط</p>
                                  <p className="text-xs text-muted-foreground">رقم العقار: {selectedDeal.propertyId}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardContent className="p-4 text-center text-muted-foreground text-sm">
                              لا يوجد عقار مرتبط بهذه الصفقة
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Deal Details */}
                      <div>
                        <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">تفاصيل الصفقة</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-muted-foreground text-sm">الحالة</span>
                            <span className="font-medium text-sm">{selectedDeal.status}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-muted-foreground text-sm">المصدر</span>
                            <span className="font-medium text-sm">{selectedDeal.source || "غير محدد"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-muted-foreground text-sm">تاريخ الإنشاء</span>
                            <span className="font-medium text-sm">{formatAdminDate(selectedDeal.createdAt)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-muted-foreground text-sm">آخر تحديث</span>
                            <span className="font-medium text-sm">{formatAdminDate(selectedDeal.updatedAt)}</span>
                          </div>
                          {selectedDeal.wonAt && (
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground text-sm">تاريخ الفوز</span>
                              <span className="font-medium text-sm text-primary">{formatAdminDate(selectedDeal.wonAt)}</span>
                            </div>
                          )}
                          {selectedDeal.lostAt && (
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground text-sm">تاريخ الخسارة</span>
                              <span className="font-medium text-sm text-destructive">{formatAdminDate(selectedDeal.lostAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Timeline Tab */}
                  <TabsContent value="timeline" className="p-6 mt-0">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">مسار المراحل</h4>

                      {/* Stage Progress Visualization */}
                      <div className="relative">
                        <div className="absolute start-4 top-0 bottom-0 w-px bg-border" />
                        {STAGES.map((stage, idx) => {
                          const isCurrent = selectedDeal.stage === stage.id;
                          const stageIndex = STAGES.findIndex(s => s.id === selectedDeal.stage);
                          const isPast = idx < stageIndex;

                          return (
                            <div key={stage.id} className="relative flex gap-3 pb-6 ms-1">
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full z-10 transition-colors",
                                isCurrent ? "bg-primary text-white" :
                                isPast ? "bg-primary/15 text-primary" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {isPast ? <CheckCircle2 size={14} /> :
                                 isCurrent ? <ArrowRightCircle size={14} /> :
                                 <Clock size={14} />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "text-sm",
                                    isCurrent ? "font-bold text-primary" :
                                    isPast ? "font-medium text-primary" :
                                    "text-muted-foreground"
                                  )}>
                                    {stage.title}
                                  </p>
                                  {isCurrent && (
                                    <Badge variant="default" className="text-xs">حالي</Badge>
                                  )}
                                  {isPast && (
                                    <Badge variant="secondary" className="text-xs">مكتمل</Badge>
                                  )}
                                </div>
                                {isCurrent && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    في هذه المرحلة منذ {formatAdminDate(selectedDeal.updatedAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Separator />

                      {/* Activity Log Placeholder */}
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">النشاط</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 border border-border/50 rounded-xl">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                            <Briefcase size={14} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">تم إنشاء الصفقة</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatAdminDate(selectedDeal.createdAt)}</span>
                        </div>
                        {selectedDeal.stage !== "NEW" && (
                          <div className="flex items-center gap-3 p-3 border border-border/50 rounded-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                              <ArrowRightCircle size={14} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">تم تحديث المرحلة إلى {STAGE_LABELS[selectedDeal.stage] ?? selectedDeal.stage}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatAdminDate(selectedDeal.updatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Revenue Tab */}
                  <TabsContent value="revenue" className="p-6 mt-0">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">تقدير الإيرادات</h4>

                      {(() => {
                        const estimate = getRevenueEstimate(selectedDeal);
                        if (!estimate) {
                          return (
                            <div className="py-12 text-center text-muted-foreground">
                              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
                              <p className="text-sm">لم يتم تحديد قيمة الصفقة</p>
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-4">
                            <Card className="border-primary/20">
                              <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                  <span className="text-muted-foreground text-sm">قيمة الصفقة</span>
                                  <SarPrice value={estimate.dealValue} className="font-bold text-lg text-primary" />
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                  <span className="text-muted-foreground text-sm">العمولة المتوقعة (2.5%)</span>
                                  <SarPrice value={estimate.commission} className="font-bold text-primary" />
                                </div>
                                {estimate.commission > 0 && (
                                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-muted-foreground text-sm">ضريبة القيمة المضافة (15%)</span>
                                    <SarPrice value={estimate.commission * 0.15} className="font-medium text-sm" />
                                  </div>
                                )}
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                  <span className="text-muted-foreground text-sm">ض.ت.ع — RETT (5%)</span>
                                  <SarPrice value={estimate.dealValue * 0.05} className="font-bold text-[hsl(var(--warning))]" />
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-muted-foreground text-sm">صافي القيمة</span>
                                  <SarPrice value={estimate.net} className="font-bold" />
                                </div>
                              </CardContent>
                            </Card>

                            {/* Forecast */}
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <TrendingUp size={16} />
                                  التوقعات
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                  <span className="text-muted-foreground text-sm">احتمال الإغلاق</span>
                                  <span className="font-medium text-sm">
                                    {selectedDeal.stage === "WON" ? "100%" :
                                     selectedDeal.stage === "LOST" ? "0%" :
                                     selectedDeal.stage === "UNDER_OFFER" ? "70%" :
                                     selectedDeal.stage === "NEGOTIATION" ? "40%" : "15%"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                  <span className="text-muted-foreground text-sm">الإيراد المتوقع</span>
                                  <span className="font-medium text-sm">
                                    <SarPrice value={
                                      estimate.commission * (
                                        selectedDeal.stage === "WON" ? 1 :
                                        selectedDeal.stage === "LOST" ? 0 :
                                        selectedDeal.stage === "UNDER_OFFER" ? 0.7 :
                                        selectedDeal.stage === "NEGOTIATION" ? 0.4 : 0.15
                                      )
                                    } />
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-muted-foreground text-sm">الإغلاق المتوقع</span>
                                  <span className="font-medium text-sm">
                                    {selectedDeal.expectedCloseDate
                                      ? formatAdminDate(selectedDeal.expectedCloseDate)
                                      : "غير محدد"}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })()}
                    </div>
                  </TabsContent>

                  {/* Regulatory Tab — Saudi Compliance */}
                  <TabsContent value="regulatory" className="p-6 mt-0">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">المتطلبات التنظيمية</h4>

                      {/* Commission Cap */}
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <DollarSign size={16} className="text-primary" />
                            العمولة (نظام الوساطة العقارية)
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-muted-foreground text-sm">الحد النظامي</span>
                            <span className="font-bold text-sm">2.5%</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-muted-foreground text-sm">نسبة العمولة</span>
                            <span className="font-bold text-sm">
                              {(selectedDeal as any).commissionPercentage ? `${(selectedDeal as any).commissionPercentage}%` : "2.5% (افتراضي)"}
                            </span>
                          </div>
                          {(selectedDeal as any).brokerageContractRef && (
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-muted-foreground text-sm">عقد الوساطة</span>
                              <span className="font-medium text-sm">{(selectedDeal as any).brokerageContractRef}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* RETT */}
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <FileText size={16} className="text-[hsl(var(--warning))]" />
                            ضريبة التصرفات العقارية — RETT (ZATCA)
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-muted-foreground text-sm">نسبة الضريبة</span>
                            <span className="font-bold text-sm">5%</span>
                          </div>
                          {(() => {
                            const price = Number(selectedDeal.agreedPrice ?? selectedDeal.dealValue ?? 0);
                            const isFirstHome = (selectedDeal as any).firstHomeExemption === true;
                            const rettAmount = price * 0.05;
                            const exemption = isFirstHome ? Math.min(price, 1000000) * 0.05 : 0;
                            const netRett = Math.max(0, rettAmount - exemption);
                            return (
                              <>
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                  <span className="text-muted-foreground text-sm">مبلغ الضريبة</span>
                                  <SarPrice value={rettAmount} className="font-bold text-[hsl(var(--warning))]" />
                                </div>
                                {isFirstHome && (
                                  <>
                                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                                      <span className="text-muted-foreground text-sm">إعفاء المسكن الأول (سكني)</span>
                                      <span className="font-bold text-primary">-<SarPrice value={exemption} /></span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                                      <span className="text-muted-foreground text-sm">صافي الضريبة</span>
                                      <SarPrice value={netRett} className="font-bold" />
                                    </div>
                                  </>
                                )}
                                {(selectedDeal as any).rettReference && (
                                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-muted-foreground text-sm">رقم مرجع ZATCA</span>
                                    <span className="font-medium text-sm">{(selectedDeal as any).rettReference}</span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-muted-foreground text-sm">حالة السداد</span>
                                  <Badge variant={(selectedDeal as any).rettPaidDate ? "default" : "outline"}>
                                    {(selectedDeal as any).rettPaidDate ? "مسدد" : "غير مسدد"}
                                  </Badge>
                                </div>
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      {/* Ejar */}
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <Calendar size={16} className="text-accent-foreground" />
                            عقد إيجار (منصة إيجار)
                          </div>
                          {(selectedDeal as any).ejarContractNumber ? (
                            <>
                              <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-muted-foreground text-sm">رقم عقد إيجار</span>
                                <span className="font-bold text-sm">{(selectedDeal as any).ejarContractNumber}</span>
                              </div>
                              {(selectedDeal as any).ejarRegistrationDate && (
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-muted-foreground text-sm">تاريخ التسجيل</span>
                                  <span className="font-medium text-sm">{formatAdminDate((selectedDeal as any).ejarRegistrationDate)}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground py-3 text-center">
                              لم يتم ربط عقد إيجار بهذه الصفقة بعد
                            </p>
                          )}
                          <div className="rounded-lg bg-accent p-3 text-xs text-accent-foreground">
                            عقود الإيجار التي تزيد مدتها عن 3 أشهر يجب تسجيلها في منصة إيجار (ejar.sa) وتعتبر سندات تنفيذية.
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Notes Tab */}
                  <TabsContent value="notes" className="p-6 mt-0">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">الملاحظات</h4>

                      {selectedDeal.notes ? (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <FileText size={14} className="text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm leading-relaxed">{selectedDeal.notes}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  آخر تحديث: {formatAdminDate(selectedDeal.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                          <p className="text-sm">لا توجد ملاحظات مسجلة لهذه الصفقة</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Create Deal Sheet ──────────────────────────────────────── */}
      <Sheet open={createDealOpen} onOpenChange={setCreateDealOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>إنشاء صفقة جديدة</SheetTitle>
            <SheetDescription>أدخل بيانات الصفقة الجديدة</SheetDescription>
          </SheetHeader>
          <Form {...createDealForm}>
            <form onSubmit={createDealForm.handleSubmit((data) => createDealMutation.mutate(data))} className="space-y-4 py-4 max-w-lg mx-auto">
              <FormField control={createDealForm.control} name="customerName" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم العميل *</FormLabel>
                  <FormControl><Input {...field} placeholder="مثال: محمد أحمد" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createDealForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl><Input {...field} type="tel" dir="ltr" className="text-start" placeholder="05XXXXXXXX" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={createDealForm.control} name="agreedPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>قيمة الصفقة</FormLabel>
                    <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createDealForm.control} name="expectedCloseDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الإغلاق المتوقع</FormLabel>
                    <FormControl><Input {...field} type="date" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={createDealForm.control} name="source" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المصدر</FormLabel>
                    <FormControl><Input {...field} placeholder="إحالة، موقع، واتساب..." /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={createDealForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl><Textarea {...field} rows={2} placeholder="تفاصيل إضافية..." /></FormControl>
                </FormItem>
              )} />
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDealOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createDealMutation.isPending}>
                  {createDealMutation.isPending ? "..." : "إنشاء الصفقة"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
