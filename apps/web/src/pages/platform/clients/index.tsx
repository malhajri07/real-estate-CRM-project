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
import { useLocation } from "wouter";
import {
  Phone, Mail, Calendar, MessageCircle, Plus, Users as UsersIcon,
  ListChecks, CheckCircle2, UserPlus, Tag, DollarSign, Building2,
  Eye, Clock, TrendingUp, Star, Activity as ActivityIcon, FileText, Briefcase,
  Home, Heart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClientDetailSkeleton } from "@/components/skeletons/page-skeletons";
import { PAGE_WRAPPER, GRID_THREE_COL, TYPOGRAPHY } from "@/config/platform-theme";
import type { Lead, Activity } from "@shared/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  const [, setLocation] = useLocation();

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
      <div className={PAGE_WRAPPER}>
        <PageHeader
          title={"العملاء"}
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
      <div className={PAGE_WRAPPER}>
        <PageHeader
          title={"العملاء"}
          subtitle={t("clients.subtitle") || "إدارة العملاء ومتابعة أنشطتهم وتفاصيلهم"}
        />
        <ClientDetailSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
        <PageHeader
          title={"العملاء"}
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
                  <Button size="sm" onClick={() => setLocation("/home/platform/leads")}>
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
                            <h4 className="text-sm font-bold">
                              {lead.firstName} {lead.lastName}
                            </h4>
                            <Badge variant={getLeadStatusVariant(lead.status)}>
                              {t(`status.${lead.status}`) || lead.status}
                            </Badge>
                          </div>

                          <p className="mb-1 text-sm text-muted-foreground">{lead.email}</p>
                          {lead.phone && (
                            <p className="text-sm text-muted-foreground">{lead.phone}</p>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {lead.interestType && `${t(`interest.${lead.interestType}`) || lead.interestType} • `}
                              {lead.budgetRange}
                            </span>
                            <span className="text-xs text-muted-foreground">
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
                    <h3 className={cn(TYPOGRAPHY.sectionTitle, "text-end")}>اختر عميلاً</h3>
                    <p className="text-sm">اختر عميلاً من القائمة لعرض تفاصيله وتاريخ نشاطه.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardContent className="space-y-6 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-bold">
                          {selectedLead.firstName} {selectedLead.lastName}
                        </h2>
                        <p className="text-sm text-muted-foreground">{selectedLead.email}</p>
                        {selectedLead.phone && (
                          <p className="text-sm text-muted-foreground">{selectedLead.phone}</p>
                        )}
                      </div>
                      <Badge variant={getLeadStatusVariant(selectedLead.status)}>
                        {selectedLead.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <Card>
                        <CardContent className="p-4">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">مصدر العميل</span>
                          <p className="mt-1 text-sm font-medium">
                            {selectedLead.leadSource || "غير محدد"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">نوع الاهتمام</span>
                          <p className="mt-1 text-sm font-medium">
                            {selectedLead.interestType || "غير محدد"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">نطاق الميزانية</span>
                          <p className="mt-1 text-sm font-medium">
                            {selectedLead.budgetRange || "غير محدد"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {selectedLead.notes && (
                      <Card>
                        <CardContent className="p-4">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ملاحظات</span>
                          <p className="mt-2 text-sm">{selectedLead.notes}</p>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => {
                        if (selectedLead.phone) {
                          window.open(`tel:${selectedLead.phone}`, '_self');
                        }
                      }} disabled={!selectedLead.phone}>
                        <Phone className={"me-2"} size={16} />
                        اتصال
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        if (selectedLead.email) {
                          window.open(`mailto:${selectedLead.email}`, '_self');
                        }
                      }} disabled={!selectedLead.email}>
                        <Mail className={"me-2"} size={16} />
                        بريد
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setLocation("/home/platform/calendar")}>
                        <Calendar className={"me-2"} size={16} />
                        جدولة
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Value Indicator */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">تقييم العميل</h3>
                      <Badge variant={
                        selectedLead.status === "qualified" ? "success" :
                        selectedLead.status === "contacted" ? "info" :
                        selectedLead.status === "closed" ? "default" : "secondary"
                      }>
                        {selectedLead.status === "qualified" ? "عميل مؤهل" :
                         selectedLead.status === "contacted" ? "تم التواصل" :
                         selectedLead.status === "closed" ? "مغلق" : "جديد"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/30 rounded-xl">
                        <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">الميزانية</p>
                        <p className="text-sm font-bold">{selectedLead.budgetRange || "غير محدد"}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-xl">
                        <ActivityIcon className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">الأنشطة</p>
                        <p className="text-sm font-bold">{activities?.length || 0}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-xl">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">عمر العميل</p>
                        <p className="text-sm font-bold">
                          {Math.floor((Date.now() - new Date(selectedLead.createdAt).getTime()) / (1000 * 60 * 60 * 24))} يوم
                        </p>
                      </div>
                    </div>
                    {/* Score bar */}
                    {(() => {
                      let score = 30;
                      if (selectedLead.phone) score += 10;
                      if (selectedLead.email) score += 10;
                      if (selectedLead.budgetRange) score += 15;
                      if (selectedLead.interestType) score += 10;
                      if (selectedLead.city) score += 5;
                      if (selectedLead.status === "qualified") score += 20;
                      if (selectedLead.status === "contacted") score += 10;
                      score = Math.min(100, score);
                      return (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">درجة التأهيل</span>
                            <span className={cn(
                              "font-bold",
                              score >= 80 ? "text-primary" : score >= 50 ? "text-[hsl(var(--warning))]" : "text-accent-foreground"
                            )}>
                              {score}/100 ({score >= 80 ? "ساخن" : score >= 50 ? "دافئ" : "بارد"})
                            </span>
                          </div>
                          <Progress value={score} className="h-2" />
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Client Tags */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">العلامات والتصنيفات</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.interestType && (
                        <Badge variant="outline" className="rounded-full flex items-center gap-1">
                          <Home size={12} />
                          {selectedLead.interestType}
                        </Badge>
                      )}
                      {selectedLead.city && (
                        <Badge variant="outline" className="rounded-full flex items-center gap-1">
                          <Building2 size={12} />
                          {selectedLead.city}
                        </Badge>
                      )}
                      {selectedLead.leadSource && (
                        <Badge variant="outline" className="rounded-full flex items-center gap-1">
                          <Tag size={12} />
                          {selectedLead.leadSource}
                        </Badge>
                      )}
                      {selectedLead.status && (
                        <Badge variant={getLeadStatusVariant(selectedLead.status)} className="rounded-full">
                          {selectedLead.status}
                        </Badge>
                      )}
                      {selectedLead.budgetRange && (
                        <Badge variant="outline" className="rounded-full flex items-center gap-1">
                          <DollarSign size={12} />
                          {selectedLead.budgetRange}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <Tabs defaultValue="activities" className="w-full">
                    <CardHeader className="border-b">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="activities">الأنشطة</TabsTrigger>
                        <TabsTrigger value="timeline">الخط الزمني</TabsTrigger>
                        <TabsTrigger value="properties">العقارات</TabsTrigger>
                        <TabsTrigger value="communication">التواصل</TabsTrigger>
                        <TabsTrigger value="notes">الملاحظات</TabsTrigger>
                      </TabsList>
                    </CardHeader>

                    <TabsContent value="activities" className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className={cn(TYPOGRAPHY.sectionTitle, "text-end")}>{language === "ar" ? "سجل الأنشطة" : "Activity Log"}</h3>
                      <Button size="sm" onClick={() => setLocation("/home/platform/activities")}>
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
                                    <h4 className="text-sm font-bold">{activity.title}</h4>
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
                                    <p className="mb-2 text-sm text-muted-foreground">{activity.description}</p>
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

                    {/* Timeline Tab - Activity Timeline */}
                    <TabsContent value="timeline" className="p-6">
                      <h3 className={cn(TYPOGRAPHY.sectionTitle, "text-end", "mb-4")}>الخط الزمني</h3>
                      <div className="relative">
                        <div className="absolute start-5 top-0 bottom-0 w-px bg-border" />

                        {/* Creation event */}
                        <div className="relative flex gap-3 pb-6 ms-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary z-10">
                            <UserPlus size={16} />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-sm font-medium">تم إضافة العميل</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatAdminDate(selectedLead.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Activities on timeline */}
                        {activities && activities.length > 0 ? (
                          activities.map((activity) => (
                            <div key={activity.id} className="relative flex gap-3 pb-6 ms-1">
                              <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full z-10",
                                activity.completed
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {getActivityIcon(activity.activityType)}
                              </div>
                              <div className="flex-1 pt-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{activity.title}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.activityType}
                                  </Badge>
                                  {activity.completed && (
                                    <CheckCircle2 size={14} className="text-primary" />
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatAdminDate(activity.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="relative flex gap-3 pb-6 ms-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground z-10">
                              <Clock size={16} />
                            </div>
                            <div className="flex-1 pt-2">
                              <p className="text-sm text-muted-foreground">لا توجد أنشطة مسجلة بعد</p>
                            </div>
                          </div>
                        )}

                        {/* Status update event */}
                        {selectedLead.updatedAt !== selectedLead.createdAt && (
                          <div className="relative flex gap-3 pb-6 ms-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground z-10">
                              <TrendingUp size={16} />
                            </div>
                            <div className="flex-1 pt-1">
                              <p className="text-sm font-medium">تم تحديث بيانات العميل</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatAdminDate(selectedLead.updatedAt)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Properties Tab - Properties They've Viewed/Inquired About */}
                    <TabsContent value="properties" className="p-6">
                      <h3 className={cn(TYPOGRAPHY.sectionTitle, "text-end", "mb-4")}>العقارات المرتبطة</h3>
                      <div className="space-y-4">
                        {/* Placeholder for properties the client showed interest in */}
                        <div className="py-8 text-center text-muted-foreground">
                          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-medium mb-1">لا توجد عقارات مرتبطة</p>
                          <p className="text-xs text-muted-foreground mb-4">
                            سيظهر هنا العقارات التي أبدى العميل اهتماما بها أو استفسر عنها
                          </p>
                          <Button size="sm" variant="outline" onClick={() => setLocation("/home/platform/properties")}>
                            <Building2 size={14} className="me-2" />
                            تصفح العقارات
                          </Button>
                        </div>

                        <Separator />

                        {/* Interest Summary */}
                        <div>
                          <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">ملخص الاهتمامات</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Card>
                              <CardContent className="p-3">
                                <p className="text-xs text-muted-foreground">نوع الاهتمام</p>
                                <p className="text-sm font-bold mt-0.5">{selectedLead.interestType || "غير محدد"}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-3">
                                <p className="text-xs text-muted-foreground">نطاق الميزانية</p>
                                <p className="text-sm font-bold mt-0.5">{selectedLead.budgetRange || "غير محدد"}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-3">
                                <p className="text-xs text-muted-foreground">المدينة المفضلة</p>
                                <p className="text-sm font-bold mt-0.5">{selectedLead.city || "غير محدد"}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-3">
                                <p className="text-xs text-muted-foreground">العقارات المشاهدة</p>
                                <p className="text-sm font-bold mt-0.5">0</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Communication Tab - Communication Log */}
                    <TabsContent value="communication" className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className={cn(TYPOGRAPHY.sectionTitle, "text-end")}>سجل التواصل</h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            if (selectedLead.phone) window.open(`tel:${selectedLead.phone}`, '_self');
                          }} disabled={!selectedLead.phone}>
                            <Phone size={14} className="me-1" />
                            اتصال
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            if (selectedLead.email) window.open(`mailto:${selectedLead.email}`, '_self');
                          }} disabled={!selectedLead.email}>
                            <Mail size={14} className="me-1" />
                            بريد
                          </Button>
                        </div>
                      </div>

                      {/* Communication entries from activities */}
                      {(() => {
                        const commActivities = activities?.filter(
                          a => a.activityType === "call" || a.activityType === "email" || a.activityType === "meeting"
                        ) ?? [];

                        if (commActivities.length === 0) {
                          return (
                            <div className="py-8 text-center text-muted-foreground">
                              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                              <p className="text-sm font-medium mb-1">لا توجد سجلات تواصل</p>
                              <p className="text-xs text-muted-foreground">
                                قم بتسجيل المكالمات والرسائل والاجتماعات مع العميل
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {commActivities.map((activity) => (
                              <Card key={activity.id}>
                                <CardContent className="flex items-start gap-3 p-4">
                                  <div className={cn(
                                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full mt-1",
                                    activity.activityType === "call" ? "bg-accent text-accent-foreground" :
                                    activity.activityType === "email" ? "bg-secondary text-secondary-foreground" :
                                    "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
                                  )}>
                                    {getActivityIcon(activity.activityType)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-bold">{activity.title}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {activity.activityType === "call" ? "مكالمة" :
                                         activity.activityType === "email" ? "بريد إلكتروني" : "اجتماع"}
                                      </Badge>
                                      {activity.completed && (
                                        <Badge variant="success" className="text-xs">مكتمل</Badge>
                                      )}
                                    </div>
                                    {activity.description && (
                                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatAdminDate(activity.createdAt)}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Contact Summary */}
                      <Separator className="my-6" />
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">معلومات الاتصال</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 border border-border/50 rounded-xl">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                            <Phone size={14} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">الهاتف</p>
                            <p className="text-xs text-muted-foreground">{selectedLead.phone || "غير متوفر"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 border border-border/50 rounded-xl">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                            <Mail size={14} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">البريد الإلكتروني</p>
                            <p className="text-xs text-muted-foreground">{selectedLead.email || "غير متوفر"}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Notes Tab */}
                    <TabsContent value="notes" className="p-6">
                      <h3 className={cn(TYPOGRAPHY.sectionTitle, "text-end", "mb-4")}>الملاحظات</h3>
                      {selectedLead.notes ? (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                <FileText size={16} className="text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm leading-relaxed">{selectedLead.notes}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  آخر تحديث: {formatAdminDate(selectedLead.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-medium mb-1">لا توجد ملاحظات</p>
                          <p className="text-xs text-muted-foreground">
                            أضف ملاحظات حول هذا العميل لمتابعة أفضل
                          </p>
                        </div>
                      )}

                      {/* Preferences */}
                      {selectedLead.preferences && (
                        <>
                          <Separator className="my-4" />
                          <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">التفضيلات</h4>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">{selectedLead.preferences}</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
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
