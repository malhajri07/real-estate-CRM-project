/**
 * clients.tsx - Client Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → clients.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Client management page for authenticated users. Provides:
 * - Client listing and search
 * - Client information management
 * - Activity tracking
 * 
 * Route: /home/platform/clients or /clients
 * 
 * Related Files:
 * - apps/web/src/pages/customers.tsx - Customer management page
 */

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
import { BUTTON_PRIMARY_CLASSES, TYPOGRAPHY, PAGE_WRAPPER, CARD_STYLES, METRICS_CARD_STYLES, BADGE_STYLES, LOADING_STYLES, getLeadStatusBadge, ICON_CONTAINER_SM } from "@/config/platform-theme";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { t, dir } = useLanguage();

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
      <div className={LOADING_STYLES.container} dir={dir}>
        <div className={LOADING_STYLES.text}>جار تحميل العملاء...</div>
      </div>
    );
  }

  return (
    <>
      <main className={PAGE_WRAPPER} dir={dir}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className={METRICS_CARD_STYLES.container}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className={METRICS_CARD_STYLES.label}>إجمالي العملاء</span>
                <span className={METRICS_CARD_STYLES.value}>{total}</span>
              </div>
              <div className={METRICS_CARD_STYLES.icon}>
                <UsersIcon className="h-6 w-6" />
              </div>
            </div>
          </Card>
          <Card className={METRICS_CARD_STYLES.container}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className={METRICS_CARD_STYLES.label}>المؤهلون</span>
                <span className={METRICS_CARD_STYLES.value}>{qualified}</span>
              </div>
              <div className={METRICS_CARD_STYLES.icon}>
                <ListChecks className="h-6 w-6" />
              </div>
            </div>
          </Card>
          <Card className={METRICS_CARD_STYLES.container}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className={METRICS_CARD_STYLES.label}>المغلقون</span>
                <span className={METRICS_CARD_STYLES.value}>{closed}</span>
              </div>
              <div className={METRICS_CARD_STYLES.icon}>
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Client List */}
          <div className="lg:col-span-1">
            <Card className={cn("h-full", CARD_STYLES.container)}>
              <CardHeader className={cn(CARD_STYLES.header, "sticky top-0 z-10 border-b border-slate-200/60 bg-white/90 backdrop-blur")}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cn(TYPOGRAPHY.cardTitle, "text-end")}>العملاء ({filteredLeads.length})</CardTitle>
                  <Button size="sm" className={BUTTON_PRIMARY_CLASSES}>
                    <UserPlus className="ml-2" size={16} />
                    إضافة عميل
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-260px)] overflow-y-auto p-0">
                {filteredLeads.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
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
                            : "hover:bg-slate-50"
                        )}
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={cn(TYPOGRAPHY.body, "font-medium text-slate-900 text-end")}>
                            {lead.firstName} {lead.lastName}
                          </h4>
                          <Badge className={cn(BADGE_STYLES.base, getLeadStatusBadge(lead.status))}>
                            {t(`status.${lead.status}`) || lead.status}
                          </Badge>
                        </div>

                        <p className={cn("mb-1", TYPOGRAPHY.body, "text-slate-600 text-end")}>{lead.email}</p>
                        {lead.phone && (
                          <p className={cn(TYPOGRAPHY.body, "text-slate-600 text-end")}>{lead.phone}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className={cn(TYPOGRAPHY.caption, "text-slate-500 text-end")}>
                            {lead.interestType && `${t(`interest.${lead.interestType}`) || lead.interestType} • `}
                            {lead.budgetRange}
                          </span>
                          <span className={cn(TYPOGRAPHY.caption, "text-slate-500 text-end")}>
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
              <Card className={CARD_STYLES.container}>
                <CardContent className="flex h-96 items-center justify-center">
                  <div className="space-y-2 text-center text-slate-500">
                    <MessageCircle size={48} className="mx-auto text-slate-400/60" />
                    <h3 className={cn(TYPOGRAPHY.sectionTitle, "text-slate-900 text-end")}>اختر عميلاً</h3>
                    <p className={cn(TYPOGRAPHY.body, "text-slate-600 text-end")}>اختر عميلاً من القائمة لعرض تفاصيله وتاريخ نشاطه.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className={CARD_STYLES.container}>
                  <CardContent className="space-y-6 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <h2 className={cn(TYPOGRAPHY.pageTitle, "text-slate-900 text-end")}>
                          {selectedLead.firstName} {selectedLead.lastName}
                        </h2>
                        <p className={cn(TYPOGRAPHY.body, "text-slate-600 text-end")}>{selectedLead.email}</p>
                        {selectedLead.phone && (
                          <p className={cn(TYPOGRAPHY.body, "text-slate-600 text-end")}>{selectedLead.phone}</p>
                        )}
                      </div>
                      <Badge className={cn(BADGE_STYLES.base, getLeadStatusBadge(selectedLead.status))}>
                        {selectedLead.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <span className={cn(TYPOGRAPHY.label, "text-slate-600 text-end")}>مصدر العميل</span>
                        <p className={cn("mt-1", TYPOGRAPHY.body, "font-medium text-slate-900 text-end")}>
                          {selectedLead.leadSource || "غير محدد"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-end">
                        <span className={cn(TYPOGRAPHY.label, "text-slate-600 text-end")}>نوع الاهتمام</span>
                        <p className={cn("mt-1", TYPOGRAPHY.body, "font-medium text-slate-900 text-end")}>
                          {selectedLead.interestType || "غير محدد"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-end">
                        <span className={cn(TYPOGRAPHY.label, "text-slate-600 text-end")}>نطاق الميزانية</span>
                        <p className={cn("mt-1", TYPOGRAPHY.body, "font-medium text-slate-900 text-end")}>
                          {selectedLead.budgetRange || "غير محدد"}
                        </p>
                      </div>
                    </div>

                    {selectedLead.notes && (
                      <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
                        <span className={cn(TYPOGRAPHY.label, "text-slate-600 text-end")}>ملاحظات</span>
                        <p className={cn("mt-2", TYPOGRAPHY.body, "text-slate-700 text-end")}>{selectedLead.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" className={BUTTON_PRIMARY_CLASSES}>
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

                <Card className={CARD_STYLES.container}>
                  <Tabs defaultValue="activities" className="w-full">
                    <CardHeader className={cn(CARD_STYLES.header, "border-b border-slate-200/60")}>
                      <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                        <TabsTrigger value="activities">الأنشطة</TabsTrigger>
                        <TabsTrigger value="notes">الملاحظات</TabsTrigger>
                        <TabsTrigger value="timeline">الخط الزمني</TabsTrigger>
                      </TabsList>
                    </CardHeader>

                    <TabsContent value="activities" className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className={cn(TYPOGRAPHY.sectionTitle, "text-slate-900 text-end")}>سجل الأنشطة</h3>
                      <Button size="sm" className={BUTTON_PRIMARY_CLASSES}>
                        <Plus className="ml-2" size={16} />
                          إضافة نشاط
                        </Button>
                      </div>

                      {!activities || activities.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">لا توجد أنشطة مسجلة لهذا العميل.</div>
                      ) : (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-border/40 bg-card/70 p-4 backdrop-blur">
                              <div className={cn(ICON_CONTAINER_SM, "flex-shrink-0 mt-1")}>
                                {getActivityIcon(activity.activityType)}
                              </div>
                              <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2 rtl:space-x-reverse">
                                  <h4 className={cn(TYPOGRAPHY.body, "font-medium text-slate-900 text-end")}>{activity.title}</h4>
                                  <Badge variant="outline" className={cn(BADGE_STYLES.base, TYPOGRAPHY.caption)}>
                                    {activity.activityType}
                                  </Badge>
                                  {activity.completed && (
                                    <Badge className={cn(BADGE_STYLES.base, BADGE_STYLES.success, TYPOGRAPHY.caption)}>
                                      مكتمل
                                    </Badge>
                                  )}
                                </div>
                                {activity.description && (
                                  <p className={cn("mb-2", TYPOGRAPHY.body, "text-slate-600 text-end")}>{activity.description}</p>
                                )}
                                <div className={cn("flex items-center gap-4", TYPOGRAPHY.caption, "text-slate-500 text-end rtl:space-x-reverse")}>
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
                      <div className="py-8 text-center text-slate-500">ميزة الملاحظات ستتوفر قريبًا…</div>
                    </TabsContent>

                    <TabsContent value="timeline" className="p-6">
                      <div className="py-8 text-center text-slate-500">عرض الخط الزمني قريبًا…</div>
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
