import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Edit, Plus, Phone, Mail, Users } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddLeadModal from "@/components/modals/add-lead-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/types";
import UnifiedPageLayout from "@/components/layout/unified-page-layout";
import FilterBar from "@/components/ui/filter-bar";
import EmptyState from "@/components/ui/empty-state";

export default function CustomersUnified() {
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
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
        case "+51":
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
        case "+3":
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
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalItems = filteredLeads?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageLeads = filteredLeads?.slice(startIndex, endIndex) || [];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new": return "bg-indigo-100 text-indigo-700 border border-indigo-200";
      case "qualified": return "bg-blue-100 text-blue-800 border border-blue-200";
      case "showing": return "bg-purple-100 text-purple-800 border border-purple-200";
      case "negotiation": return "bg-orange-100 text-orange-800 border border-orange-200";
      case "closed": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "lost": return "bg-red-100 text-red-800 border border-red-200";
      default: return "bg-slate-100 text-slate-700 border border-slate-200";
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
    
    const formatNumber = (numStr: string): string => {
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

    if (normalized.includes(' - ')) {
      const parts = normalized.split(' - ');
      const firstNum = formatNumber(parts[0]);
      const secondPart = parts[1];
      
      const match = secondPart.match(/^([\d,\s]+)/);
      if (match) {
        const secondNum = formatNumber(match[1]);
        return `${firstNum} - ${secondNum}`;
      }
    }
    
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

  // Filter content for the FilterBar component
  const filterContent = (
    <>
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
              <SelectItem key={city} value={city} className="hover:bg-slate-100">
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Age Range Filter */}
      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">الفئة العمرية</Label>
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
            <SelectValue placeholder="اختر الحالة الاجتماعية" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-lg">
            <SelectItem value="all" className="hover:bg-slate-100">جميع الحالات</SelectItem>
            {uniqueMaritalStatuses.map(status => (
              <SelectItem key={status} value={status} className="hover:bg-slate-100">
                {getMaritalStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interest Type Filter */}
      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">نوع الاهتمام</Label>
        <Select value={interestTypeFilter} onValueChange={setInterestTypeFilter}>
          <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
            <SelectValue placeholder="اختر نوع الاهتمام" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-lg">
            <SelectItem value="all" className="hover:bg-slate-100">جميع الأنواع</SelectItem>
            {uniqueInterestTypes.map(type => (
              <SelectItem key={type} value={type} className="hover:bg-slate-100">
                {getInterestTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dependents Filter */}
      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">عدد المعالين</Label>
        <Select value={dependentsFilter} onValueChange={setDependentsFilter}>
          <SelectTrigger className="bg-white border-slate-300 shadow-sm hover:border-primary/50 transition-colors">
            <SelectValue placeholder="اختر عدد المعالين" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 shadow-lg">
            <SelectItem value="all" className="hover:bg-slate-100">جميع الأعداد</SelectItem>
            <SelectItem value="0" className="hover:bg-slate-100">0</SelectItem>
            <SelectItem value="1-2" className="hover:bg-slate-100">1-2</SelectItem>
            <SelectItem value="3+" className="hover:bg-slate-100">3+</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  return (
    <>
      <UnifiedPageLayout
        title={`جميع العملاء المحتملين (${totalItems})`}
        subtitle={totalPages > 1 ? `صفحة ${currentPage} من ${totalPages}` : undefined}
        headerActions={
          <Button onClick={() => setAddLeadModalOpen(true)}>
            <Plus className="ml-2" size={16} />
            إضافة عميل محتمل
          </Button>
        }
        isLoading={isLoading}
        loadingMessage="جار تحميل العملاء..."
        isEmpty={!isLoading && filteredLeads.length === 0}
        emptyStateIcon={Users}
        emptyStateTitle="لا توجد عملاء محتملين"
        emptyStateDescription="أضف أول عميل محتمل للبدء في إدارة قاعدة بيانات العملاء."
        emptyStateAction={
          <Button onClick={() => setAddLeadModalOpen(true)}>
            <Plus className="ml-2" size={16} />
            إضافة أول عميل محتمل
          </Button>
        }
        showFilters={true}
        isFiltersOpen={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={resetFilters}
        filterContent={filterContent}
      >
        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="البحث في العملاء المحتملين..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Leads Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>نوع الاهتمام</TableHead>
                  <TableHead>الميزانية</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell>{lead.email || 'غير محدد'}</TableCell>
                    <TableCell>{lead.phone || 'غير محدد'}</TableCell>
                    <TableCell>{lead.city || 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(lead.status)}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getInterestTypeLabel(lead.interestType || '')}</TableCell>
                    <TableCell>{formatBudgetRange(lead.budgetRange)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(lead)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              عرض {startIndex + 1} إلى {Math.min(endIndex, totalItems)} من {totalItems} عميل
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <span className="text-sm text-gray-700">
                صفحة {currentPage} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </UnifiedPageLayout>

      {/* Add Lead Modal */}
      <AddLeadModal
        open={addLeadModalOpen}
        onOpenChange={setAddLeadModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف العميل المحتمل "{leadToDelete?.firstName} {leadToDelete?.lastName}"؟ 
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteLead.isPending}
            >
              {deleteLead.isPending ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
