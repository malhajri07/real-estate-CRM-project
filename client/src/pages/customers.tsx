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
        onSearch={setSearchQuery}
        searchPlaceholder="البحث في العملاء بالاسم أو الهاتف أو المدينة..."
      />
      
      <main className="flex-1 overflow-y-auto p-6 no-layout-shift">
        <Card>
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>
                جميع العملاء المحتملين ({filteredLeads.length})
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
              <div className="rounded-xl p-5 space-y-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm no-layout-shift" style={{ backgroundColor: '#edf1ee' }}>
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
            {filteredLeads.length === 0 ? (
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">المدينة</TableHead>
                      <TableHead className="text-right">العمر</TableHead>
                      <TableHead className="text-right">الحالة الاجتماعية</TableHead>
                      <TableHead className="text-right">عدد المُعالين</TableHead>
                      <TableHead className="text-right">نوع الاهتمام</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                            <div className="text-sm text-muted-foreground">{lead.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{lead.city || "غير محدد"}</TableCell>
                        <TableCell>{lead.age ? `${lead.age} سنة` : "غير محدد"}</TableCell>
                        <TableCell>{lead.maritalStatus || "غير محدد"}</TableCell>
                        <TableCell>{lead.numberOfDependents || 0}</TableCell>
                        <TableCell>{lead.interestType || "غير محدد"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(lead.status)}>
                            {getStatusLabel(lead.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(lead.createdAt).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(lead.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={14} />
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
      </main>

      <AddLeadModal 
        open={addLeadModalOpen} 
        onOpenChange={setAddLeadModalOpen}
      />
    </>
  );
}