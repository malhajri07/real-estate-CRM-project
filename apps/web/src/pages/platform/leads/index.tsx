import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Trash2, Edit, Eye, MessageCircle, Upload, Phone,
  SlidersHorizontal, AlertTriangle, Mail, Calendar,
  Clock, Star, TrendingUp, Activity, FileText,
  CheckCircle2, XCircle, ArrowRightCircle, User,
  Gauge, Briefcase, Plus, Save, Send, ArrowRight, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import SendWhatsAppModal from "@/components/modals/send-whatsapp-modal";
import { CSVUploader } from "@/components/admin/data-display/CSVUploader";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import type { Lead, Activity as ActivityType } from "@shared/types";
import type { UploadResult } from "@uppy/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { getLeadStatusVariant } from "@/lib/status-variants";
import { formatAdminDate } from "@/lib/formatters";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { LeadsSkeleton } from "@/components/skeletons/page-skeletons";
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

  const [, setLocation] = useLocation();

  // Lead Detail Drawer state
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [detailTab, setDetailTab] = useState("info");

  // Quick View state
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

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

  // Create/Edit lead state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const leadSchema = z.object({
    firstName: z.string().min(1, "الاسم الأول مطلوب"),
    lastName: z.string().min(1, "اسم العائلة مطلوب"),
    phone: z.string().optional(),
    email: z.string().email("بريد غير صالح").optional().or(z.literal("")),
    city: z.string().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
  });

  const createForm = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", email: "", city: "", source: "", notes: "", status: "NEW" },
  });

  const editForm = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", email: "", city: "", source: "", notes: "", status: "" },
  });

  // Shared data query
  const { data: leads, isLoading, isError, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  // Activities for detail drawer
  const { data: detailActivities } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities/lead", detailLead?.id],
    enabled: !!detailLead?.id && detailDrawerOpen,
  });

  // Deals for detail drawer
  const { data: allDeals } = useQuery<any[]>({
    queryKey: ["/api/deals"],
    enabled: detailDrawerOpen && detailTab === "deals",
  });
  const leadDeals = (allDeals || []).filter((d: any) => d.leadId === detailLead?.id || d.customerId === detailLead?.customerId);

  const openLeadDetail = (lead: Lead) => {
    setDetailLead(lead);
    setDetailTab("info");
    setDetailDrawerOpen(true);
  };

  const getLeadScore = (lead: Lead): { score: number; label: string; color: string } => {
    let score = 30; // base score
    if (lead.phone) score += 10;
    if (lead.email) score += 10;
    if (lead.budgetRange) score += 15;
    if (lead.interestType) score += 10;
    if (lead.city) score += 5;
    if (lead.status === "qualified") score += 20;
    if (lead.status === "contacted") score += 10;
    score = Math.min(100, score);
    if (score >= 80) return { score, label: "ساخن", color: "text-primary" };
    if (score >= 50) return { score, label: "دافئ", color: "text-[hsl(var(--warning))]" };
    return { score, label: "بارد", color: "text-accent-foreground" };
  };

  const getActivityIcon = (type?: string | null) => {
    switch (type) {
      case "call": return <Phone size={14} />;
      case "email": return <Mail size={14} />;
      case "meeting": return <Calendar size={14} />;
      case "showing": return <Calendar size={14} />;
      default: return <MessageCircle size={14} />;
    }
  };

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
        title: "نجح",
        description: "تم حذف العميل المحتمل بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف العميل المحتمل",
        variant: "destructive",
      });
    },
  });

  // Create lead
  const createLeadMutation = useMutation({
    mutationFn: (data: z.infer<typeof leadSchema>) => apiPost("/api/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setCreateOpen(false);
      createForm.reset();
      toast({ title: "تم إنشاء العميل المحتمل بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في إنشاء العميل", variant: "destructive" }),
  });

  // Update lead
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiPut(`/api/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setEditOpen(false);
      setDetailDrawerOpen(false);
      toast({ title: "تم تحديث بيانات العميل" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في تحديث البيانات", variant: "destructive" }),
  });

  // Update lead status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiPut(`/api/leads/${id}`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      if (detailLead) setDetailLead({ ...detailLead, status } as Lead);
      toast({ title: "تم تحديث الحالة", description: getStatusLabel(status) });
    },
  });

  // Add note to lead
  const addNoteMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => apiPut(`/api/leads/${id}`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setNoteText("");
      toast({ title: "تم إضافة الملاحظة" });
    },
  });

  // Convert lead to deal
  const convertToDealMutation = useMutation({
    mutationFn: (lead: Lead) => apiPost("/api/deals", {
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone || undefined,
      email: lead.email || undefined,
      source: lead.leadSource || "lead_conversion",
      notes: `تم التحويل من العميل المحتمل: ${lead.firstName} ${lead.lastName}`,
      stage: "NEW",
      leadId: lead.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setDetailDrawerOpen(false);
      toast({ title: "تم التحويل", description: "تم إنشاء صفقة جديدة في المسار" });
      setLocation("/home/platform/pipeline");
    },
    onError: () => toast({ title: "خطأ", description: "فشل في تحويل العميل إلى صفقة", variant: "destructive" }),
  });

  const createDealFromLead = (lead: Lead) => {
    convertToDealMutation.mutate(lead);
  };

  // Open edit form with lead data
  const openEditForm = (lead: Lead) => {
    setDetailLead(lead);
    editForm.reset({
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      phone: lead.phone || "",
      email: lead.email || "",
      city: lead.city || "",
      source: lead.leadSource || "",
      notes: lead.notes || "",
      status: lead.status || "",
    });
    setEditOpen(true);
  };

  // CSV processing
  const csvProcessMutation = useMutation({
    mutationFn: async (csvUrl: string) => apiPost("/api/csv/process-leads", { csvUrl }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      if (data.results.errors.length > 0) {
        toast({
          title: "تحميل جزئي",
          description: `${data.message}. ${"تم استيراد بعض البيانات مع وجود أخطاء"}`,
          variant: "default",
        });
      } else {
        toast({ title: "نجح", description: data.message });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل استيراد البيانات",
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
        title: "خطأ",
        description: "لا يوجد رقم هاتف لهذا العميل",
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
        title: "لا توجد بيانات",
        description: "لا توجد بيانات للتصدير",
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
    toast({ title: "نجح", description: "تم تصدير البيانات بنجاح" });
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
      <div className={PAGE_WRAPPER}>
        <PageHeader title="جهات الاتصال" />
        <QueryErrorFallback
          message={"فشل تحميل جهات الاتصال"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Loading state
  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="جهات الاتصال" />
        <LeadsSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader
        title="جهات الاتصال"
        subtitle="إدارة العملاء المحتملين"
      >
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => { createForm.reset(); setCreateOpen(true); }}>
            <Plus className="me-1.5" size={16} />
            إضافة عميل
          </Button>
          <CSVUploader
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleCSVUploadComplete}
            buttonClassName="bg-primary/10 hover:bg-primary/10"
          >
            <Upload className="me-2" size={16} />
            {"رفع CSV"}
          </CSVUploader>
          <Button variant="outline" onClick={exportLeads}>
            {"تصدير CSV"}
          </Button>
        </div>
      </PageHeader>

      {csvProcessMutation.isPending && (
        <Alert className="mb-4">
          <AlertDescription className="space-y-2">
            <div className="flex items-center gap-3">
              <Spinner size="sm" className="me-2" />
              جاري معالجة ملف CSV...
            </div>
            <Progress value={undefined} className="h-2" />
          </AlertDescription>
        </Alert>
      )}

      {/* ───── Search + Filter bar ───── */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، الهاتف، البريد، المدينة..."
              value={advancedSearchQuery}
              onChange={(e) => { setAdvancedSearchQuery(e.target.value); setCurrentPage(1); }}
              className="ps-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={16} />
            الفلاتر
            {(statusFilter !== "all" || cityFilter !== "all" || interestTypeFilter !== "all") && (
              <Badge variant="default" className="text-[10px] px-1.5 h-5">
                {[statusFilter !== "all", cityFilter !== "all", ageRangeFilter !== "all", maritalStatusFilter !== "all", interestTypeFilter !== "all", dependentsFilter !== "all"].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
      </Card>

      {/* Inline filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">فلاتر البحث</h3>
              <Button variant="ghost" size="sm" onClick={resetFilters}>إعادة تعيين</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">الحالة</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {uniqueStatuses.map((s) => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">المدينة</Label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {uniqueCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الاهتمام</Label>
                <Select value={interestTypeFilter} onValueChange={setInterestTypeFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {uniqueInterestTypes.map((type) => <SelectItem key={type} value={type}>{getInterestTypeLabel(type)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">العمر</Label>
                <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="20-30">20-30</SelectItem>
                    <SelectItem value="31-40">31-40</SelectItem>
                    <SelectItem value="41-50">41-50</SelectItem>
                    <SelectItem value="51+">51+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الحالة الاجتماعية</Label>
                <Select value={maritalStatusFilter} onValueChange={setMaritalStatusFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {uniqueMaritalStatuses.map((s) => <SelectItem key={s} value={s}>{getMaritalStatusLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">المُعالين</Label>
                <Select value={dependentsFilter} onValueChange={setDependentsFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="0">لا يوجد</SelectItem>
                    <SelectItem value="1-2">1-2</SelectItem>
                    <SelectItem value="3+">3+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ───── Single Unified Table ───── */}
      <Card>
        <CardContent className="p-0">
              {totalItems === 0 ? (
                <EmptyState
                  title={
                    advancedSearchQuery || showFilters
                      ? ("لا توجد عملاء يطابقون الفلاتر المحددة")
                      : ("لا توجد عملاء محتملين")
                  }
                  description={
                    advancedSearchQuery || showFilters
                      ? undefined
                      : ("أضف أول عميل للبدء.")
                  }
                />
              ) : (
                <>
                  {/* Bulk action bar */}
                  {selectedLeadIds.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg mb-3">
                      <span className="text-sm font-bold">{selectedLeadIds.length} محدد</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { toast({ title: "تعيين جماعي — قريباً" }); }}>تعيين لوسيط</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { toast({ title: "إضافة لحملة — قريباً" }); }}>إضافة لحملة</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setSelectedLeadIds([])}>إلغاء التحديد</Button>
                    </div>
                  )}

                  <div className="overflow-x-auto -mx-0">
                  <Table className="min-w-[900px] [&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-1.5 [&_th]:h-9">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox checked={selectedLeadIds.length === currentPageLeads.length && currentPageLeads.length > 0} onCheckedChange={(checked) => { if (checked) setSelectedLeadIds(currentPageLeads.map((l) => l.id)); else setSelectedLeadIds([]); }} />
                        </TableHead>
                        <TableHead className="w-[100px]">الإجراءات</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>الجودة</TableHead>
                        <TableHead>المصدر</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>نوع الاهتمام</TableHead>
                        <TableHead>الميزانية</TableHead>
                        <TableHead>المدينة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPageLeads.map((lead) => (
                        <TableRow key={lead.id} className={selectedLeadIds.includes(lead.id) ? "bg-primary/5" : ""}>
                          <TableCell>
                            <Checkbox checked={selectedLeadIds.includes(lead.id)} onCheckedChange={(checked) => { if (checked) setSelectedLeadIds((prev) => [...prev, lead.id]); else setSelectedLeadIds((prev) => prev.filter((id) => id !== lead.id)); }} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon"><Phone size={16} /></Button>
                                </TooltipTrigger>
                                <TooltipContent>اتصال</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openEditForm(lead)}><Edit size={16} /></Button>
                                </TooltipTrigger>
                                <TooltipContent>تعديل</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleAdvancedDelete(lead)}>
                                    <Trash2 size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>حذف</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="cursor-pointer hover:underline" onClick={() => openLeadDetail(lead)}>
                              <div className="font-bold text-sm">{lead.firstName} {lead.lastName}</div>
                              <div className="text-xs text-muted-foreground">{lead.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const score = (lead as any).leadScore ?? 0;
                              const color = score >= 80 ? "bg-primary text-primary-foreground" : score >= 50 ? "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground,#fff))]" : "bg-destructive text-destructive-foreground";
                              return <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${color}`}>{score}</span>;
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const src = lead.source || (lead as any).leadSource || "";
                              const sourceConfig: Record<string, { label: string; color: string }> = {
                                WEBSITE: { label: "الموقع", color: "bg-primary/10 text-primary" },
                                REFERRAL: { label: "إحالة", color: "bg-accent text-accent-foreground" },
                                CHATBOT: { label: "شات بوت", color: "bg-purple-100 text-purple-700" },
                                PHONE: { label: "اتصال", color: "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]" },
                                SOCIAL_MEDIA: { label: "تواصل", color: "bg-blue-100 text-blue-700" },
                                WALK_IN: { label: "زيارة", color: "bg-muted text-muted-foreground" },
                              };
                              const cfg = sourceConfig[src.toUpperCase()] || { label: src || "—", color: "bg-muted text-muted-foreground" };
                              return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>;
                            })()}
                          </TableCell>
                          <TableCell><Badge variant={getLeadStatusVariant(lead.status)}>{getStatusLabel(lead.status)}</Badge></TableCell>
                          <TableCell>{getInterestTypeLabel(lead.interestType || "")}</TableCell>
                          <TableCell className="tabular-nums">{formatBudgetRange(lead.budgetRange)}</TableCell>
                          <TableCell>{lead.city || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatAdminDate(lead.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        عرض" {startIndex + 1} "إلى" {Math.min(endIndex, totalItems)} "من" {totalItems} "عميل
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
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
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  isActive={pageNum === currentPage}
                                  onClick={() => handlePageChange(pageNum)}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

      {/* Delete Confirmation Sheet */}
      <Sheet open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              تأكيد الحذف
            </SheetTitle>
            <SheetDescription className="pt-2" asChild>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  هل أنت متأكد من حذف العميل التالي؟
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
                        {leadToDelete.city || ("غير محدد")}
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Alert variant="destructive">
                  <AlertTitle>
                    "⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه"
                  </AlertTitle>
                  <AlertDescription>
                    سيتم حذف جميع بيانات العميل نهائياً من النظام
                  </AlertDescription>
                </Alert>
              </div>
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLeadMutation.isPending}
            >
              {deleteLeadMutation.isPending
                ? ("جاري الحذف...")
                : ("تأكيد الحذف")}
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

      {/* ── Lead Detail Drawer ──────────────────────────────────────── */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent side="right" className="w-full max-w-lg flex flex-col p-0">
          {detailLead && (
            <>
              {/* Header */}
              <div className="p-6 border-b bg-muted/30">
                <SheetHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <SheetTitle className="text-xl">
                        {detailLead.firstName} {detailLead.lastName}
                      </SheetTitle>
                      <SheetDescription className="space-y-1">
                        <span className="block">{detailLead.email || "لا يوجد بريد"}</span>
                        <span className="block">{detailLead.phone || "لا يوجد هاتف"}</span>
                      </SheetDescription>
                    </div>
                    <Badge variant={getLeadStatusVariant(detailLead.status)} className="text-sm px-3 py-1">
                      {getStatusLabel(detailLead.status)}
                    </Badge>
                  </div>
                </SheetHeader>

                {/* Lead Score */}
                {(() => {
                  const scoreInfo = getLeadScore(detailLead);
                  return (
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Gauge size={16} className={scoreInfo.color} />
                        <span className={cn("text-sm font-bold", scoreInfo.color)}>
                          تقييم العميل: {scoreInfo.score}/100 ({scoreInfo.label})
                        </span>
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            scoreInfo.score >= 80 ? "bg-primary/100" :
                            scoreInfo.score >= 50 ? "bg-[hsl(var(--warning))]" : "bg-accent"
                          )}
                          style={{ width: `${scoreInfo.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Quick Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      if (detailLead.phone) window.open(`tel:${detailLead.phone}`, '_self');
                    }}
                    disabled={!detailLead.phone}
                  >
                    <Phone size={14} className="me-1" />
                    اتصال
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (detailLead.phone) {
                        setSelectedLead(detailLead);
                        setWhatsappModalOpen(true);
                        setDetailDrawerOpen(false);
                      }
                    }}
                    disabled={!detailLead.phone}
                  >
                    <MessageCircle size={14} className="me-1" />
                    واتساب
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (detailLead.email) window.open(`mailto:${detailLead.email}`, '_self');
                    }}
                    disabled={!detailLead.email}
                  >
                    <Mail size={14} className="me-1" />
                    بريد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDetailDrawerOpen(false);
                      setLocation("/home/platform/calendar");
                    }}
                  >
                    <Calendar size={14} className="me-1" />
                    جدولة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Convert lead to deal
                      createDealFromLead(detailLead);
                    }}
                    disabled={convertToDealMutation.isPending}
                  >
                    <Briefcase size={14} className="me-1" />
                    {convertToDealMutation.isPending ? "..." : "تحويل لصفقة"}
                  </Button>
                </div>
              </div>

              {/* Tabbed Content */}
              <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4 border-b">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info" className="text-xs">المعلومات</TabsTrigger>
                    <TabsTrigger value="activities" className="text-xs">الأنشطة</TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs">الملاحظات</TabsTrigger>
                    <TabsTrigger value="deals" className="text-xs">الصفقات</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  {/* Info Tab */}
                  <TabsContent value="info" className="p-6 mt-0">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">بيانات العميل</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">الاسم الكامل</span>
                          <span className="font-medium text-sm">{detailLead.firstName} {detailLead.lastName}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">البريد الإلكتروني</span>
                          <span className="font-medium text-sm">{detailLead.email || "غير محدد"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">الهاتف</span>
                          <span className="font-medium text-sm">{detailLead.phone || "غير محدد"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">المدينة</span>
                          <span className="font-medium text-sm">{detailLead.city || "غير محدد"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">العمر</span>
                          <span className="font-medium text-sm">{detailLead.age || "غير محدد"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">الحالة الاجتماعية</span>
                          <span className="font-medium text-sm">{getMaritalStatusLabel(detailLead.maritalStatus || "")}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">عدد المُعالين</span>
                          <span className="font-medium text-sm">{detailLead.numberOfDependents ?? 0}</span>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">اهتمامات العميل</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">مصدر العميل</span>
                          <span className="font-medium text-sm">{detailLead.leadSource || "غير محدد"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">نوع الاهتمام</span>
                          <span className="font-medium text-sm">{getInterestTypeLabel(detailLead.interestType || "")}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">نطاق الميزانية</span>
                          <span className="font-medium text-sm">{formatBudgetRange(detailLead.budgetRange)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm">تاريخ الإنشاء</span>
                          <span className="font-medium text-sm">{formatAdminDate(detailLead.createdAt)}</span>
                        </div>
                      </div>

                      {/* Status Change Buttons */}
                      <Separator className="my-4" />
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">تغيير الحالة</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CLOSED"].map((status) => (
                          <Button
                            key={status}
                            variant={detailLead.status === status ? "default" : "outline"}
                            size="sm"
                            className="text-xs"
                            disabled={detailLead.status === status || updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: detailLead.id, status })}
                          >
                            {getStatusLabel(status)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Activities Tab */}
                  <TabsContent value="activities" className="p-6 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">سجل الأنشطة</h4>
                        <Button size="sm" variant="outline" onClick={() => {
                          setDetailDrawerOpen(false);
                          setLocation("/home/platform/activities");
                        }}>
                          <Activity size={14} className="me-1" />
                          إضافة نشاط
                        </Button>
                      </div>

                      {!detailActivities || detailActivities.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                          <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                          <p className="text-sm">لا توجد أنشطة مسجلة لهذا العميل</p>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute start-4 top-0 bottom-0 w-px bg-border" />
                          {detailActivities.map((activity) => (
                            <div key={activity.id} className="relative flex gap-3 pb-4 ms-1">
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full z-10",
                                activity.completed
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {getActivityIcon(activity.activityType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{activity.title}</p>
                                  {activity.completed && (
                                    <CheckCircle2 size={12} className="text-primary" />
                                  )}
                                </div>
                                {activity.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{activity.activityType}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatAdminDate(activity.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Notes Tab */}
                  <TabsContent value="notes" className="p-6 mt-0">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">الملاحظات</h4>

                      {/* Add note form */}
                      <div className="flex gap-2">
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="أضف ملاحظة جديدة..."
                          rows={2}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          className="self-end"
                          disabled={!noteText.trim() || addNoteMutation.isPending}
                          onClick={() => {
                            const existing = detailLead.notes ? detailLead.notes + "\n\n" : "";
                            const timestamp = new Date().toLocaleDateString("ar-SA");
                            addNoteMutation.mutate({
                              id: detailLead.id,
                              notes: existing + `[${timestamp}] ${noteText.trim()}`,
                            });
                          }}
                        >
                          <Send size={14} />
                        </Button>
                      </div>

                      {detailLead.notes ? (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                                <FileText size={14} className="text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{detailLead.notes}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  آخر تحديث: {formatAdminDate(detailLead.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-xs">لا توجد ملاحظات — أضف أول ملاحظة أعلاه</p>
                        </div>
                      )}

                      {detailLead.preferences && (
                        <>
                          <Separator />
                          <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">التفضيلات</h4>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">{detailLead.preferences}</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Deals Tab */}
                  <TabsContent value="deals" className="p-6 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">الصفقات المرتبطة ({leadDeals.length})</h4>
                        <Button size="sm" variant="outline" onClick={() => { setDetailDrawerOpen(false); setLocation("/home/platform/pipeline"); }}>
                          <Briefcase size={14} className="me-1" />
                          لوحة الصفقات
                        </Button>
                      </div>
                      {leadDeals.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-xs">لا توجد صفقات مرتبطة بهذا العميل</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {leadDeals.map((deal: any) => (
                            <Card key={deal.id} className="cursor-pointer hover:shadow-sm" onClick={() => { setDetailDrawerOpen(false); setLocation("/home/platform/pipeline"); }}>
                              <CardContent className="p-3 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold">{deal.source || "صفقة"}</p>
                                  <p className="text-xs text-muted-foreground">{formatAdminDate(deal.createdAt)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {deal.agreedPrice && <span className="text-sm font-bold text-primary">{Number(deal.agreedPrice).toLocaleString("en-US")}</span>}
                                  <Badge variant="outline" className="text-xs">{deal.stage}</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Create Lead Sheet ── */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>إضافة عميل محتمل جديد</SheetTitle>
            <SheetDescription>أدخل بيانات العميل المحتمل</SheetDescription>
          </SheetHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createLeadMutation.mutate(data))} className="space-y-4 py-4 max-w-lg mx-auto">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createForm.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>الاسم الأول *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>اسم العائلة *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} type="tel" dir="ltr" className="text-start" placeholder="05XXXXXXXX" /></FormControl></FormItem>
                )} />
                <FormField control={createForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input {...field} type="email" dir="ltr" className="text-start" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={createForm.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>المدينة</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={createForm.control} name="source" render={({ field }) => (
                  <FormItem><FormLabel>مصدر العميل</FormLabel><FormControl><Input {...field} placeholder="واتساب، موقع، إحالة..." /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={createForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="ملاحظات أولية..." /></FormControl></FormItem>
              )} />
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createLeadMutation.isPending}>
                  {createLeadMutation.isPending ? "..." : "إنشاء العميل"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* ── Edit Lead Sheet ── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>تعديل بيانات العميل</SheetTitle>
          </SheetHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => detailLead && updateLeadMutation.mutate({ id: detailLead.id, data }))} className="space-y-4 py-4 max-w-lg mx-auto">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>الاسم الأول *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>اسم العائلة *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} type="tel" dir="ltr" className="text-start" /></FormControl></FormItem>
                )} />
                <FormField control={editForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input {...field} type="email" dir="ltr" className="text-start" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>المدينة</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={editForm.control} name="source" render={({ field }) => (
                  <FormItem><FormLabel>مصدر العميل</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl></FormItem>
              )} />
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={updateLeadMutation.isPending} className="gap-1.5">
                  <Save size={14} />
                  {updateLeadMutation.isPending ? "..." : "حفظ التعديلات"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
