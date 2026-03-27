/**
 * notifications.tsx - Notifications Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → notifications.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Notifications management page. Provides:
 * - Notification listing
 * - Notification filtering
 * - Notification actions
 * 
 * Route: /home/platform/notifications or /notifications
 * 
 * Related Files:
 * - apps/api/routes/notifications.ts - Notifications API routes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Send, Users, MessageCircle, Mail, Calendar, Filter, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/apiClient";
import type { Lead } from "@shared/types";
import SendWhatsAppModal from "@/components/modals/send-whatsapp-modal";
import { getNotificationStatusVariant } from "@/lib/status-variants";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/ui/empty-state";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import PageHeader from "@/components/ui/page-header";

export default function Notifications() {
  const { t, dir, language } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignType, setCampaignType] = useState("email");
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<Lead | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading, isError, refetch } = useQuery<Lead[]>({
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
    }) => apiPost("api/campaigns", campaign),
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

  const normalizedQuery = searchQuery.toLowerCase();
  const filteredLeads =
    leads?.filter((lead) => {
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const email = (lead.email ?? "").toLowerCase();
      const phone = lead.phone ?? "";
      return (
        fullName.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        phone.includes(searchQuery)
      );
    }) ?? [];

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

  if (isError) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <QueryErrorFallback message={t("notifications.load_error") || "Failed to load notifications."} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader title={t("nav.notifications") || "الإشعارات"} subtitle="إدارة الإشعارات والحملات والتواصل مع العملاء" />
        <section className="space-y-6">
          <Tabs defaultValue="customers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customers">تفاصيل العملاء</TabsTrigger>
              <TabsTrigger value="campaign">إنشاء حملة</TabsTrigger>
              <TabsTrigger value="history">تاريخ الحملات</TabsTrigger>
            </TabsList>

            {/* Customer Details Tab */}
            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Users size={20} />
                      <span>تفاصيل العملاء ({filteredLeads.length})</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
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
                  <EmptyState
                    icon={Users}
                    title={searchQuery ? "لا توجد عملاء تطابق بحثك" : "لا توجد عملاء"}
                  />
                ) : (
                  <div className="divide-y">
                    {filteredLeads.map((lead) => (
                      <div key={lead.id} className="p-4 hover:bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={() => handleLeadSelection(lead.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold">
                                  {lead.firstName} {lead.lastName}
                                </h4>
                                <Badge variant={getNotificationStatusVariant(lead.status)}>
                                  {lead.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
                                  <Mail size={14} />
                                  <span>{lead.email}</span>
                                </div>
                                {lead.phone && (
                                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground">
                                    <MessageCircle size={14} />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs text-muted-foreground">
                                  <span>{lead.interestType || 'غير محدد'}</span>
                                  <span>{lead.budgetRange || 'غير محدد'}</span>
                                  <span>تاريخ الإنشاء: {new Date(lead.createdAt).toLocaleDateString(locale)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            {lead.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWhatsAppClick(lead)}
                                className="text-primary border-primary/20 hover:bg-primary/10"
                              >
                                <MessageCircle size={14} className={"me-2"} />
                                واتساب
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Bell size={14} className={"me-2"} />
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
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Send size={20} />
                  <span>إنشاء حملة جديدة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>عنوان الحملة</Label>
                      <Input
                        value={campaignTitle}
                        onChange={(e) => setCampaignTitle(e.target.value)}
                        placeholder="أدخل عنوان الحملة..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>نوع الحملة</Label>
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
                    
                    <div className="space-y-2">
                      <Label>العملاء المحددين ({selectedLeads.length})</Label>
                      <div className="text-sm text-muted-foreground">
                        {selectedLeads.length === 0 
                          ? "لم يتم تحديد عملاء. انتقل إلى تبويب 'تفاصيل العملاء' لتحديد المستلمين."
                          : `تم تحديد ${selectedLeads.length} عميل للحملة.`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>محتوى الرسالة</Label>
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
                    <Send className={"me-2"} size={16} />
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
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Calendar size={20} />
                  <span>تاريخ الحملات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Calendar}
                  title="لا توجد حملات سابقة"
                  description="ستظهر هنا الحملات التي تم إرسالها مع إحصائياتها"
                />
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </section>
      {selectedLeadForWhatsApp && (
        <SendWhatsAppModal
          open={whatsappModalOpen}
          onOpenChange={setWhatsappModalOpen}
          leadId={selectedLeadForWhatsApp.id}
          phoneNumber={selectedLeadForWhatsApp.phone || ""}
          leadName={`${selectedLeadForWhatsApp.firstName} ${selectedLeadForWhatsApp.lastName}`}
        />
      )}
    </div>
  );
}
