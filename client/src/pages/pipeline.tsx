import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Deal, Lead } from "@shared/schema";

const STAGES = [
  { id: "lead", title: "عميل محتمل", color: "bg-slate-100" },
  { id: "qualified", title: "مؤهل", color: "bg-blue-100" },
  { id: "showing", title: "معاينة", color: "bg-yellow-100" },
  { id: "negotiation", title: "تفاوض", color: "bg-orange-100" },
  { id: "closed", title: "مكتملة", color: "bg-green-100" },
];

export default function Pipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
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
      toast({ 
        title: "خطأ", 
        description: "فشل في تحديث مرحلة الصفقة",
        variant: "destructive" 
      });
    },
  });

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    updateDealMutation.mutate({
      id: draggableId,
      stage: destination.droppableId,
    });
  };

  const getLeadName = (leadId: string) => {
    const lead = leads?.find(l => l.id === leadId);
    return lead ? `${lead.firstName} ${lead.lastName}` : "عميل غير معروف";
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "لم يتم تحديد القيمة";
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getDealsByStage = (stage: string) => {
    return deals?.filter(deal => deal.stage === stage) || [];
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500">جار تحميل مراحل الصفقات...</div>
      </div>
    );
  }

  return (
    <>
      <Header title="مراحل الصفقات" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {STAGES.map((stage) => {
              const stageDeals = getDealsByStage(stage.id);
              const stageValue = stageDeals.reduce((sum, deal) => {
                return sum + (deal.dealValue ? parseFloat(deal.dealValue) : 0);
              }, 0);

              return (
                <div key={stage.id} className="flex flex-col">
                  <Card className="mb-4">
                    <CardHeader className={`${stage.color} border-b`}>
                      <CardTitle className="text-center">
                        <div className="text-lg font-semibold">{stage.title}</div>
                        <div className="text-sm text-slate-600">
                          {stageDeals.length} صفقة • {formatCurrency(stageValue.toString())}
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Droppable droppableId={stage.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 space-y-3"
                      >
                        {stageDeals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="cursor-move hover:shadow-md transition-shadow"
                              >
                                <CardContent className="p-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-slate-900">
                                      {getLeadName(deal.leadId)}
                                    </h4>
                                    
                                    {deal.dealValue && (
                                      <div className="text-lg font-semibold text-primary">
                                        {formatCurrency(deal.dealValue)}
                                      </div>
                                    )}
                                    
                                    {deal.expectedCloseDate && (
                                      <div className="text-sm text-slate-500">
                                        متوقع: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                      </div>
                                    )}
                                    
                                    {deal.notes && (
                                      <p className="text-sm text-slate-600 line-clamp-2">
                                        {deal.notes}
                                      </p>
                                    )}
                                    
                                    <div className="text-xs text-slate-400">
                                      Created: {new Date(deal.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {stageDeals.length === 0 && (
                          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                            No deals in this stage
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

        {/* Pipeline Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Pipeline Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {deals?.length || 0}
                </div>
                <div className="text-sm text-slate-500">Total Deals</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(
                    deals?.reduce((sum, deal) => sum + (deal.dealValue ? parseFloat(deal.dealValue) : 0), 0).toString() || "0"
                  )}
                </div>
                <div className="text-sm text-slate-500">Total Pipeline Value</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(
                    deals?.filter(deal => deal.stage === 'closed')
                      .reduce((sum, deal) => sum + (deal.dealValue ? parseFloat(deal.dealValue) : 0), 0).toString() || "0"
                  )}
                </div>
                <div className="text-sm text-slate-500">Closed Deal Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
