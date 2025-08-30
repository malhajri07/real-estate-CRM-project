import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Edit, Plus, Phone, Mail, Filter, SlidersHorizontal, Search } from "lucide-react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddLeadModal from "@/components/modals/add-lead-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

export default function Customers() {
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
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
        lead.email.toLowerCase().includes(query) ||
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-blue-100 text-blue-800";
      case "showing": return "bg-purple-100 text-purple-800";
      case "negotiation": return "bg-orange-100 text-orange-800";
      case "closed": return "bg-green-100 text-green-800";
      case "lost": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
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

  const formatBudgetRange = (budgetRange: string | null): string => {
    if (!budgetRange) return 'غير محدد';
    
    // Function to format individual numbers
    const formatNumber = (numStr: string): string => {
      // Remove commas and spaces, extract just the number
      const num = parseInt(numStr.replace(/[,\s]/g, ''));
      
      if (isNaN(num)) return numStr;
      
      if (num >= 1000000) {
        const millions = num / 1000000;
        return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
      } else if (num >= 1000) {
        const thousands = num / 1000;
        return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
      }
      
      return num.toLocaleString();
    };

    // Handle range format (e.g., "2,000,000 - 3,000,000 ريال")
    if (budgetRange.includes(' - ')) {
      const parts = budgetRange.split(' - ');
      const firstNum = formatNumber(parts[0]);
      const secondPart = parts[1];
      
      // Extract the second number and currency
      const match = secondPart.match(/^([\d,\s]+)\s*(.*)$/);
      if (match) {
        const secondNum = formatNumber(match[1]);
        const currency = match[2] || 'ريال';
        return `${firstNum} - ${secondNum} ${currency}`;
      }
    }
    
    // Handle single number with currency
    const match = budgetRange.match(/^([\d,\s]+)\s*(.*)$/);
    if (match) {
      const formattedNum = formatNumber(match[1]);
      const currency = match[2] || 'ريال';
      return `${formattedNum} ${currency}`;
    }
    
    return budgetRange;
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل المحتمل؟")) {
      deleteLead.mutate(id);
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
        title="العملاء المحتملين" 
        onAddClick={() => setAddLeadModalOpen(true)}
        onSearch={handleSearchChange}
        searchPlaceholder="البحث في العملاء بالاسم أو الهاتف أو المدينة..."
      />
      
      <main className="flex-1 overflow-y-auto p-6 no-layout-shift">
        <Card>
          <CardHeader className="border-b border-slate-200">
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
                  className="apple-transition"
                >
                  <SlidersHorizontal size={16} className="ml-2" />
                  الفلاتر
                </Button>
                <Button onClick={() => setAddLeadModalOpen(true)}>
                  <Plus className="ml-2" size={16} />
                  إضافة عميل محتمل
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="rounded-xl p-5 space-y-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm no-layout-shift bg-modal-filter">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">فلاتر البحث</h3>
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                    إعادة تعيين
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 transform-none">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">الحالة</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100 dark:hover:bg-slate-700">جميع الحالات</SelectItem>
                        {uniqueStatuses.map(status => (
                          <SelectItem key={status} value={status} className="hover:bg-slate-100 dark:hover:bg-slate-700">
                            {getStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">المدينة</Label>
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100 dark:hover:bg-slate-700">جميع المدن</SelectItem>
                        {uniqueCities.map(city => (
                          <SelectItem key={city} value={city} className="hover:bg-slate-100 dark:hover:bg-slate-700">{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Range Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">العمر</Label>
                    <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر الفئة العمرية" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100 dark:hover:bg-slate-700">جميع الأعمار</SelectItem>
                        <SelectItem value="20-30" className="hover:bg-slate-100 dark:hover:bg-slate-700">20-30 سنة</SelectItem>
                        <SelectItem value="31-40" className="hover:bg-slate-100 dark:hover:bg-slate-700">31-40 سنة</SelectItem>
                        <SelectItem value="41-50" className="hover:bg-slate-100 dark:hover:bg-slate-700">41-50 سنة</SelectItem>
                        <SelectItem value="51+" className="hover:bg-slate-100 dark:hover:bg-slate-700">51+ سنة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Marital Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">الحالة الاجتماعية</Label>
                    <Select value={maritalStatusFilter} onValueChange={setMaritalStatusFilter}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100 dark:hover:bg-slate-700">جميع الحالات</SelectItem>
                        {uniqueMaritalStatuses.map(status => (
                          <SelectItem key={status} value={status} className="hover:bg-slate-100 dark:hover:bg-slate-700">{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interest Type Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">نوع الاهتمام</Label>
                    <Select value={interestTypeFilter} onValueChange={setInterestTypeFilter}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100 dark:hover:bg-slate-700">جميع الأنواع</SelectItem>
                        {uniqueInterestTypes.map(type => (
                          <SelectItem key={type} value={type} className="hover:bg-slate-100 dark:hover:bg-slate-700">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dependents Filter */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">عدد المُعالين</Label>
                    <Select value={dependentsFilter} onValueChange={setDependentsFilter}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="اختر العدد" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
                        <SelectItem value="all" className="hover:bg-slate-100 dark:hover:bg-slate-700">جميع الأعداد</SelectItem>
                        <SelectItem value="0" className="hover:bg-slate-100 dark:hover:bg-slate-700">لا يوجد</SelectItem>
                        <SelectItem value="1-2" className="hover:bg-slate-100 dark:hover:bg-slate-700">1-2</SelectItem>
                        <SelectItem value="3+" className="hover:bg-slate-100 dark:hover:bg-slate-700">3 أو أكثر</SelectItem>
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
                {!searchQuery && !showFilters && (
                  <Button onClick={() => setAddLeadModalOpen(true)}>
                    <Plus className="ml-2" size={16} />
                    إضافة أول عميل محتمل
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="professional-table">
                    <thead className="professional-table-header">
                      <tr>
                        <th>العميل</th>
                        <th>المدينة</th>
                        <th>العمر</th>
                        <th>الحالة الاجتماعية</th>
                        <th>المُعالين</th>
                        <th>نوع الاهتمام</th>
                        <th>نطاق الميزانية</th>
                        <th>الحالة</th>
                        <th>تاريخ الانضمام</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPageLeads.map((lead) => (
                      <tr key={lead.id} className="professional-table-row">
                        <td className="professional-table-cell-name">
                          <div className="name">{lead.firstName} {lead.lastName}</div>
                          <div className="contact">
                            <div className="contact-item">
                              <Phone size={12} />
                              <span>{lead.phone}</span>
                            </div>
                            {lead.email && (
                              <div className="contact-item">
                                <Mail size={12} />
                                <span>{lead.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="professional-table-cell">
                          <div className="info-cell">
                            <div className="primary">{lead.city || "غير محدد"}</div>
                          </div>
                        </td>
                        <td className="professional-table-cell">
                          <div className="info-cell">
                            <div className="primary">{lead.age ? `${lead.age} سنة` : "غير محدد"}</div>
                          </div>
                        </td>
                        <td className="professional-table-cell">
                          <div className="info-cell">
                            <div className="primary">{lead.maritalStatus || "غير محدد"}</div>
                          </div>
                        </td>
                        <td className="professional-table-cell">
                          <div className="info-cell">
                            <div className="primary">{lead.numberOfDependents || 0}</div>
                          </div>
                        </td>
                        <td className="professional-table-cell">
                          <div className="info-cell">
                            <div className="primary">{getInterestTypeLabel(lead.interestType || "")}</div>
                          </div>
                        </td>
                        <td className="professional-table-cell">
                          <div className="info-cell">
                            <div className="primary">{formatBudgetRange(lead.budgetRange)}</div>
                          </div>
                        </td>
                        <td className="professional-table-cell">
                          <span className={`status-badge ${lead.status}`}>
                            {getStatusLabel(lead.status)}
                          </span>
                        </td>
                        <td className="professional-table-cell">
                          <div className="info-cell">
                            <div className="primary">
                              {new Date(lead.createdAt).toLocaleDateString('en-GB')}
                            </div>
                          </div>
                        </td>
                        <td className="professional-table-actions">
                          <div className="action-group">
                            <button 
                              className="action-btn action-btn-contact"
                              title="اتصال"
                            >
                              <Phone size={16} />
                            </button>
                            <button 
                              className="action-btn action-btn-edit"
                              title="تعديل"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="action-btn action-btn-delete"
                              onClick={() => handleDelete(lead.id)}
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

      <AddLeadModal 
        open={addLeadModalOpen} 
        onOpenChange={setAddLeadModalOpen}
      />
    </>
  );
}