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
import { Trash2, Edit, Plus, Phone, Mail, Filter, SlidersHorizontal, Search, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddLeadDrawer from "@/components/modals/add-lead-drawer";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/types";
import { BUTTON_PRIMARY_CLASSES, TYPOGRAPHY, PAGE_WRAPPER, CARD_STYLES, TABLE_STYLES, INPUT_STYLES, EMPTY_STYLES, LOADING_STYLES, BADGE_STYLES, getLeadStatusBadge } from "@/config/platform-theme";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Customers() {
  const { dir } = useLanguage();
  const [addLeadDrawerOpen, setAddLeadDrawerOpen] = useState(false);
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

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
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
      
      return num.toLocaleString();
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
        <Card className={CARD_STYLES.container}>
          <CardHeader className={CARD_STYLES.header}>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className={TYPOGRAPHY.cardTitle}>
                جميع العملاء المحتملين ({totalItems})
                {totalPages > 1 && ` - صفحة ${currentPage} من ${totalPages}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="ui-transition"
                >
                  <SlidersHorizontal size={16} className="ml-2" />
                  الفلاتر
                </Button>
                <Button 
                  onClick={() => setAddLeadDrawerOpen(true)}
                  className={BUTTON_PRIMARY_CLASSES}
                >
                  <Plus className="ml-2" size={16} />
                  إضافة عميل محتمل
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="rounded-2xl p-5 space-y-4 border border-slate-200/60 shadow-sm ui-stable backdrop-blur-xl bg-white/90 ring-1 ring-emerald-200/40">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-800">فلاتر البحث</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters} 
                    className={BUTTON_PRIMARY_CLASSES}
                  >
                    إعادة تعيين
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 transform-none">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">الحالة</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">جميع الحالات</SelectItem>
                        {uniqueStatuses.map(status => (
                          <SelectItem key={status} value={status} className="hover:bg-slate-100">
                            {getStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">المدينة</Label>
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">جميع المدن</SelectItem>
                        {uniqueCities.map(city => (
                          <SelectItem key={city} value={city} className="hover:bg-slate-100">{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Range Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">العمر</Label>
                    <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر الفئة العمرية" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">جميع الأعمار</SelectItem>
                        <SelectItem value="20-30" className="hover:bg-slate-100">20-30 سنة</SelectItem>
                        <SelectItem value="31-40" className="hover:bg-slate-100">31-40 سنة</SelectItem>
                        <SelectItem value="41-50" className="hover:bg-slate-100">41-50 سنة</SelectItem>
                        <SelectItem value="51+" className="hover:bg-slate-100">51+ سنة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Marital Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">الحالة الاجتماعية</Label>
                    <Select value={maritalStatusFilter} onValueChange={setMaritalStatusFilter}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">جميع الحالات</SelectItem>
                        {uniqueMaritalStatuses.map(status => (
                          <SelectItem key={status} value={status} className="hover:bg-slate-100">{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interest Type Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">نوع الاهتمام</Label>
                    <Select value={interestTypeFilter} onValueChange={setInterestTypeFilter}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">جميع الأنواع</SelectItem>
                        {uniqueInterestTypes.map(type => (
                          <SelectItem key={type} value={type} className="hover:bg-slate-100">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dependents Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">عدد المُعالين</Label>
                    <Select value={dependentsFilter} onValueChange={setDependentsFilter}>
                      <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر العدد" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100">جميع الأعداد</SelectItem>
                        <SelectItem value="0" className="hover:bg-slate-100">لا يوجد</SelectItem>
                        <SelectItem value="1-2" className="hover:bg-slate-100">1-2</SelectItem>
                        <SelectItem value="3+" className="hover:bg-slate-100">3 أو أكثر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            {totalItems === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-500 mb-4">
                  {searchQuery || showFilters ? "لا توجد عملاء يطابقون الفلاتر المحددة." : "لا توجد عملاء محتملين. أضف أول عميل للبدء."}
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                  <table className={cn(TABLE_STYLES.container, "min-w-[900px] w-full text-end")}>
                    <thead className={cn(TABLE_STYLES.header, "bg-slate-50 border-b border-slate-200")}>
                      <tr className={cn(TABLE_STYLES.headerCell, "text-xs font-medium text-slate-700 uppercase tracking-wider")}>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>العميل</th>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>المدينة</th>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>العمر</th>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>الحالة الاجتماعية</th>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>المُعالين</th>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>نوع الاهتمام</th>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>نطاق الميزانية</th>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>الحالة</th>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>تاريخ الانضمام</th>
                        <th className={cn(TABLE_STYLES.headerCell, "px-6 py-3 text-end")}>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className={cn(TABLE_STYLES.body, "divide-y divide-slate-200")}>
                      {currentPageLeads.map((lead) => (
                      <tr key={lead.id} className={cn(TABLE_STYLES.body, "transition-colors hover:bg-slate-50")}>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4")}>
                          <div className={cn(TYPOGRAPHY.body, "font-semibold text-slate-900")}>{lead.firstName} {lead.lastName}</div>
                          <div className="mt-1 flex items-center gap-2 text-slate-500">
                            <Phone size={12} />
                            <span>{lead.phone}</span>
                          </div>
                        </td>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                          {lead.city || "غير محدد"}
                        </td>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                          {lead.age || "غير محدد"}
                        </td>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                          {getMaritalStatusLabel(lead.maritalStatus || "")}
                        </td>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                          {lead.numberOfDependents || 0}
                        </td>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                          {getInterestTypeLabel(lead.interestType || "")}
                        </td>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                          {formatBudgetRange(lead.budgetRange)}
                        </td>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                          <span className={cn(BADGE_STYLES.base, getLeadStatusBadge(lead.status))}>
                            {getStatusLabel(lead.status)}
                          </span>
                        </td>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                          {new Date(lead.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className={cn(TABLE_STYLES.cell, "px-6 py-4 text-end")}>
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              className="p-2 rounded-md text-emerald-600 transition-colors duration-150 hover:text-emerald-800 hover:bg-emerald-50"
                              title="اتصال"
                            >
                              <Phone size={16} />
                            </button>
                            <button 
                              className="p-2 rounded-md text-blue-600 transition-colors duration-150 hover:text-blue-800 hover:bg-blue-50"
                              title="تعديل"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="p-2 rounded-md text-red-600 transition-colors duration-150 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDelete(lead)}
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/30">
                    <div className="text-sm text-slate-600">
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
      </main>

      <AddLeadDrawer 
        open={addLeadDrawerOpen} 
        onOpenChange={setAddLeadDrawerOpen}
      />

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
                <p className="text-slate-600">
                  هل أنت متأكد من حذف العميل التالي؟
                </p>
                {leadToDelete && (
                  <div className="bg-slate-50 rounded-lg p-3 text-sm">
                    <div className="font-medium text-slate-900">
                      {leadToDelete.firstName} {leadToDelete.lastName}
                    </div>
                    <div className="text-slate-600 mt-1">
                      {leadToDelete.phone}
                    </div>
                    <div className="text-slate-600">
                      {leadToDelete.city || "غير محدد"}
                    </div>
                  </div>
                )}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    سيتم حذف جميع بيانات العميل نهائياً من النظام
                  </p>
                </div>
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
    </>
  );
}
