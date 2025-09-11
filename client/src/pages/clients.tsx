import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Phone, Mail, Calendar, MessageCircle, Plus, Users as UsersIcon, ListChecks, CheckCircle2, UserPlus } from "lucide-react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Lead, Activity } from "@shared/types";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { t } = useLanguage();

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/activities/lead", selectedLeadId],
    enabled: !!selectedLeadId,
  });

  const filteredLeads = leads?.filter(lead => 
    !searchQuery || 
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const selectedLead = leads?.find(lead => lead.id === selectedLeadId);

  useEffect(() => {
    if (!selectedLeadId && filteredLeads.length > 0) {
      setSelectedLeadId(filteredLeads[0].id);
    }
  }, [filteredLeads, selectedLeadId]);

  const total = leads?.length || 0;
  const qualified = leads?.filter(l => l.status === 'qualified').length || 0;
  const closed = leads?.filter(l => l.status === 'closed').length || 0;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      tion"case "new": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-blue-100 text-blue-800";
      case "showing": return "bg-orange-100 text-orange-800";
      case "negotia: return "bg-purple-100 text-purple-800";
      case "closed": return "bg-green-100 text-green-800";
      case "lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone size={16} />;
      case "email": return <Mail size={16} />;
      case "meeting": return <Calendar size={16} />;
      case "showing": return <Calendar size={16} />;
      default: return <MessageCircle size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500">جار تحميل العملاء...</div>
      </div>
    );
  }

  return (
    <>
      <Header 
        title="علاقات العملاء" 
        onSearch={setSearchQuery}
        searchPlaceholder="البحث في العملاء بالاسم أو البريد الإلكتروني..."
      />
      
      <main className="flex-1 overflow-y-auto p-6" dir="rtl">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="apple-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">إجمالي العملاء</div>
                <div className="text-2xl font-bold text-slate-900">{total}</div>
              </div>
              <UsersIcon className="text-primary" size={20} />
            </CardContent>
          </Card>
          <Card className="apple-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">المؤهلون</div>
                <div className="text-2xl font-bold text-slate-900">{qualified}</div>
              </div>
              <ListChecks className="text-primary" size={20} />
            </CardContent>
          </Card>
          <Card className="apple-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">المغلقون</div>
                <div className="text-2xl font-bold text-slate-900">{closed}</div>
              </div>
              <CheckCircle2 className="text-primary" size={20} />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="lg:col-span-1">
            <Card className="apple-card h-full">
              <CardHeader className="border-b border-slate-200 sticky top-0 bg-white/80 backdrop-blur z-10">
                <div className="flex items-center justify-between">
                  <CardTitle>العملاء ({filteredLeads.length})</CardTitle>
                  <Button size="sm" className="bg-primary text-white">
                    <UserPlus className="ml-2" size={16} />
                    إضافة عميل
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto" style={{maxHeight: 'calc(100vh - 260px)'}}>
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    {searchQuery ? "لا توجد عملاء تطابق بحثك." : "لا توجد عملاء."}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedLeadId === lead.id ? "bg-primary/5 ring-1 ring-primary" : "hover:bg-slate-50"
                        }`}
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900">
                            {lead.firstName} {lead.lastName}
                          </h4>
                          <Badge className={getStatusBadgeColor(lead.status)}>
                            {t(`status.${lead.status}`) || lead.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-1">{lead.email}</p>
                        {lead.phone && (
                          <p className="text-sm text-slate-500">{lead.phone}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-400">
                            {lead.interestType && `${t(`interest.${lead.interestType}`) || lead.interestType} • `}
                            {lead.budgetRange}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-2">
            {!selectedLead ? (
              <Card className="apple-card">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-slate-500">
                    <MessageCircle size={48} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium mb-2">اختر عميلاً</h3>
                    <p>اختر عميلاً من القائمة لعرض تفاصيله وتاريخ نشاطه.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Client Header */}
                <Card className="apple-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-900">
                          {selectedLead.firstName} {selectedLead.lastName}
                        </h2>
                        <p className="text-slate-600">{selectedLead.email}</p>
                        {selectedLead.phone && (
                          <p className="text-slate-600">{selectedLead.phone}</p>
                        )}
                      </div>
                      <Badge className={getStatusBadgeColor(selectedLead.status)}>
                        {selectedLead.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-slate-500">Lead Source</span>
                        <p className="font-medium">{selectedLead.leadSource || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-slate-500">Interest Type</span>
                        <p className="font-medium">{selectedLead.interestType || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-slate-500">Budget Range</span>
                        <p className="font-medium">{selectedLead.budgetRange || "Not specified"}</p>
                      </div>
                    </div>

                    {selectedLead.notes && (
                      <div>
                        <span className="text-sm text-slate-500">Notes</span>
                        <p className="text-slate-700 mt-1">{selectedLead.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" className="bg-green-600 text-white">
                        <Phone className="ml-2" size={16} />
                        اتصال
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="ml-2" size={16} />
                        بريد
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="ml-2" size={16} />
                        جدولة
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Tabs */}
                <Card className="apple-card">
                  <Tabs defaultValue="activities" className="w-full">
                    <CardHeader className="border-b border-slate-200">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="activities">الأنشطة</TabsTrigger>
                        <TabsTrigger value="notes">الملاحظات</TabsTrigger>
                        <TabsTrigger value="timeline">الخط الزمني</TabsTrigger>
                      </TabsList>
                    </CardHeader>

                    <TabsContent value="activities" className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">سجل الأنشطة</h3>
                        <Button size="sm" className="bg-primary text-white">
                          <Plus className="ml-2" size={16} />
                          إضافة نشاط
                        </Button>
                      </div>

                      {!activities || activities.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">لا توجد أنشطة مسجلة لهذا العميل.</div>
                      ) : (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                              <div className="flex-shrink-0 mt-1">
                                {getActivityIcon(activity.activityType)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-slate-900">{activity.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.activityType}
                                  </Badge>
                                  {activity.completed && (
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      مكتمل
                                    </Badge>
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="text-sm text-slate-600 mb-2">{activity.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-slate-500">
                                  {activity.scheduledDate && (
                                    <span>
                                      مجدول: {new Date(activity.scheduledDate).toLocaleString('ar-SA')}
                                    </span>
                                  )}
                                  <span>
                                    أُنشئ: {new Date(activity.createdAt).toLocaleDateString('ar-SA')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="notes" className="p-6">
                      <div className="text-center py-8 text-slate-500">ميزة الملاحظات ستتوفر قريبًا…</div>
                    </TabsContent>

                    <TabsContent value="timeline" className="p-6">
                      <div className="text-center py-8 text-slate-500">عرض الخط الزمني قريبًا…</div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
