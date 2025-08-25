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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-600 ml-3" />
              <span className="text-xl font-bold text-gray-900">منصة عقاراتي</span>
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
          <div className="relative px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Individual Account */}
              <div className="group cursor-pointer" onClick={handleIndividualSignup}>
                <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative p-10 text-center">
                    {/* Icon container with glass effect */}
                    <div className="relative mx-auto mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-600/30 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-green-200/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                        <User className="h-10 w-10 text-green-600" />
                      </div>
                      {/* Floating particles effect */}
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400/60 rounded-full blur-sm group-hover:animate-pulse"></div>
                      <div className="absolute -bottom-1 -left-2 w-3 h-3 bg-green-300/40 rounded-full blur-sm group-hover:animate-pulse delay-75"></div>
                    </div>
                    
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
                      حساب فردي
                    </h3>
                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                      للوكلاء العقاريين الأفراد والممارسين المستقلين
                    </p>
                    
                    <div className="space-y-4 mb-10">
                      <div className="flex items-center justify-end text-gray-700 group-hover:text-green-700 transition-colors duration-300">
                        <span className="mr-3 text-right font-medium">إدارة محفظة العقارات الشخصية</span>
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <Shield className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-end text-gray-700 group-hover:text-green-700 transition-colors duration-300">
                        <span className="mr-3 text-right font-medium">متابعة العملاء المحتملين</span>
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <Shield className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-end text-gray-700 group-hover:text-green-700 transition-colors duration-300">
                        <span className="mr-3 text-right font-medium">تقارير الأداء الشخصية</span>
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <Shield className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-end text-gray-700 group-hover:text-green-700 transition-colors duration-300">
                        <span className="mr-3 text-right font-medium">دعم فني على مدار الساعة</span>
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <Shield className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-[0_4px_20px_rgb(34,197,94,0.3)] hover:shadow-[0_8px_30px_rgb(34,197,94,0.4)] transform group-hover:scale-105 transition-all duration-300 border-0">
                        إنشاء حساب فردي
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corporate Account */}
              <div className="group cursor-pointer" onClick={handleCorporateSignup}>
                <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative p-10 text-center">
                    {/* Icon container with glass effect */}
                    <div className="relative mx-auto mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400/20 to-blue-600/30 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-blue-200/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-lg">
                        <Building2 className="h-10 w-10 text-blue-600" />
                      </div>
                      {/* Floating particles effect */}
                      <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-400/60 rounded-full blur-sm group-hover:animate-pulse"></div>
                      <div className="absolute -bottom-1 -right-2 w-3 h-3 bg-blue-300/40 rounded-full blur-sm group-hover:animate-pulse delay-75"></div>
                    </div>
                    
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
                      حساب مؤسسي
                    </h3>
                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                      للشركات العقارية والمكاتب العقارية الكبيرة
                    </p>
                    
                    <div className="space-y-4 mb-10">
                      <div className="flex items-center justify-end text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
                        <span className="mr-3 text-right font-medium">إدارة فرق العمل المتعددة</span>
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-end text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
                        <span className="mr-3 text-right font-medium">تقارير شاملة للشركة</span>
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-end text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
                        <span className="mr-3 text-right font-medium">صلاحيات مرنة للموظفين</span>
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-end text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
                        <span className="mr-3 text-right font-medium">دعم فني مخصص</span>
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-[0_4px_20px_rgb(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.4)] transform group-hover:scale-105 transition-all duration-300 border-0">
                        إنشاء حساب مؤسسي
                      </Button>
                    </div>
                  </div>
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