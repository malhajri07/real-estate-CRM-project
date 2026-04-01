import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Trash2, Edit, Eye, MessageCircle, Upload, Phone,
  SlidersHorizontal, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetFooter,
  SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import SendWhatsAppModal from "@/components/modals/send-whatsapp-modal";
import { CSVUploader } from "@/components/admin/data-display/CSVUploader";
import { Spinner } from "@/components/ui/spinner";
import { apiDelete, apiGet, apiPost } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import type { Lead } from "@shared/types";
import type { UploadResult } from "@uppy/core";
import { getLeadStatusVariant } from "@/lib/status-variants";
import { formatAdminDate } from "@/lib/formatters";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import {
  LEAD_STATUS_LABELS,
  INTEREST_TYPE_LABELS,
  MARITAL_STATUS_LABELS,
  getLabel,
} from "@/constants/labels";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";

const getStatusLabel = (status: string) => getLabel(LEAD_STATUS_LABELS, status);
const getInterestTypeLabel = (interestType: string) =>
  interestType ? (getLabel(INTEREST_TYPE_LABELS, interestType) || "غير محدد") : "غير محدد";
const getMaritalStatusLabel = (maritalStatus: string) =>
  maritalStatus ? (getLabel(MARITAL_STATUS_LABELS, maritalStatus) || "غير محدد") : "غير محدد";

const formatBudgetRange = (budgetRange?: string | null): string => {
  const rawValue = budgetRange ?? "";
  if (!rawValue.trim()) return "غير محدد";
  const normalized = rawValue.trim();

  const formatNumber = (numStr: string): string => {
    const num = parseInt(numStr.replace(/[,\s]/g, ""));
    if (isNaN(num)) return numStr;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString("en-US");
  };

  if (normalized.includes(" - ")) {
    const parts = normalized.split(" - ");
    const firstNum = formatNumber(parts[0]);
    const match = parts[1].match(/^([\d,\s]+)/);
    if (match) return `${firstNum} - ${formatNumber(match[1])}`;
  }

  const match = normalized.match(/^([\d,\s]+)/);
  if (match) return formatNumber(match[1]);
  return normalized;
};

