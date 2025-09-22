import { useQuery } from "@tanstack/react-query";
import { Users, Building, Filter, Plus, Home, Calendar, Download, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import AddLeadModal from "@/components/modals/add-lead-modal";
import AddPropertyModal from "@/components/modals/add-property-modal";
import type { Lead, Activity } from "@shared/types";

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
      <main className="h-full overflow-y-auto p-8 bg-[#f5f5f7]">
        {/* Dashboard Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow transition hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-sky-50 text-sky-700">
                <Users size={20} />
              </div>
              <div className="text-2xl font-bold text-slate-800 font-droid-kufi">{metrics?.totalLeads || 0}</div>
            </div>
            <h3 className="text-sm text-slate-500 font-medium mb-2">إجمالي العملاء المحتملين</h3>
            <p className="text-xs text-emerald-600 font-medium">+12% من الشهر الماضي</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow transition hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-700">
                <Building size={20} />
              </div>
              <div className="text-2xl font-bold text-slate-800 font-droid-kufi">{metrics?.activeProperties || 0}</div>
            </div>
            <h3 className="text-sm text-slate-500 font-medium mb-2">العقارات النشطة</h3>
            <p className="text-xs text-emerald-600 font-medium">+8% من الشهر الماضي</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow transition hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
                <Filter size={20} />
              </div>
              <div className="text-2xl font-bold text-slate-800 font-droid-kufi">{metrics?.dealsInPipeline || 0}</div>
            </div>
            <h3 className="text-sm text-slate-500 font-medium mb-2">الصفقات في المسار</h3>
            <p className="text-xs text-rose-600 font-medium">-2% من الشهر الماضي</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow transition hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-50 text-pink-700">
                <Banknote size={20} />
              </div>
              <div className="text-2xl font-bold text-slate-800 font-droid-kufi">{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
            </div>
            <h3 className="text-sm text-slate-500 font-medium mb-2">الإيرادات الشهرية</h3>
            <p className="text-xs text-emerald-600 font-medium">+24% من الشهر الماضي</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Leads & Activities */}
          <div className="lg:col-span-2 space-y-8">
            {/* Deal Pipeline Overview - Moved to Top */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-3 font-droid-kufi">
                  <Filter className="w-5 h-5 text-slate-500" />
                  مراحل الصفقات
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-xl font-semibold text-slate-700 mb-1 font-droid-kufi">
                      {metrics?.pipelineByStage?.lead || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">عملاء محتملين</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-xl font-semibold text-slate-700 mb-1 font-droid-kufi">
                      {metrics?.pipelineByStage?.qualified || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">مؤهل</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-xl font-semibold text-slate-700 mb-1 font-droid-kufi">
                      {metrics?.pipelineByStage?.showing || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">عرض</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-xl font-semibold text-slate-700 mb-1 font-droid-kufi">
                      {metrics?.pipelineByStage?.negotiation || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">تفاوض</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-xl font-semibold text-slate-700 mb-1 font-droid-kufi">
                      {metrics?.pipelineByStage?.closed || 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">مغلق</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-3 font-droid-kufi">
                    <Users className="w-5 h-5 text-slate-500" />
                    العملاء المحتملين الجدد
                  </h2>
                  <Button variant="ghost" className="text-sm font-medium text-gray-600 hover:text-gray-800">
                    عرض الكل
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    لا توجد عملاء محتملين. قم بإنشاء أول عميل محتمل للبدء.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentLeads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <span className="font-semibold text-gray-900 tracking-tight font-droid-kufi">{lead.firstName} {lead.lastName}</span>
                            <span className="text-sm text-gray-600">{lead.phone}</span>
                            <span className="text-sm text-gray-700 font-medium">{lead.city || 'غير محدد'}</span>
                            <span className="text-xs text-gray-500">{lead.age ? `${lead.age} سنة` : 'غير محدد'}</span>
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-3 font-droid-kufi">
                  <Plus className="w-5 h-5 text-slate-500" />
                  إجراءات سريعة
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-right hover:bg-slate-100 transition"
                    onClick={() => setAddLeadModalOpen(true)}
                  >
                    <Plus className="ml-3 text-gray-600" size={16} />
                    <span className="font-semibold text-gray-800">إضافة عميل محتمل جديد</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-right hover:bg-slate-100 transition"
                    onClick={() => setAddPropertyModalOpen(true)}
                  >
                    <Home className="ml-3 text-gray-600" size={16} />
                    <span className="font-semibold text-gray-800">إدراج عقار</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-right hover:bg-slate-100 transition">
                    <Calendar className="ml-3 text-gray-600" size={16} />
                    <span className="font-semibold text-gray-800">جدولة عرض</span>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-right hover:bg-slate-100 transition">
                    <Download className="ml-3 text-gray-600" size={16} />
                    <span className="font-semibold text-gray-800">تصدير العملاء المحتملين</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-3 font-droid-kufi">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  مهام اليوم
                </h2>
              </div>
              <div className="p-6">
                {!todaysActivities || todaysActivities.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    لا توجد مهام مجدولة لهذا اليوم
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                        <input 
                          type="checkbox" 
                          checked={activity.completed}
                          className="mt-1 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
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
