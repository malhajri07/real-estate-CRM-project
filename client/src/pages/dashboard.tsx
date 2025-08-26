import { useQuery } from "@tanstack/react-query";
import { Users, Building, Filter, Plus, Home, Calendar, Download, Banknote } from "lucide-react";
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

  const recentLeads = leads?.slice(0, 10) || [];

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ﷼';
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
      <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-green-50 to-slate-100" dir="rtl">
        {/* Dashboard Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="text-white" size={22} />
              </div>
              <div className="text-3xl font-bold tracking-tight text-gray-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>{metrics?.totalLeads || 0}</div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">إجمالي العملاء المحتملين</h3>
            <p className="text-sm text-green-600 font-medium">+12% من الشهر الماضي</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building className="text-white" size={22} />
              </div>
              <div className="text-3xl font-bold tracking-tight text-gray-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>{metrics?.activeProperties || 0}</div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">العقارات النشطة</h3>
            <p className="text-sm text-green-600 font-medium">+8% من الشهر الماضي</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Filter className="text-white" size={22} />
              </div>
              <div className="text-3xl font-bold tracking-tight text-gray-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>{metrics?.dealsInPipeline || 0}</div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">الصفقات في المسار</h3>
            <p className="text-sm text-red-600 font-medium">-2% من الشهر الماضي</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Banknote className="text-white" size={22} />
              </div>
              <div className="text-3xl font-bold tracking-tight text-gray-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">الإيرادات الشهرية</h3>
            <p className="text-sm text-green-600 font-medium">+24% من الشهر الماضي</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Leads & Activities */}
          <div className="lg:col-span-2 space-y-8">
            {/* Deal Pipeline Overview - Moved to Top */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ml-3">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>مراحل الصفقات</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 mb-2 border border-slate-200 shadow-lg">
                      <div className="text-2xl font-bold text-slate-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>
                        {metrics?.pipelineByStage?.lead || 0}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">عملاء محتملين</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 mb-2 border border-blue-200 shadow-lg">
                      <div className="text-2xl font-bold text-blue-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>
                        {metrics?.pipelineByStage?.qualified || 0}
                      </div>
                      <div className="text-sm text-blue-600 font-medium">مؤهل</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 mb-2 border border-yellow-200 shadow-lg">
                      <div className="text-2xl font-bold text-yellow-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>
                        {metrics?.pipelineByStage?.showing || 0}
                      </div>
                      <div className="text-sm text-yellow-600 font-medium">عرض</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 mb-2 border border-orange-200 shadow-lg">
                      <div className="text-2xl font-bold text-orange-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>
                        {metrics?.pipelineByStage?.negotiation || 0}
                      </div>
                      <div className="text-sm text-orange-600 font-medium">تفاوض</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 mb-2 border border-green-200 shadow-lg">
                      <div className="text-2xl font-bold text-green-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>
                        {metrics?.pipelineByStage?.closed || 0}
                      </div>
                      <div className="text-sm text-green-600 font-medium">مغلق</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ml-3">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>العملاء المحتملين الجدد</h2>
                  </div>
                  <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl font-medium text-sm border border-white/20">
                    عرض الكل
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    لا توجد عملاء محتملين. قم بإنشاء أول عميل محتمل للبدء.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:from-green-50 hover:to-green-100 transition-all duration-300 border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                            {lead.firstName[0]}{lead.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 tracking-tight" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>{lead.firstName} {lead.lastName}</p>
                            <p className="text-sm text-gray-600">{lead.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Badge className={`${getStatusBadgeColor(lead.status)} font-medium px-3 py-1 rounded-xl`}>
                            {lead.status === 'new' ? 'جديد' : 
                             lead.status === 'qualified' ? 'مؤهل' : 
                             lead.status === 'showing' ? 'معاينة' : 
                             lead.status === 'negotiation' ? 'تفاوض' : 
                             lead.status === 'closed' ? 'مغلق' : 'مفقود'}
                          </Badge>
                          <span className="text-sm text-gray-500 font-medium">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ml-3">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>إجراءات سريعة</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl p-4 h-auto text-right border border-green-200"
                    onClick={() => setAddLeadModalOpen(true)}
                  >
                    <Plus className="ml-3 text-green-600" size={20} />
                    <span className="font-semibold text-gray-800">إضافة عميل محتمل جديد</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl p-4 h-auto text-right border border-blue-200"
                    onClick={() => setAddPropertyModalOpen(true)}
                  >
                    <Home className="ml-3 text-blue-600" size={20} />
                    <span className="font-semibold text-gray-800">إدراج عقار</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl p-4 h-auto text-right border border-purple-200">
                    <Calendar className="ml-3 text-purple-600" size={20} />
                    <span className="font-semibold text-gray-800">جدولة عرض</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-2xl p-4 h-auto text-right border border-yellow-200">
                    <Download className="ml-3 text-yellow-600" size={20} />
                    <span className="font-semibold text-gray-800">تصدير العملاء المحتملين</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ml-3">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>مهام اليوم</h2>
                </div>
              </div>
              <div className="p-6">
                {!todaysActivities || todaysActivities.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    لا توجد مهام مجدولة لهذا اليوم
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                        <input 
                          type="checkbox" 
                          checked={activity.completed}
                          className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${activity.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">
                            {activity.scheduledDate ? new Date(activity.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'لم يتم تحديد وقت'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <AddLeadModal open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen} />
      <AddPropertyModal open={addPropertyModalOpen} onOpenChange={setAddPropertyModalOpen} />
    </>
  );
}