export default function Contacts() {
  const { t, dir, language } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const showSkeleton = useMinLoadTime();

  // Quick View state
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");

  // Advanced View state
  const [advancedSearchQuery, setAdvancedSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [ageRangeFilter, setAgeRangeFilter] = useState("all");
  const [maritalStatusFilter, setMaritalStatusFilter] = useState("all");
  const [interestTypeFilter, setInterestTypeFilter] = useState("all");
  const [dependentsFilter, setDependentsFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Shared data query
  const { data: leads, isLoading, isError, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  // Quick View search query
  const { data: searchResults } = useQuery<Lead[]>({
    queryKey: ["/api/leads/search", quickSearchQuery],
    queryFn: () => apiGet<Lead[]>(`/api/leads/search?q=${encodeURIComponent(quickSearchQuery)}`),
    enabled: !!quickSearchQuery.trim(),
  });

  // Shared delete mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      toast({
        title: t("message.success") || "نجح",
        description: t("leads.delete_success") || "تم حذف العميل المحتمل بنجاح",
      });
    },
    onError: () => {
      toast({
        title: t("message.error") || "خطأ",
        description: t("leads.delete_error") || "فشل في حذف العميل المحتمل",
        variant: "destructive",
      });
    },
  });

  // CSV processing
  const csvProcessMutation = useMutation({
    mutationFn: async (csvUrl: string) => apiPost("/api/csv/process-leads", { csvUrl }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      if (data.results.errors.length > 0) {
        toast({
          title: t("leads.csv_partial_title"),
          description: `${data.message}. ${t("leads.csv_partial_description")}`,
          variant: "default",
        });
      } else {
        toast({ title: t("message.success"), description: data.message });
      }
    },
    onError: (error) => {
      toast({
        title: t("message.error"),
        description: error instanceof Error ? error.message : t("leads.csv_error"),
        variant: "destructive",
      });
    },
  });

  const handleCSVUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const csvUrl = result.successful[0].uploadURL;
      if (csvUrl) csvProcessMutation.mutate(csvUrl);
    }
  };

  const handleGetUploadParameters = async () => {
    const data = await apiPost<{ uploadURL: string }>("/api/csv/upload-url");
    return { method: "PUT" as const, url: data.uploadURL };
  };

  // Quick View helpers
  const quickDisplayLeads = quickSearchQuery.trim() ? searchResults : leads;

  const handleQuickDelete = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleSendWhatsApp = (lead: Lead) => {
    if (!lead.phone) {
      toast({
        title: t("message.error"),
        description: t("leads.no_phone_error"),
        variant: "destructive",
      });
      return;
    }
    setSelectedLead(lead);
    setWhatsappModalOpen(true);
  };

  const exportLeads = () => {
    if (!quickDisplayLeads || quickDisplayLeads.length === 0) {
      toast({
        title: t("leads.export_no_data_title"),
        description: t("leads.export_no_data_description"),
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ["الاسم الأول", "الاسم الأخير", "البريد الإلكتروني", "الهاتف", "الحالة", "مصدر العميل", "نوع الاهتمام", "نطاق الميزانية", "تاريخ الإنشاء"].join(","),
      ...quickDisplayLeads.map((lead) =>
        [
          lead.firstName, lead.lastName, lead.email, lead.phone || "",
          lead.status, lead.leadSource || "", lead.interestType || "",
          lead.budgetRange || "", formatAdminDate(lead.createdAt),
        ].map((field) => `"${field}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: t("message.success"), description: t("leads.export_success") });
  };

  // Advanced View filters
  const filteredLeads = leads?.filter((lead) => {
    if (advancedSearchQuery.trim()) {
      const query = advancedSearchQuery.toLowerCase();
      const matchesSearch =
        lead.firstName.toLowerCase().includes(query) ||
        lead.lastName.toLowerCase().includes(query) ||
        (lead.email ?? "").toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.city?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (cityFilter !== "all" && lead.city !== cityFilter) return false;
    if (ageRangeFilter !== "all" && lead.age) {
      const age = lead.age;
      switch (ageRangeFilter) {
        case "20-30": if (age < 20 || age > 30) return false; break;
        case "31-40": if (age < 31 || age > 40) return false; break;
        case "41-50": if (age < 41 || age > 50) return false; break;
        case "51+": if (age < 51) return false; break;
      }
    }
    if (maritalStatusFilter !== "all" && lead.maritalStatus !== maritalStatusFilter) return false;
    if (interestTypeFilter !== "all" && lead.interestType !== interestTypeFilter) return false;
    if (dependentsFilter !== "all") {
      const deps = lead.numberOfDependents || 0;
      switch (dependentsFilter) {
        case "0": if (deps !== 0) return false; break;
        case "1-2": if (deps < 1 || deps > 2) return false; break;
        case "3+": if (deps < 3) return false; break;
      }
    }
    return true;
  }) || [];

  const uniqueCities = Array.from(new Set(leads?.map((l) => l.city).filter(Boolean))) as string[];
  const uniqueStatuses = Array.from(new Set(leads?.map((l) => l.status))) as string[];
  const uniqueMaritalStatuses = Array.from(new Set(leads?.map((l) => l.maritalStatus).filter(Boolean))) as string[];
  const uniqueInterestTypes = Array.from(new Set(leads?.map((l) => l.interestType).filter(Boolean))) as string[];

  const resetFilters = () => {
    setStatusFilter("all");
    setCityFilter("all");
    setAgeRangeFilter("all");
    setMaritalStatusFilter("all");
    setInterestTypeFilter("all");
    setDependentsFilter("all");
    setAdvancedSearchQuery("");
    setCurrentPage(1);
  };

  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageLeads = filteredLeads.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleAdvancedDelete = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (leadToDelete) {
      deleteLeadMutation.mutate(leadToDelete.id);
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  // Error state
  if (isError) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title={t("contacts.title") || "جهات الاتصال"} />
        <QueryErrorFallback
          message={t("contacts.load_error") || t("leads.load_error") || "Failed to load contacts."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Loading state
  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <PageHeader title={t("contacts.title") || "جهات الاتصال"} />
        <TableSkeleton rows={6} cols={9} />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader
        title={t("contacts.title") || "جهات الاتصال"}
        subtitle={t("contacts.subtitle") || "إدارة العملاء المحتملين"}
      >
        <div className="flex items-center gap-2">
          <CSVUploader
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleCSVUploadComplete}
            buttonClassName="bg-primary/10 hover:bg-primary/10"
          >
            <Upload className="me-2" size={16} />
            {t("leads.upload_csv") || "رفع CSV"}
          </CSVUploader>
          <Button variant="outline" onClick={exportLeads}>
            {t("leads.export_csv") || "تصدير CSV"}
          </Button>
        </div>
      </PageHeader>

      {csvProcessMutation.isPending && (
        <Alert className="mb-4">
          <AlertDescription className="flex items-center gap-3">
            <Spinner size="sm" className="me-2" />
            {t("leads.csv_processing") || "جاري معالجة ملف CSV..."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="quick" className="w-full">
        <TabsList>
          <TabsTrigger value="quick">
            {t("contacts.quick_view") || "عرض سريع"}
          </TabsTrigger>
          <TabsTrigger value="advanced">
            {t("contacts.advanced_view") || "عرض متقدم"}
          </TabsTrigger>
        </TabsList>

        {/* ───── Quick View Tab ───── */}
        <TabsContent value="quick">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("leads.all_leads") || "جميع العملاء المحتملين"} ({quickDisplayLeads?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!quickDisplayLeads || quickDisplayLeads.length === 0 ? (
                <EmptyState
                  title={quickSearchQuery
                    ? (t("leads.no_results") || "لا توجد نتائج")
                    : (t("leads.no_leads") || "لا توجد عملاء محتملين")}
                />
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-end">{t("leads.table.name") || "الاسم"}</TableHead>
                      <TableHead className="text-end">{t("leads.table.email") || "البريد الإلكتروني"}</TableHead>
                      <TableHead className="text-end">{t("leads.table.phone") || "الهاتف"}</TableHead>
                      <TableHead className="text-end">{t("leads.table.status") || "الحالة"}</TableHead>
                      <TableHead className="text-end">{t("leads.table.source") || "المصدر"}</TableHead>
                      <TableHead className="text-end">{t("leads.table.interest") || "الاهتمام"}</TableHead>
                      <TableHead className="text-end">{t("leads.table.budget") || "الميزانية"}</TableHead>
                      <TableHead className="text-end">{t("leads.table.created_at") || "تاريخ الإنشاء"}</TableHead>
                      <TableHead className="text-end w-[160px]">{t("leads.table.actions") || "الإجراءات"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quickDisplayLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="text-end font-medium">
                          {lead.firstName} {lead.lastName}
                        </TableCell>
                        <TableCell className="text-end">{lead.email}</TableCell>
                        <TableCell className="text-end">{lead.phone || "-"}</TableCell>
                        <TableCell className="text-end">
                          <Badge variant={getLeadStatusVariant(lead.status)}>
                            {t(`status.${lead.status}`) || lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">{lead.leadSource || "-"}</TableCell>
                        <TableCell className="text-end">
                          {lead.interestType ? (t(`interest.${lead.interestType}`) || lead.interestType) : "-"}
                        </TableCell>
                        <TableCell className="text-end">{lead.budgetRange || "-"}</TableCell>
                        <TableCell className="text-end">{formatAdminDate(lead.createdAt)}</TableCell>
                        <TableCell className="text-end">
                          <div className="flex items-center gap-2">
                            {lead.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSendWhatsApp(lead)}
                                title={t("whatsapp.send_message") || "إرسال واتساب"}
                              >
                                <MessageCircle size={16} />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon">
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuickDelete(lead)}
                              disabled={deleteLeadMutation.isPending}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Advanced View Tab ───── */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>
                  {t("contacts.all_customers") || "جميع العملاء المحتملين"} ({totalItems})
                  {totalPages > 1 && ` - ${t("contacts.page") || "صفحة"} ${currentPage} ${t("contacts.of") || "من"} ${totalPages}`}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal size={16} className="me-2" />
                    {t("contacts.filters") || "الفلاتر"}
                  </Button>
                </div>
              </div>

              {showFilters && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-foreground">{t("contacts.search_filters") || "فلاتر البحث"}</h3>
                      <Button variant="default" size="sm" onClick={resetFilters}>
                        {t("contacts.reset") || "إعادة تعيين"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <div className="space-y-2">
                        <Label>{t("contacts.filter_status") || "الحالة"}</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger><SelectValue placeholder={t("contacts.select_status") || "اختر الحالة"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("contacts.all_statuses") || "جميع الحالات"}</SelectItem>
                            {uniqueStatuses.map((s) => (
                              <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("contacts.filter_city") || "المدينة"}</Label>
                        <Select value={cityFilter} onValueChange={setCityFilter}>
                          <SelectTrigger><SelectValue placeholder={t("contacts.select_city") || "اختر المدينة"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("contacts.all_cities") || "جميع المدن"}</SelectItem>
                            {uniqueCities.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("contacts.filter_age") || "العمر"}</Label>
                        <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                          <SelectTrigger><SelectValue placeholder={t("contacts.select_age") || "اختر الفئة العمرية"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("contacts.all_ages") || "جميع الأعمار"}</SelectItem>
                            <SelectItem value="20-30">20-30 {t("contacts.years") || "سنة"}</SelectItem>
                            <SelectItem value="31-40">31-40 {t("contacts.years") || "سنة"}</SelectItem>
                            <SelectItem value="41-50">41-50 {t("contacts.years") || "سنة"}</SelectItem>
                            <SelectItem value="51+">51+ {t("contacts.years") || "سنة"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("contacts.filter_marital") || "الحالة الاجتماعية"}</Label>
                        <Select value={maritalStatusFilter} onValueChange={setMaritalStatusFilter}>
                          <SelectTrigger><SelectValue placeholder={t("contacts.select_marital") || "اختر الحالة"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("contacts.all_statuses") || "جميع الحالات"}</SelectItem>
                            {uniqueMaritalStatuses.map((s) => (
                              <SelectItem key={s} value={s}>{getMaritalStatusLabel(s)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("contacts.filter_interest") || "نوع الاهتمام"}</Label>
                        <Select value={interestTypeFilter} onValueChange={setInterestTypeFilter}>
                          <SelectTrigger><SelectValue placeholder={t("contacts.select_interest") || "اختر النوع"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("contacts.all_types") || "جميع الأنواع"}</SelectItem>
                            {uniqueInterestTypes.map((type) => (
                              <SelectItem key={type} value={type}>{getInterestTypeLabel(type)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("contacts.filter_dependents") || "عدد المُعالين"}</Label>
                        <Select value={dependentsFilter} onValueChange={setDependentsFilter}>
                          <SelectTrigger><SelectValue placeholder={t("contacts.select_dependents") || "اختر العدد"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("contacts.all_counts") || "جميع الأعداد"}</SelectItem>
                            <SelectItem value="0">{t("contacts.none") || "لا يوجد"}</SelectItem>
                            <SelectItem value="1-2">1-2</SelectItem>
                            <SelectItem value="3+">{t("contacts.three_plus") || "3 أو أكثر"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {totalItems === 0 ? (
                <EmptyState
                  title={
                    advancedSearchQuery || showFilters
                      ? (t("contacts.no_filter_results") || "لا توجد عملاء يطابقون الفلاتر المحددة")
                      : (t("contacts.no_customers") || "لا توجد عملاء محتملين")
                  }
                  description={
                    advancedSearchQuery || showFilters
                      ? undefined
                      : (t("contacts.add_first") || "أضف أول عميل للبدء.")
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-end">{t("contacts.table.customer") || "العميل"}</TableHead>
                        <TableHead className="text-end">{t("contacts.table.city") || "المدينة"}</TableHead>
                        <TableHead className="text-end">{t("contacts.table.age") || "العمر"}</TableHead>
                        <TableHead className="text-end">{t("contacts.table.marital") || "الحالة الاجتماعية"}</TableHead>
                        <TableHead className="text-end">{t("contacts.table.dependents") || "المُعالين"}</TableHead>
                        <TableHead className="text-end">{t("contacts.table.interest") || "نوع الاهتمام"}</TableHead>
                        <TableHead className="text-end">{t("contacts.table.budget") || "نطاق الميزانية"}</TableHead>
                        <TableHead className="text-end">{t("contacts.table.status") || "الحالة"}</TableHead>
                        <TableHead className="text-end">{t("contacts.table.joined") || "تاريخ الانضمام"}</TableHead>
                        <TableHead className="text-end">{t("contacts.table.actions") || "الإجراءات"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPageLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="font-bold">{lead.firstName} {lead.lastName}</div>
                            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                              <Phone size={12} />
                              <span>{lead.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-end">{lead.city || (t("contacts.unspecified") || "غير محدد")}</TableCell>
                          <TableCell className="text-end">{lead.age || (t("contacts.unspecified") || "غير محدد")}</TableCell>
                          <TableCell className="text-end">{getMaritalStatusLabel(lead.maritalStatus || "")}</TableCell>
                          <TableCell className="text-end">{lead.numberOfDependents || 0}</TableCell>
                          <TableCell className="text-end">{getInterestTypeLabel(lead.interestType || "")}</TableCell>
                          <TableCell className="text-end">{formatBudgetRange(lead.budgetRange)}</TableCell>
                          <TableCell className="text-end">
                            <Badge variant={getLeadStatusVariant(lead.status)}>
                              {getStatusLabel(lead.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end">{formatAdminDate(lead.createdAt)}</TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" title={t("contacts.call") || "اتصال"}>
                                <Phone size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" title={t("contacts.edit") || "تعديل"}>
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAdvancedDelete(lead)}
                                title={t("contacts.delete") || "حذف"}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {t("contacts.showing") || "عرض"} {startIndex + 1} {t("contacts.to") || "إلى"} {Math.min(endIndex, totalItems)} {t("contacts.of") || "من"} {totalItems} {t("contacts.customer_count") || "عميل"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          {t("contacts.previous") || "السابق"}
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          {t("contacts.next") || "التالي"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Sheet (shared by both tabs) */}
      <Sheet open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-end">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t("contacts.confirm_delete_title") || "تأكيد الحذف"}
            </SheetTitle>
            <SheetDescription className="text-end pt-2" asChild>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  {t("contacts.confirm_delete_message") || "هل أنت متأكد من حذف العميل التالي؟"}
                </p>
                {leadToDelete && (
                  <Card>
                    <CardContent className="p-3 text-sm">
                      <div className="font-medium">
                        {leadToDelete.firstName} {leadToDelete.lastName}
                      </div>
                      <div className="text-muted-foreground mt-1">
                        {leadToDelete.phone}
                      </div>
                      <div className="text-muted-foreground">
                        {leadToDelete.city || (t("contacts.unspecified") || "غير محدد")}
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Alert variant="destructive">
                  <AlertTitle>
                    {t("contacts.warning") || "⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه"}
                  </AlertTitle>
                  <AlertDescription>
                    {t("contacts.delete_permanent") || "سيتم حذف جميع بيانات العميل نهائياً من النظام"}
                  </AlertDescription>
                </Alert>
              </div>
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteDialogOpen(false)}>
              {t("contacts.cancel") || "إلغاء"}
            </Button>
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLeadMutation.isPending}
            >
              {deleteLeadMutation.isPending
                ? (t("contacts.deleting") || "جاري الحذف...")
                : (t("contacts.confirm_delete") || "تأكيد الحذف")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* WhatsApp Modal */}
      {selectedLead && (
        <SendWhatsAppModal
          open={whatsappModalOpen}
          onOpenChange={setWhatsappModalOpen}
          leadId={selectedLead.id}
          phoneNumber={selectedLead.phone || ""}
          leadName={`${selectedLead.firstName} ${selectedLead.lastName}`}
        />
      )}
    </div>
  );
}
