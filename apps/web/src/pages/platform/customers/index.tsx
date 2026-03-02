/**
 * customers.tsx - Customer Management Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → customers.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Customer management page for authenticated users. Provides:
 * - Customer listing and search
 * - Customer CRUD operations
 * - Customer filtering and sorting
 * 
 * Route: /home/platform/customers or /customers
 * 
 * Related Files:
 * - apps/web/src/components/modals/add-lead-drawer.tsx - Add customer modal
 * - apps/api/routes/ - Customer API routes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Edit, Phone, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/types";
import { getLeadStatusVariant } from "@/lib/status-variants";
import { QueryErrorFallback } from "@/components/ui/query-error-fallback";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Customers() {
  const { t, dir, language } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [ageRangeFilter, setAgeRangeFilter] = useState("all");
  const [maritalStatusFilter, setMaritalStatusFilter] = useState("all");
  const [interestTypeFilter, setInterestTypeFilter] = useState("all");
  const [dependentsFilter, setDependentsFilter] = useState("all");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading, isError, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/dashboard/metrics"] });
      toast({ title: "نجح", description: "تم حذف العميل المحتمل بنجاح" });
    },
    onError: () => {
      toast({ 
        title: "خطأ", 
        description: "فشل في حذف العميل المحتمل",
        variant: "destructive" 
      });
    },
  });

  // Apply filters
  const filteredLeads = leads?.filter(lead => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        lead.firstName.toLowerCase().includes(query) ||
        lead.lastName.toLowerCase().includes(query) ||
        (lead.email ?? "").toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.city?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;

    // City filter
    if (cityFilter !== "all" && lead.city !== cityFilter) return false;

    // Age range filter
    if (ageRangeFilter !== "all" && lead.age) {
      const age = lead.age;
      switch (ageRangeFilter) {
        case "20-30":
          if (age < 20 || age > 30) return false;
          break;
        case "31-40":
          if (age < 31 || age > 40) return false;
          break;
        case "41-50":
          if (age < 41 || age > 50) return false;
          break;
        case "51+":
          if (age < 51) return false;
          break;
      }
    }

    // Marital status filter
    if (maritalStatusFilter !== "all" && lead.maritalStatus !== maritalStatusFilter) return false;

    // Interest type filter
    if (interestTypeFilter !== "all" && lead.interestType !== interestTypeFilter) return false;

    // Dependents filter
    if (dependentsFilter !== "all") {
      const deps = lead.numberOfDependents || 0;
      switch (dependentsFilter) {
        case "0":
          if (deps !== 0) return false;
          break;
        case "1-2":
          if (deps < 1 || deps > 2) return false;
          break;
        case "3+":
          if (deps < 3) return false;
          break;
      }
    }

    return true;
  }) || [];

  // Get unique values for filter options
  const uniqueCities = Array.from(new Set(leads?.map(lead => lead.city).filter(Boolean))) as string[];
  const uniqueStatuses = Array.from(new Set(leads?.map(lead => lead.status))) as string[];
  const uniqueMaritalStatuses = Array.from(new Set(leads?.map(lead => lead.maritalStatus).filter(Boolean))) as string[];
  const uniqueInterestTypes = Array.from(new Set(leads?.map(lead => lead.interestType).filter(Boolean))) as string[];

  const resetFilters = () => {
    setStatusFilter("all");
    setCityFilter("all");
    setAgeRangeFilter("all");
    setMaritalStatusFilter("all");
    setInterestTypeFilter("all");
    setDependentsFilter("all");
    setSearchQuery("");
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Pagination calculations
  const totalItems = filteredLeads?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageLeads = filteredLeads?.slice(startIndex, endIndex) || [];

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new": return "جديد";
      case "qualified": return "مؤهل";
      case "showing": return "معاينة";
      case "negotiation": return "تفاوض";
      case "closed": return "مغلق";
      case "lost": return "مفقود";
      default: return status;
    }
  };

  const getInterestTypeLabel = (interestType: string) => {
    switch (interestType) {
      case 'buying': return 'شراء';
      case 'selling': return 'بيع';
      case 'renting': return 'تأجير';
      case 'investment': return 'استئجار';
      case 'شراء': return 'شراء';
      case 'بيع': return 'بيع';
      case 'تأجير': return 'تأجير';
      case 'استئجار': return 'استئجار';
      default: return interestType || 'غير محدد';
    }
  };

  const getMaritalStatusLabel = (maritalStatus: string) => {
    switch (maritalStatus) {
      case 'single': return 'أعزب';
      case 'married': return 'متزوج';
      case 'divorced': return 'مطلق';
      case 'widowed': return 'أرمل';
      case 'أعزب': return 'أعزب';
      case 'متزوج': return 'متزوج';
      case 'مطلق': return 'مطلق';
      case 'أرمل': return 'أرمل';
      default: return maritalStatus || 'غير محدد';
    }
  };

  const formatBudgetRange = (budgetRange?: string | null): string => {
    const rawValue = budgetRange ?? "";
    if (!rawValue.trim()) return 'غير محدد';
    const normalized = rawValue.trim();
    
    // Function to format individual numbers
    const formatNumber = (numStr: string): string => {
      // Remove commas and spaces, extract just the number
      const num = parseInt(numStr.replace(/[,\s]/g, ''));
      
      if (isNaN(num)) return numStr;
      
      if (num >= 1000000) {
        const millions = num / 1000000;
        return `${millions.toFixed(1)}M`;
      } else if (num >= 1000) {
        const thousands = num / 1000;
        return `${thousands.toFixed(1)}K`;
      }
      
      return num.toLocaleString("en-US");
    };

    // Handle range format (e.g., "2,000,000 - 3,000,000 ريال")
    if (normalized.includes(' - ')) {
      const parts = normalized.split(' - ');
      const firstNum = formatNumber(parts[0]);
      const secondPart = parts[1];
      
      // Extract the second number (ignore currency)
      const match = secondPart.match(/^([\d,\s]+)/);
      if (match) {
        const secondNum = formatNumber(match[1]);
        return `${firstNum} - ${secondNum}`;
      }
    }
    
    // Handle single number (ignore currency)
    const match = normalized.match(/^([\d,\s]+)/);
    if (match) {
      const formattedNum = formatNumber(match[1]);
      return formattedNum;
    }
    
    return normalized;
  };

  const handleDelete = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (leadToDelete) {
      deleteLead.mutate(leadToDelete.id);
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
  };

  if (isError) {
    return (
      <div className="w-full space-y-6" dir={dir}>
        <QueryErrorFallback message={t("customers.load_error") || "Failed to load customers."} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6" dir={dir}>
        <p className="text-sm text-muted-foreground mb-4">جار تحميل العملاء...</p>
        <TableSkeleton rows={6} cols={8} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6" dir={dir}>
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>
                جميع العملاء المحتملين ({totalItems})
                {totalPages > 1 && ` - صفحة ${currentPage} من ${totalPages}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal size={16} className="me-2" />
                  الفلاتر
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">فلاتر البحث</h3>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={resetFilters}
                    >
                      إعادة تعيين
                    </Button>
                  </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label>الحالة</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الحالات</SelectItem>
                          {uniqueStatuses.map(status => (
                            <SelectItem key={status} value={status}>
                              {getStatusLabel(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* City Filter */}
                    <div className="space-y-2">
                      <Label>المدينة</Label>
                      <Select value={cityFilter} onValueChange={setCityFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المدينة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع المدن</SelectItem>
                          {uniqueCities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Age Range Filter */}
                    <div className="space-y-2">
                      <Label>العمر</Label>
                      <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة العمرية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الأعمار</SelectItem>
                          <SelectItem value="20-30">20-30 سنة</SelectItem>
                          <SelectItem value="31-40">31-40 سنة</SelectItem>
                          <SelectItem value="41-50">41-50 سنة</SelectItem>
                          <SelectItem value="51+">51+ سنة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Marital Status Filter */}
                    <div className="space-y-2">
                      <Label>الحالة الاجتماعية</Label>
                      <Select value={maritalStatusFilter} onValueChange={setMaritalStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الحالات</SelectItem>
                          {uniqueMaritalStatuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Interest Type Filter */}
                    <div className="space-y-2">
                      <Label>نوع الاهتمام</Label>
                      <Select value={interestTypeFilter} onValueChange={setInterestTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الأنواع</SelectItem>
                          {uniqueInterestTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dependents Filter */}
                    <div className="space-y-2">
                      <Label>عدد المُعالين</Label>
                      <Select value={dependentsFilter} onValueChange={setDependentsFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العدد" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الأعداد</SelectItem>
                          <SelectItem value="0">لا يوجد</SelectItem>
                          <SelectItem value="1-2">1-2</SelectItem>
                          <SelectItem value="3+">3 أو أكثر</SelectItem>
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
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  {searchQuery || showFilters ? "لا توجد عملاء يطابقون الفلاتر المحددة." : "لا توجد عملاء محتملين. أضف أول عميل للبدء."}
                </div>
              </div>
            ) : (
              <>
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-end">العميل</TableHead>
                      <TableHead className="text-end">المدينة</TableHead>
                      <TableHead className="text-end">العمر</TableHead>
                      <TableHead className="text-end">الحالة الاجتماعية</TableHead>
                      <TableHead className="text-end">المُعالين</TableHead>
                      <TableHead className="text-end">نوع الاهتمام</TableHead>
                      <TableHead className="text-end">نطاق الميزانية</TableHead>
                      <TableHead className="text-end">الحالة</TableHead>
                      <TableHead className="text-end">تاريخ الانضمام</TableHead>
                      <TableHead className="text-end">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPageLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-semibold">{lead.firstName} {lead.lastName}</div>
                        <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                          <Phone size={12} />
                          <span>{lead.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-end">
                        {lead.city || "غير محدد"}
                      </TableCell>
                      <TableCell className="text-end">
                        {lead.age || "غير محدد"}
                      </TableCell>
                      <TableCell className="text-end">
                        {getMaritalStatusLabel(lead.maritalStatus || "")}
                      </TableCell>
                      <TableCell className="text-end">
                        {lead.numberOfDependents || 0}
                      </TableCell>
                      <TableCell className="text-end">
                        {getInterestTypeLabel(lead.interestType || "")}
                      </TableCell>
                      <TableCell className="text-end">
                        {formatBudgetRange(lead.budgetRange)}
                      </TableCell>
                      <TableCell className="text-end">
                        <Badge variant={getLeadStatusVariant(lead.status)}>
                          {getStatusLabel(lead.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        {new Date(lead.createdAt).toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost"
                            size="icon"
                            title="اتصال"
                          >
                            <Phone size={16} />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="icon"
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(lead)}
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      عرض {startIndex + 1} إلى {Math.min(endIndex, totalItems)} من {totalItems} عميل
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        السابق
                      </Button>
                      
                      {/* Page Numbers */}
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
                        التالي
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-end">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription className="text-end pt-2">
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
                        {leadToDelete.city || "غير محدد"}
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Alert variant="destructive">
                  <AlertTitle>
                    ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه
                  </AlertTitle>
                  <AlertDescription>
                    سيتم حذف جميع بيانات العميل نهائياً من النظام
                  </AlertDescription>
                </Alert>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex-1"
              disabled={deleteLead.isPending}
            >
              {deleteLead.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
