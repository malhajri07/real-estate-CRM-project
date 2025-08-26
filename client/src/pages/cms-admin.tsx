import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cmsService, type LandingPageContent, type PricingPlan } from "@/lib/cms";
import { Settings, Save, Plus, Edit3, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export default function CMSAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [landingContent, setLandingContent] = useState<LandingPageContent | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // حالة تعديل محتوى صفحة الهبوط
  const [editContent, setEditContent] = useState<Partial<LandingPageContent>>({});

  useEffect(() => {
    loadCMSData();
  }, []);

  const loadCMSData = async () => {
    setIsLoading(true);
    try {
      const [contentData, plansData] = await Promise.all([
        cmsService.getLandingPageContent(),
        cmsService.getPricingPlans()
      ]);
      setLandingContent(contentData);
      setEditContent(contentData);
      setPricingPlans(plansData);
    } catch (error) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات CMS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLandingContent = async () => {
    if (!editContent) return;
    
    setIsSaving(true);
    try {
      const updatedContent = await cmsService.updateLandingPageContent(editContent);
      setLandingContent(updatedContent);
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث محتوى صفحة الهبوط",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ التعديلات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700">جار تحميل بيانات CMS...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 p-6" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 -m-6 mb-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
              <span className="text-2xl font-bold text-gray-900 hover:text-green-600 transition-colors" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>منصة عقاراتي</span>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Settings className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>
                إدارة المحتوى (CMS)
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* محتوى صفحة الهبوط */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ml-3">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>محتوى صفحة الهبوط</h2>
              </div>
              <Button 
                onClick={handleSaveLandingContent}
                disabled={isSaving}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/20"
              >
                <Save className="w-4 h-4 ml-2" />
                {isSaving ? 'جار الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">عنوان البطل الرئيسي</label>
                <Input
                  value={editContent.heroTitle || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                  className="text-right"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">زر الحث على العمل</label>
                <Input
                  value={editContent.heroButton || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, heroButton: e.target.value }))}
                  className="text-right"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">العنوان الفرعي للبطل</label>
              <Textarea
                value={editContent.heroSubtitle || ''}
                onChange={(e) => setEditContent(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                className="text-right min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">عنوان قسم الميزات</label>
                <Input
                  value={editContent.featuresTitle || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, featuresTitle: e.target.value }))}
                  className="text-right"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">عنوان قسم الإحصائيات</label>
                <Input
                  value={editContent.statsTitle || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, statsTitle: e.target.value }))}
                  className="text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">عنوان قسم الأسعار</label>
                <Input
                  value={editContent.pricingTitle || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, pricingTitle: e.target.value }))}
                  className="text-right"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">العنوان الفرعي للأسعار</label>
                <Input
                  value={editContent.pricingSubtitle || ''}
                  onChange={(e) => setEditContent(prev => ({ ...prev, pricingSubtitle: e.target.value }))}
                  className="text-right"
                />
              </div>
            </div>
          </div>
        </div>

        {/* خطط التسعير */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ml-3">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>خطط التسعير</h2>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/20">
                <Plus className="w-4 h-4 ml-2" />
                إضافة خطة جديدة
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pricingPlans.map((plan) => (
                <div key={plan.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>
                      {plan.name}
                    </h3>
                    {plan.isPopular && (
                      <Badge className="bg-green-100 text-green-800">الأكثر شعبية</Badge>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-500 mr-2">﷼ / شهرياً</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {plan.features.slice(0, 3).map((feature) => (
                      <div key={feature.id} className="flex items-center text-sm">
                        <span className={`w-4 h-4 ml-2 ${feature.included ? 'text-green-600' : 'text-red-600'}`}>
                          {feature.included ? '✓' : '✗'}
                        </span>
                        <span className={feature.included ? 'text-gray-900' : 'text-gray-500'}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit3 className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* معلومات الـ CMS */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm ml-3">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>معلومات النظام</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-green-600">CMS</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Strapi CMS</h3>
                <p className="text-sm text-gray-600">نظام إدارة المحتوى</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-blue-600">API</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">REST API</h3>
                <p className="text-sm text-gray-600">واجهة برمجة التطبيقات</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-purple-600">DB</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">SQLite</h3>
                <p className="text-sm text-gray-600">قاعدة البيانات</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}