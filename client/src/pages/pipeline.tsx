import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
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

export default function Pipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deals, isLoading } = useQuery<Deal[]>({ queryKey: ["/api/deals"] });
  const { data: leads } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });

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

  const getDealsByStage = (stage: string) => deals?.filter((deal) => deal.stage === stage) || [];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 text-slate-500 shadow-sm">
          جارٍ تحميل مسار الصفقات...
        </div>
      </div>
    );
  }

  const totalDeals = deals?.length ?? 0;
  const totalValue = deals?.reduce((sum, deal) => sum + (deal.dealValue ? parseFloat(deal.dealValue) : 0), 0) ?? 0;
  const closingSoon =
    deals?.filter((deal) => {
      if (!deal.expectedCloseDate) return false;
      const diff = new Date(deal.expectedCloseDate).getTime() - Date.now();
      return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 14;
    }).length ?? 0;

  return (
    <main className="space-y-10">
      <div className="space-y-6 rounded-[32px] border border-white/60 bg-white/90 p-8 shadow-[0_25px_90px_rgba(148,163,184,0.18)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2 text-right">
            <h1 className="text-3xl font-bold text-slate-900">لوحة مسار الصفقات</h1>
            <p className="max-w-2xl text-slate-500">
              تابع تقدم الفرص البيعية عبر مراحل المسار المختلفة واسحب البطاقات لتحديث حالة الصفقة فوراً.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <div className="rounded-2xl border border-slate-200 px-5 py-3 text-right">
              <div className="text-xs uppercase tracking-wide text-slate-400">إجمالي الصفقات</div>
              <div className="text-2xl font-semibold text-slate-900">{totalDeals}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 px-5 py-3 text-right">
              <div className="text-xs uppercase tracking-wide text-slate-400">القيمة الإجمالية للمسار</div>
              <div className="text-2xl font-semibold text-emerald-600">{formatCurrency(totalValue)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 px-5 py-3 text-right">
              <div className="text-xs uppercase tracking-wide text-slate-400">صفقات قريبة الإغلاق</div>
              <div className="text-2xl font-semibold text-sky-600">{closingSoon}</div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="self-end rounded-2xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          onClick={() => toast({ title: "قريباً", description: "سيتم دعم إضافة الصفقات من هنا لاحقاً." })}
        >
          إضافة صفقة جديدة
        </Button>
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
    </main>
  );
}
