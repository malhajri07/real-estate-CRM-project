import { useQuery } from "@tanstack/react-query";
import { Users, Building, Filter, Plus, Home, Calendar, Download, DollarSign } from "lucide-react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import AddLeadModal from "@/components/modals/add-lead-modal";
import AddPropertyModal from "@/components/modals/add-property-modal";
import type { Lead, Activity } from "@shared/schema";

export default function Dashboard() {
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const { t, dir } = useLanguage();

  const { data: metrics, isLoading: metricsLoading } = useQuery<{
    totalLeads: number;
    activeProperties: number;
    dealsInPipeline: number;
    monthlyRevenue: number;
    pipelineByStage: {
      lead: number;
      qualified: number;
      showing: number;
      negotiation: number;
      closed: number;
    };
  }>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: todaysActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities/today"],
  });

  const recentLeads = leads?.slice(0, 3) || [];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-blue-100 text-blue-800";
      case "showing": return "bg-orange-100 text-orange-800";
      case "negotiation": return "bg-purple-100 text-purple-800";
      case "closed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (metricsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500">{t('dashboard.loading') || 'جار تحميل لوحة التحكم...'}</div>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto p-8 bg-background">
        {/* Dashboard Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-card border border-border rounded-2xl p-6 apple-shadow-large apple-transition hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="text-blue-600" size={20} />
              </div>
              <div className="text-2xl font-bold tracking-tight">{metrics?.totalLeads || 0}</div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('dashboard.total_leads')}</h3>
            <p className="text-xs text-green-600 font-medium">+12% from last month</p>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6 apple-shadow-large apple-transition hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Building className="text-green-600" size={20} />
              </div>
              <div className="text-2xl font-bold tracking-tight">{metrics?.activeProperties || 0}</div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('dashboard.active_properties')}</h3>
            <p className="text-xs text-green-600 font-medium">+8% from last month</p>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6 apple-shadow-large apple-transition hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Filter className="text-purple-600" size={20} />
              </div>
              <div className="text-2xl font-bold tracking-tight">{metrics?.dealsInPipeline || 0}</div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('dashboard.deals_in_pipeline')}</h3>
            <p className="text-xs text-red-600 font-medium">-2% from last month</p>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6 apple-shadow-large apple-transition hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <DollarSign className="text-yellow-600" size={20} />
              </div>
              <div className="text-2xl font-bold tracking-tight">{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('dashboard.monthly_revenue')}</h3>
            <p className="text-xs text-green-600 font-medium">+24% from last month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Leads & Activities */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Leads */}
            <Card className="border border-border rounded-2xl apple-shadow-large">
              <CardHeader className="border-b border-border p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold tracking-tight">{t('dashboard.recent_leads')}</CardTitle>
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 rounded-xl font-medium text-sm">
                    {t('form.view_all') || 'عرض الكل'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('dashboard.no_leads') || 'لا توجد عملاء محتملين. قم بإنشاء أول عميل محتمل للبدء.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 apple-transition">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                            {lead.firstName[0]}{lead.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground tracking-tight">{lead.firstName} {lead.lastName}</p>
                            <p className="text-sm text-slate-500">{lead.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Badge className={getStatusBadgeColor(lead.status)}>
                            {lead.status}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deal Pipeline Overview */}
            <Card>
              <CardHeader className="border-b border-slate-200">
                <CardTitle>مراحل الصفقات</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="bg-slate-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-slate-900">
                        {metrics?.pipelineByStage?.lead || 0}
                      </div>
                      <div className="text-xs text-slate-500">عملاء محتملين</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">عميل محتمل</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-blue-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-blue-900">
                        {metrics?.pipelineByStage?.qualified || 0}
                      </div>
                      <div className="text-xs text-blue-600">مؤهل</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">مؤهل</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-yellow-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-yellow-900">
                        {metrics?.pipelineByStage?.showing || 0}
                      </div>
                      <div className="text-xs text-yellow-600">عرض</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">عرض</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-orange-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-orange-900">
                        {metrics?.pipelineByStage?.negotiation || 0}
                      </div>
                      <div className="text-xs text-orange-600">تفاوض</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">تفاوض</div>
                  </div>

                  <div className="text-center">
                    <div className="bg-green-100 rounded-lg p-4 mb-2">
                      <div className="text-2xl font-bold text-green-900">
                        {metrics?.pipelineByStage?.closed || 0}
                      </div>
                      <div className="text-xs text-green-600">مغلق</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">مغلق</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setAddLeadModalOpen(true)}
                  >
                    <Plus className="ml-3 text-primary" size={20} />
                    إضافة عميل محتمل جديد
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setAddPropertyModalOpen(true)}
                  >
                    <Home className="ml-3 text-green-500" size={20} />
                    إدراج عقار
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Calendar className="ml-3 text-blue-500" size={20} />
                    جدولة عرض
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Download className="ml-3 text-purple-500" size={20} />
                    تصدير العملاء المحتملين
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>مهام اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                {!todaysActivities || todaysActivities.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">
                    لا توجد مهام مجدولة لهذا اليوم
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
                        <input 
                          type="checkbox" 
                          checked={activity.completed}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${activity.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {activity.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {activity.scheduledDate ? new Date(activity.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'لم يتم تحديد وقت'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AddLeadModal open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen} />
      <AddPropertyModal open={addPropertyModalOpen} onOpenChange={setAddPropertyModalOpen} />
    </>
  );
}
