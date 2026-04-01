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
import { useLanguage } from "@/contexts/LanguageContext";
import { ClientDetailSkeleton } from "@/components/skeletons/page-skeletons";
import { PAGE_WRAPPER, GRID_THREE_COL, TYPOGRAPHY } from "@/config/platform-theme";
import type { Lead, Activity } from "@shared/types";
import { cn } from "@/lib/utils";
import { getLeadStatusVariant } from "@/lib/status-variants";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/ui/empty-state";
import PageHeader from "@/components/ui/page-header";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { formatAdminDate } from "@/lib/formatters";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { t, dir, language } = useLanguage();
  const showSkeleton = useMinLoadTime();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const { data: leads, isLoading, isError, refetch } = useQuery<Lead[]>({
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

  if (isError) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader
          title={t("nav.clients") || "العملاء"}
          subtitle={t("clients.subtitle") || "إدارة العملاء ومتابعة أنشطتهم وتفاصيلهم"}
        />
        <QueryErrorFallback
          message={t("clients.load_error") || "فشل تحميل بيانات العملاء"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <ClientDetailSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader
          title={t("nav.clients") || "العملاء"}
          subtitle={t("clients.subtitle") || "إدارة العملاء ومتابعة أنشطتهم وتفاصيلهم"}
        />
        <div className={GRID_THREE_COL}>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{language === "ar" ? "إجمالي العملاء" : "Total Clients"}</span>
                <span className="block text-3xl font-bold">{total}</span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <UsersIcon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{language === "ar" ? "المؤهلون" : "Qualified"}</span>
                <span className="block text-3xl font-bold">{qualified}</span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <ListChecks className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{language === "ar" ? "المغلقون" : "Closed"}</span>
                <span className="block text-3xl font-bold">{closed}</span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Client List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-end">العملاء ({filteredLeads.length})</CardTitle>
                  <Button size="sm">
                    <UserPlus className={"me-2"} size={16} />
                    إضافة عميل
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-260px)]">
                  {filteredLeads.length === 0 ? (
                    <EmptyState
                      title={searchQuery ? "لا توجد عملاء تطابق بحثك" : "لا توجد عملاء"}
                    />
                  ) : (
                    <div className="ui-data-list">
                      {filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className={cn(
                            "cursor-pointer p-4 transition-colors",
                            selectedLeadId === lead.id
                              ? "bg-primary/10 ring-1 ring-primary/50"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => setSelectedLeadId(lead.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-end">
                              {lead.firstName} {lead.lastName}
                            </h4>
                            <Badge variant={getLeadStatusVariant(lead.status)}>
                              {t(`status.${lead.status}`) || lead.status}
                            </Badge>
                          </div>

                          <p className="mb-1 text-sm text-muted-foreground text-end">{lead.email}</p>
                          {lead.phone && (
                            <p className="text-sm text-muted-foreground text-end">{lead.phone}</p>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground text-end">
                              {lead.interestType && `${t(`interest.${lead.interestType}`) || lead.interestType} • `}
                              {lead.budgetRange}
                            </span>
                            <span className="text-xs text-muted-foreground text-end">
                              {formatAdminDate(lead.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-2">
            {!selectedLead ? (
              <Card>
                <CardContent className="flex h-96 items-center justify-center">
                  <div className="space-y-2 text-center text-muted-foreground">
                    <MessageCircle size={48} className="mx-auto opacity-40" />
                    <h3 className={`${TYPOGRAPHY.sectionTitle} text-end`}>اختر عميلاً</h3>
                    <p className="text-sm text-end">اختر عميلاً من القائمة لعرض تفاصيله وتاريخ نشاطه.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardContent className="space-y-6 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-end">
                          {selectedLead.firstName} {selectedLead.lastName}
                        </h2>
                        <p className="text-sm text-muted-foreground text-end">{selectedLead.email}</p>
                        {selectedLead.phone && (
                          <p className="text-sm text-muted-foreground text-end">{selectedLead.phone}</p>
                        )}
                      </div>
                      <Badge variant={getLeadStatusVariant(selectedLead.status)}>
                        {selectedLead.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <Card>
                        <CardContent className="p-4">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-end">مصدر العميل</span>
                          <p className="mt-1 text-sm font-medium text-end">
                            {selectedLead.leadSource || "غير محدد"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-end">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-end">نوع الاهتمام</span>
                          <p className="mt-1 text-sm font-medium text-end">
                            {selectedLead.interestType || "غير محدد"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-end">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-end">نطاق الميزانية</span>
                          <p className="mt-1 text-sm font-medium text-end">
                            {selectedLead.budgetRange || "غير محدد"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {selectedLead.notes && (
                      <Card>
                        <CardContent className="p-4">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-end">ملاحظات</span>
                          <p className="mt-2 text-sm text-end">{selectedLead.notes}</p>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm">
                        <Phone className={"me-2"} size={16} />
                        اتصال
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className={"me-2"} size={16} />
                        بريد
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className={"me-2"} size={16} />
                        جدولة
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <Tabs defaultValue="activities" className="w-full">
                    <CardHeader className="border-b">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="activities">الأنشطة</TabsTrigger>
                        <TabsTrigger value="notes">الملاحظات</TabsTrigger>
                        <TabsTrigger value="timeline">الخط الزمني</TabsTrigger>
                      </TabsList>
                    </CardHeader>

                    <TabsContent value="activities" className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className={`${TYPOGRAPHY.sectionTitle} text-end`}>{language === "ar" ? "سجل الأنشطة" : "Activity Log"}</h3>
                      <Button size="sm">
                        <Plus className={"me-2"} size={16} />
                          إضافة نشاط
                        </Button>
                      </div>

                      {!activities || activities.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">لا توجد أنشطة مسجلة لهذا العميل.</div>
                      ) : (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <Card key={activity.id}>
                              <CardContent className="flex items-start gap-3 p-4">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted mt-1">
                                  {getActivityIcon(activity.activityType)}
                                </div>
                                <div className="flex-1">
                                  <div className="mb-1 flex items-center gap-2 rtl:space-x-reverse">
                                    <h4 className="text-sm font-medium text-end">{activity.title}</h4>
                                    <Badge variant="outline">
                                      {activity.activityType}
                                    </Badge>
                                    {activity.completed && (
                                      <Badge variant="success">
                                        مكتمل
                                      </Badge>
                                    )}
                                  </div>
                                  {activity.description && (
                                    <p className="mb-2 text-sm text-muted-foreground text-end">{activity.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground text-end rtl:space-x-reverse">
                                    {activity.scheduledDate && (
                                      <span>
                                        مجدول: {new Date(activity.scheduledDate).toLocaleString(locale)}
                                      </span>
                                    )}
                                    <span>
                                      أُنشئ: {formatAdminDate(activity.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
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
    </div>
  );
}
