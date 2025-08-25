import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, Shield, Users } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/Aqaraty_logo_selected_1755461935189.png";

export default function SignupSelection() {
  const [, setLocation] = useLocation();

  const handleIndividualSignup = () => {
    setLocation("/signup/individual");
  };

  const handleCorporateSignup = () => {
    setLocation("/signup/corporate");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src={logoImage} 
              alt="شعار عقاراتي" 
              className="w-32 h-32 object-contain"
              style={{ 
                filter: 'drop-shadow(0 0 0 transparent)',
                background: 'transparent'
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            انضم إلى منصة عقاراتي
          </h1>
          <p className="text-slate-600 text-lg">
            اختر نوع الحساب المناسب لك
          </p>
        </div>

        {/* Account Type Selection */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Individual Account */}
            <div className="group cursor-pointer hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 transition-all duration-500 p-8 border-r border-gray-200">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <User className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  حساب فردي
                </h3>
                <p className="text-gray-600 mb-8">
                  للوكلاء العقاريين الأفراد والممارسين المستقلين
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 text-gray-700 p-3 rounded-lg bg-white/50">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <span>وصول فردي كامل للمنصة</span>
                </div>
                <div className="flex items-center gap-4 text-gray-700 p-3 rounded-lg bg-white/50">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-green-600" />
                  </div>
                  <span>إدارة العقارات والعملاء</span>
                </div>
                <div className="flex items-center gap-4 text-gray-700 p-3 rounded-lg bg-white/50">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <span>تقارير مفصلة وتحليلات</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl mb-6 border border-green-200">
                <h4 className="font-bold text-green-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full ml-2"></span>
                  المستندات المطلوبة:
                </h4>
                <ul className="text-sm text-green-700 space-y-2">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2"></span>
                    ترخيص فال العقاري السعودي
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2"></span>
                    رقم الهوية الوطنية
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2"></span>
                    رقم الجوال
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleIndividualSignup}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                إنشاء حساب فردي
              </Button>
            </div>

            {/* Divider */}
            <div className="absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent transform -translate-x-1/2 hidden md:block"></div>

            {/* Corporate Account */}
            <div className="group cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-500 p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Building2 className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  حساب الشركات
                </h3>
                <p className="text-gray-600 mb-8">
                  للشركات والمؤسسات العقارية الكبيرة
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 text-gray-700 p-3 rounded-lg bg-white/50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>إدارة متعددة المستخدمين</span>
                </div>
                <div className="flex items-center gap-4 text-gray-700 p-3 rounded-lg bg-white/50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>أدوات إدارة الشركات</span>
                </div>
                <div className="flex items-center gap-4 text-gray-700 p-3 rounded-lg bg-white/50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>دعم فني مخصص</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl mb-6 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full ml-2"></span>
                  عملية التحقق:
                </h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-2"></span>
                    تفاصيل الشركة والتراخيص
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-2"></span>
                    معلومات المسؤولين
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-2"></span>
                    مراجعة وموافقة الفريق
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleCorporateSignup}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                التقدم للحساب المؤسسي
              </Button>
            </div>
          </div>
        </div>

        {/* Back to Landing */}
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            العودة إلى الصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}