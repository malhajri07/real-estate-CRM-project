import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Deal, Lead } from "@shared/types";

const STAGES = [
  { id: "lead", title: "عميل محتمل", badge: "bg-slate-100 text-slate-700", accent: "text-slate-600" },
  { id: "qualified", title: "مؤهل", badge: "bg-sky-100 text-sky-700", accent: "text-sky-600" },
  { id: "showing", title: "معاينة", badge: "bg-amber-100 text-amber-700", accent: "text-amber-600" },
  { id: "negotiation", title: "تفاوض", badge: "bg-orange-100 text-orange-700", accent: "text-orange-600" },
  { id: "closed", title: "مكتملة", badge: "bg-emerald-100 text-emerald-700", accent: "text-emerald-600" },
];

const STAGE_LABELS: Record<string, string> = {
  lead: "عميل محتمل",
  qualified: "مؤهل",
  showing: "معاينة",
  negotiation: "تفاوض",
  closed: "مكتملة",
};

export default function Pipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);

  const { data: deals, isLoading } = useQuery<Deal[]>({ queryKey: ["/api/deals"] });
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

  const {
    data: propertyRequests = [],
    isLoading: requestsLoading,
    isError: requestsError,
  } = useQuery<PropertyRequestSummary[]>({
    queryKey: ["/api/requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/requests");
      const body = await response.json().catch(() => []);
      if (!response.ok) {
        const message = body && typeof body === 'object' && body && 'message' in body
          ? String((body as any).message)
          : "تعذر تحميل طلبات العملاء";
        throw new Error(message);
      }
      return Array.isArray(body) ? body : [];
    },
    enabled: showRequestDrawer,
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "تعذر تحميل طلبات العملاء",
        variant: "destructive",
      });
    },
  });
  const updateDealMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const response = await apiRequest("PUT", `/api/deals/${id}`, { stage });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "نجح", description: "تم تحديث مرحلة الصفقة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث مرحلة الصفقة", variant: "destructive" });
    },
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

  const getLeadName = (leadId: string) => {
    const lead = leads?.find((l) => l.id === leadId);
    return lead ? `${lead.firstName} ${lead.lastName}` : "عميل غير معروف";
  };

  const formatCurrency = (amount: string | number | null) => {
    if (amount === null || amount === undefined) return "لم يتم تحديد القيمة";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number.isFinite(num) ? num : 0) + " ﷼";
  };

  const formatBudget = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") {
      return "غير محدد";
    }
    const numeric = typeof value === "string" ? parseFloat(value) : value;
    if (!Number.isFinite(numeric)) return "غير محدد";
    return formatCurrency(numeric);
  };

  const getDealsByStage = (stage: string) => deals?.filter((deal) => deal.stage === stage) || [];

  const closeRequestDrawer = () => setShowRequestDrawer(false);

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
    const parsedBudget = (() => {
      if (rawBudget === null || rawBudget === undefined || rawBudget === "") return null;
      const numeric = typeof rawBudget === 'string' ? parseFloat(rawBudget) : rawBudget;
      return Number.isFinite(numeric) ? numeric : null;
    })();

    const newDeal: any = {
      id: syntheticId,
      leadId: null,
      propertyId: null,
      agentId: '',
      organizationId: null,
      stage: 'lead',
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

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 text-slate-500 shadow-sm">
          جارٍ تحميل مسار الصفقات...
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 text-right">
            <h1 className="text-2xl font-semibold text-slate-900">لوحة مسار الصفقات</h1>
            <p className="max-w-xl text-sm text-slate-500">
              تابع تقدم الفرص البيعية عبر مراحل المسار المختلفة واسحب البطاقات لتحديث حالة الصفقة فوراً.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-9 px-4"
            onClick={() => setShowRequestDrawer(true)}
          >
            إضافة صفقة جديدة
          </Button>
        </div>

      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {STAGES.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.dealValue ? parseFloat(deal.dealValue) : 0), 0);

            return (
              <div
                key={stage.id}
                className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white/95 shadow-[0_20px_70px_rgba(148,163,184,0.12)] backdrop-blur"
              >
                <div className="rounded-t-[28px] border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-5 text-right">
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-semibold ${stage.accent}`}>{stage.title}</div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${stage.badge}`}>
                      {stageDeals.length} صفقة
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{formatCurrency(stageValue)}</div>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-1 flex-col gap-4 overflow-auto px-4 py-4"
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm transition-shadow ${
                                snapshot.isDragging ? "shadow-lg" : ""
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-base font-semibold text-slate-900">{getLeadName(deal.leadId)}</h4>
                                  {deal.dealValue && (
                                    <span className="text-sm font-semibold text-emerald-600">
                                      {formatCurrency(deal.dealValue)}
                                    </span>
                                  )}
                                </div>

                                {deal.expectedCloseDate && (
                                  <div className="text-xs text-slate-500">
                                    متوقع في {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                  </div>
                                )}

                                {deal.notes && (
                                  <p className="text-sm text-slate-600 line-clamp-3">{deal.notes}</p>
                                )}

                                <div className="text-xs text-slate-400">
                                  أُنشئت في {new Date(deal.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {stageDeals.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                          لا توجد صفقات في هذه المرحلة حالياً
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showRequestDrawer && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={closeRequestDrawer}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-full max-w-md border-r border-slate-200 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-right">
                <h2 className="text-base font-semibold text-slate-900">طلبات العملاء</h2>
                <p className="text-xs text-slate-500">عرض مختصر لأحدث الطلبات المسجلة</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeRequestDrawer} className="rounded-full">
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
              {requestsLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  جارٍ تحميل طلبات العملاء...
                </div>
              ) : requestsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                  تعذر تحميل طلبات العملاء
                </div>
              ) : propertyRequests.length === 0 ? (
                <div className="rounded-xl border border-slate-200 border-dashed px-4 py-6 text-center text-sm text-slate-400">
                  لا توجد طلبات متاحة حالياً
                </div>
              ) : (
                propertyRequests.map((request, index) => {
                  const firstName = request.firstName?.trim() || 'عميل';
                  const key = request.seekerId ?? `${request.mobileNumber ?? 'unknown'}-${index}`;
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-slate-200 bg-[radial-gradient(circle_at_top,_#f5f5f7,_#eef1f5)] px-3 py-1.5 text-right shadow-sm space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="space-y-0.5">
                          <h3 className="text-[12px] font-semibold text-slate-900">{firstName}</h3>
                          <span className="block text-[10px] text-slate-500">{maskPhoneNumber(request.mobileNumber)}</span>
                        </div>
                        {request.typeOfProperty && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {request.typeOfProperty}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{request.region ?? 'غير محدد'}</span>
                        <span>{request.city ?? ''}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-emerald-600 text-[12px]">
                          {formatBudget(request.budgetSize)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 rounded-md border-emerald-200 px-2 text-[10px] text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleConvertToPipeline(request, key)}
                        >
                          نقل إلى عميل محتمل
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </>
      )}
    </main>
  );
}
