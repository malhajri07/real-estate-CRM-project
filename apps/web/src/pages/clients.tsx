import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Phone, Mail, Calendar, MessageCircle, Plus, Users as UsersIcon, ListChecks, CheckCircle2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Lead, Activity } from "@shared/types";
import { cn } from "@/lib/utils";
import { interactiveCard, subduedText } from "@/lib/design-system";

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

  const filteredLeads =
    leads?.filter((lead) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const email = (lead.email ?? "").toLowerCase();
      const phone = lead.phone?.toLowerCase() ?? "";
      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    }) ?? [];

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
      case "new": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-blue-100 text-blue-800";
      case "showing": return "bg-orange-100 text-orange-800";
      case "negotiating": return "bg-purple-100 text-purple-800";
      case "closed": return "bg-green-100 text-green-800";
      case "lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type?: string | null) => {
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
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">جار تحميل العملاء...</div>
      </div>
    );
  }

  return (
    <>
      <main className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className={interactiveCard}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <span className={subduedText}>إجمالي العملاء</span>
                <span className="text-3xl font-semibold text-foreground">{total}</span>
              </div>
              <UsersIcon className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
          <Card className={interactiveCard}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <span className={subduedText}>المؤهلون</span>
                <span className="text-3xl font-semibold text-foreground">{qualified}</span>
              </div>
              <ListChecks className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
          <Card className={interactiveCard}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <span className={subduedText}>المغلقون</span>
                <span className="text-3xl font-semibold text-foreground">{closed}</span>
              </div>
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Client List */}
          <div className="lg:col-span-1">
            <Card className={cn("h-full", interactiveCard)}>
              <CardHeader className="sticky top-0 z-10 border-b border-border/50 bg-card/90 backdrop-blur">
                <div className="flex items-center justify-between">
                  <CardTitle>العملاء ({filteredLeads.length})</CardTitle>
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    <UserPlus className="ml-2" size={16} />
                    إضافة عميل
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-260px)] overflow-y-auto p-0">
                {filteredLeads.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {searchQuery ? "لا توجد عملاء تطابق بحثك." : "لا توجد عملاء."}
                  </div>
                ) : (
                  <div className="ui-data-list">
                    {filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className={cn(
                          "cursor-pointer p-4 transition-colors",
                          selectedLeadId === lead.id
                            ? "bg-primary/10 ring-1 ring-primary/50"
                            : "hover:bg-muted/60"
                        )}
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">
                            {lead.firstName} {lead.lastName}
                          </h4>
                          <Badge className={getStatusBadgeColor(lead.status)}>
                            {t(`status.${lead.status}`) || lead.status}
                          </Badge>
                        </div>

                        <p className="mb-1 text-sm text-muted-foreground">{lead.email}</p>
                        {lead.phone && (
                          <p className="text-sm text-muted-foreground/80">{lead.phone}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground/70">
                            {lead.interestType && `${t(`interest.${lead.interestType}`) || lead.interestType} • `}
                            {lead.budgetRange}
                          </span>
                          <span className="text-xs text-muted-foreground/70">
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
              <Card>
                <CardContent className="flex h-96 items-center justify-center">
                  <div className="space-y-2 text-center text-muted-foreground">
                    <MessageCircle size={48} className="mx-auto text-muted-foreground/40" />
                    <h3 className="text-lg font-medium text-foreground">اختر عميلاً</h3>
                    <p>اختر عميلاً من القائمة لعرض تفاصيله وتاريخ نشاطه.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardContent className="space-y-6 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-semibold text-foreground">
                          {selectedLead.firstName} {selectedLead.lastName}
                        </h2>
                        <p className="text-muted-foreground">{selectedLead.email}</p>
                        {selectedLead.phone && (
                          <p className="text-muted-foreground">{selectedLead.phone}</p>
                        )}
                      </div>
                      <Badge className={getStatusBadgeColor(selectedLead.status)}>
                        {selectedLead.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <span className="text-sm text-muted-foreground">مصدر العميل</span>
                        <p className="mt-1 font-medium text-foreground">
                          {selectedLead.leadSource || "غير محدد"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <span className="text-sm text-muted-foreground">نوع الاهتمام</span>
                        <p className="mt-1 font-medium text-foreground">
                          {selectedLead.interestType || "غير محدد"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <span className="text-sm text-muted-foreground">نطاق الميزانية</span>
                        <p className="mt-1 font-medium text-foreground">
                          {selectedLead.budgetRange || "غير محدد"}
                        </p>
                      </div>
                    </div>

                    {selectedLead.notes && (
                      <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
                        <span className="text-sm text-muted-foreground">ملاحظات</span>
                        <p className="mt-2 text-sm text-foreground/90">{selectedLead.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" className="bg-success text-white">
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

                <Card>
                  <Tabs defaultValue="activities" className="w-full">
                    <CardHeader className="border-b border-border/50">
                      <TabsList className="grid w-full grid-cols-3 bg-muted/40">
                        <TabsTrigger value="activities">الأنشطة</TabsTrigger>
                        <TabsTrigger value="notes">الملاحظات</TabsTrigger>
                        <TabsTrigger value="timeline">الخط الزمني</TabsTrigger>
                      </TabsList>
                    </CardHeader>

                    <TabsContent value="activities" className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">سجل الأنشطة</h3>
                        <Button size="sm" className="bg-primary text-primary-foreground">
                          <Plus className="ml-2" size={16} />
                          إضافة نشاط
                        </Button>
                      </div>

                      {!activities || activities.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">لا توجد أنشطة مسجلة لهذا العميل.</div>
                      ) : (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-border/40 bg-card/70 p-4 backdrop-blur">
                              <div className="flex-shrink-0 mt-1">
                                {getActivityIcon(activity.activityType)}
                              </div>
                              <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2 rtl:space-x-reverse">
                                  <h4 className="font-medium text-foreground">{activity.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.activityType}
                                  </Badge>
                                  {activity.completed && (
                                    <Badge className="bg-success/10 text-success text-xs">
                                      مكتمل
                                    </Badge>
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="mb-2 text-sm text-muted-foreground">{activity.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground/70 rtl:space-x-reverse">
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
                      <div className="py-8 text-center text-muted-foreground">ميزة الملاحظات ستتوفر قريبًا…</div>
                    </TabsContent>

                    <TabsContent value="timeline" className="p-6">
                      <div className="py-8 text-center text-muted-foreground">عرض الخط الزمني قريبًا…</div>
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
