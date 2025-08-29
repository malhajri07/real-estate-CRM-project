import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Building2, User, Shield, Users, Phone, Mail, MapPin } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
              <Building className="h-8 w-8 text-green-600 ml-3" />
              <span className="text-xl font-bold text-gray-900 hover:text-green-600 transition-colors">منصة عقاراتي</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center p-4 py-20">
        <div className="w-full max-w-4xl">
          {/* Content Header */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Individual Account */}
            <div className="group cursor-pointer" onClick={handleIndividualSignup}>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500 p-10 hover:border-green-200/70">
                <div className="text-right">
                  <div className="flex justify-end mb-8">
                    <div className="w-18 h-18 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl flex items-center justify-center group-hover:from-green-100 group-hover:to-green-150 transition-all duration-300 shadow-sm">
                      <User className="h-9 w-9 text-green-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-right tracking-tight">
                    حساب الأفراد
                  </h3>
                  <p className="text-gray-600 mb-10 text-right leading-7 text-lg">
                    للوسطاء العقاريين الأفراد والممارسين المستقلين
                  </p>
                  
                  <div className="space-y-4 mb-12">
                    <div className="flex items-center text-gray-700 text-base">
                      <div className="w-2 h-2 bg-green-400 rounded-full ml-4"></div>
                      <span className="text-right font-medium">إدارة محفظة العقارات الشخصية</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-base">
                      <div className="w-2 h-2 bg-green-400 rounded-full ml-4"></div>
                      <span className="text-right font-medium">متابعة العملاء المحتملين</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-base">
                      <div className="w-2 h-2 bg-green-400 rounded-full ml-4"></div>
                      <span className="text-right font-medium">تقارير الأداء الشخصية</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-base">
                      <div className="w-2 h-2 bg-green-400 rounded-full ml-4"></div>
                      <span className="text-right font-medium">دعم فني على مدار الساعة</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-2xl font-semibold text-lg shadow-[0_4px_20px_rgba(34,197,94,0.25)] hover:shadow-[0_6px_25px_rgba(34,197,94,0.35)] transition-all duration-300 transform hover:scale-[1.02]">
                    إنشاء حساب الأفراد
                  </Button>
                </div>
              </div>
            </div>

            {/* Corporate Account */}
            <div className="group cursor-pointer" onClick={handleCorporateSignup}>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500 p-10 hover:border-green-200/70">
                <div className="text-right">
                  <div className="flex justify-end mb-8">
                    <div className="w-18 h-18 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl flex items-center justify-center group-hover:from-green-100 group-hover:to-green-150 transition-all duration-300 shadow-sm">
                      <Building2 className="h-9 w-9 text-green-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-right tracking-tight">
                    حساب الشركات والمؤسسات
                  </h3>
                  <p className="text-gray-600 mb-10 text-right leading-7 text-lg">
                    للشركات العقارية والمكاتب العقارية الكبيرة
                  </p>
                  
                  <div className="space-y-4 mb-12">
                    <div className="flex items-center text-gray-700 text-base">
                      <div className="w-2 h-2 bg-green-400 rounded-full ml-4"></div>
                      <span className="text-right font-medium">إدارة فرق العمل المتعددة</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-base">
                      <div className="w-2 h-2 bg-green-400 rounded-full ml-4"></div>
                      <span className="text-right font-medium">تقارير شاملة للشركة</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-base">
                      <div className="w-2 h-2 bg-green-400 rounded-full ml-4"></div>
                      <span className="text-right font-medium">صلاحيات مرنة للموظفين</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-base">
                      <div className="w-2 h-2 bg-green-400 rounded-full ml-4"></div>
                      <span className="text-right font-medium">دعم فني مخصص</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-2xl font-semibold text-lg shadow-[0_4px_20px_rgba(34,197,94,0.25)] hover:shadow-[0_6px_25px_rgba(34,197,94,0.35)] transition-all duration-300 transform hover:scale-[1.02]">
                    إنشاء حساب الشركات والمؤسسات
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-12">
            <p className="text-gray-500">
              هل لديك حساب بالفعل؟ 
              <a href="/login" className="text-green-600 hover:text-green-700 font-semibold mr-1">
                تسجيل الدخول
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building className="h-8 w-8 text-green-400 ml-3" />
                <span className="text-xl font-bold">منصة عقاراتي</span>
              </div>
              <p className="text-gray-400 mb-4">
                نظام شامل لإدارة العقارات والعملاء والصفقات مع واجهة حديثة وسهلة الاستخدام
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-green-400">الرئيسية</a></li>
                <li><a href="#features" className="hover:text-green-400">المميزات</a></li>
                <li><a href="#solutions" className="hover:text-green-400">الحلول</a></li>
                <li><a href="#pricing" className="hover:text-green-400">الأسعار</a></li>
                <li><a href="#contact" className="hover:text-green-400">اتصل بنا</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">الدعم</h3>
              <ul className="space-y-2 text-gray-400">
                <li>الهاتف: +966 50 123 4567</li>
                <li>البريد: info@aqaraty.sa</li>
                <li>الدعم الفني متاح 24/7</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>جميع الحقوق محفوظة © 2025 منصة عقاراتي لإدارة العقارات</p>
          </div>
        </div>
      </footer>
    </div>
  );
}