import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Send, Users, MessageCircle, Mail, Calendar, Filter, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/types";
import SendWhatsAppModal from "@/components/modals/send-whatsapp-modal";

export default function Notifications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignType, setCampaignType] = useState("email");
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<Lead | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaign: {
      title: string;
      message: string;
      type: string;
      leadIds: string[];
    }) => {
      const response = await apiRequest("POST", "/api/campaigns", campaign);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "نجح", description: "تم إرسال الحملة بنجاح" });
      setCampaignTitle("");
      setCampaignMessage("");
      setSelectedLeads([]);
    },
    onError: () => {
      toast({ 
        title: "خطأ", 
        description: "فشل في إرسال الحملة",
        variant: "destructive" 
      });
    },
  });

  const filteredLeads = leads?.filter(lead =>
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.phone && lead.phone.includes(searchQuery))
  ) || [];

  const handleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleSendCampaign = () => {
    if (!campaignTitle || !campaignMessage || selectedLeads.length === 0) {
      toast({ 
        title: "خطأ", 
        description: "يرجى ملء جميع الحقول واختيار عملاء على الأقل",
        variant: "destructive" 
      });
      return;
    }

    sendCampaignMutation.mutate({
      title: campaignTitle,
      message: campaignMessage,
      type: campaignType,
      leadIds: selectedLeads,
    });
  };

  const handleWhatsAppClick = (lead: Lead) => {
    if (!lead.phone) {
      toast({ 
        title: "خطأ", 
        description: "لا يوجد رقم هاتف لهذا العميل",
        variant: "destructive" 
      });
      return;
    }
    setSelectedLeadForWhatsApp(lead);
    setWhatsappModalOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-green-100 text-green-800";
      case "lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500">جار تحميل إشعارات العملاء...</div>
      </div>
    );
  }

  return (
    <>
      <main className="h-full overflow-y-auto p-6">
        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers">تفاصيل العملاء</TabsTrigger>
            <TabsTrigger value="campaign">إنشاء حملة</TabsTrigger>
            <TabsTrigger value="history">تاريخ الحملات</TabsTrigger>
          </TabsList>

          {/* Customer Details Tab */}
          <TabsContent value="customers">
            <Card>
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users size={20} />
                    <span>تفاصيل العملاء ({filteredLeads.length})</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedLeads.length === filteredLeads.length ? "إلغاء التحديد" : "تحديد الكل"}
                    </Button>
                    <Badge variant="secondary">
                      {selectedLeads.length} محدد
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto mb-4 text-slate-300" size={48} />
                    <div className="text-slate-500 mb-4">
                      {searchQuery ? "لا توجد عملاء تطابق بحثك." : "لا توجد عملاء."}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredLeads.map((lead) => (
                      <div key={lead.id} className="p-4 hover:bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => handleLeadSelection(lead.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-slate-900">
                                  {lead.firstName} {lead.lastName}
                                </h4>
                                <Badge className={getStatusBadgeColor(lead.status)}>
                                  {lead.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center space-x-2 text-slate-600">
                                  <Mail size={14} />
                                  <span>{lead.email}</span>
                                </div>
                                {lead.phone && (
                                  <div className="flex items-center space-x-2 text-slate-600">
                                    <MessageCircle size={14} />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-slate-500">
                                  <span>{lead.interestType || 'غير محدد'}</span>
                                  <span>{lead.budgetRange || 'غير محدد'}</span>
                                  <span>تاريخ الإنشاء: {new Date(lead.createdAt).toLocaleDateString('en-US')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {lead.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWhatsAppClick(lead)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <MessageCircle size={14} className="ml-1" />
                                واتساب
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Bell size={14} className="ml-1" />
                              إشعار
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign Creation Tab */}
          <TabsContent value="campaign">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send size={20} />
                  <span>إنشاء حملة جديدة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        عنوان الحملة
                      </label>
                      <Input
                        value={campaignTitle}
                        onChange={(e) => setCampaignTitle(e.target.value)}
                        placeholder="أدخل عنوان الحملة..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        نوع الحملة
                      </label>
                      <Select value={campaignType} onValueChange={setCampaignType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">البريد الإلكتروني</SelectItem>
                          <SelectItem value="sms">رسالة نصية</SelectItem>
                          <SelectItem value="whatsapp">واتساب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        العملاء المحددين ({selectedLeads.length})
                      </label>
                      <div className="text-sm text-slate-600">
                        {selectedLeads.length === 0 
                          ? "لم يتم تحديد عملاء. انتقل إلى تبويب 'تفاصيل العملاء' لتحديد المستلمين."
                          : `تم تحديد ${selectedLeads.length} عميل للحملة.`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      محتوى الرسالة
                    </label>
                    <Textarea
                      value={campaignMessage}
                      onChange={(e) => setCampaignMessage(e.target.value)}
                      placeholder="أدخل محتوى الحملة..."
                      className="min-h-32"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => {
                    setCampaignTitle("");
                    setCampaignMessage("");
                    setSelectedLeads([]);
                  }}>
                    إلغاء
                  </Button>
                  <Button 
                    onClick={handleSendCampaign}
                    disabled={sendCampaignMutation.isPending}
                  >
                    <Send className="ml-2" size={16} />
                    {sendCampaignMutation.isPending ? "جار الإرسال..." : "إرسال الحملة"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar size={20} />
                  <span>تاريخ الحملات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="mx-auto mb-4 text-slate-300" size={48} />
                  <div className="text-slate-500 mb-4">لا توجد حملات سابقة</div>
                  <div className="text-sm text-slate-400">
                    ستظهر هنا الحملات التي تم إرسالها مع إحصائياتها
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {selectedLeadForWhatsApp && (
        <SendWhatsAppModal
          open={whatsappModalOpen}
          onOpenChange={setWhatsappModalOpen}
          leadId={selectedLeadForWhatsApp.id}
          phoneNumber={selectedLeadForWhatsApp.phone || ""}
          leadName={`${selectedLeadForWhatsApp.firstName} ${selectedLeadForWhatsApp.lastName}`}
        />
      )}
    </>
  );
}