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
                  
                  <ul className="text-right space-y-3 mb-8 text-gray-600">
                    <li className="flex items-center justify-end">
                      <span className="mr-3">إدارة محفظة العقارات الشخصية</span>
                      <Shield className="h-5 w-5 text-green-500" />
                    </li>
                    <li className="flex items-center justify-end">
                      <span className="mr-3">متابعة العملاء المحتملين</span>
                      <Shield className="h-5 w-5 text-green-500" />
                    </li>
                    <li className="flex items-center justify-end">
                      <span className="mr-3">تقارير الأداء الشخصية</span>
                      <Shield className="h-5 w-5 text-green-500" />
                    </li>
                    <li className="flex items-center justify-end">
                      <span className="mr-3">دعم فني على مدار الساعة</span>
                      <Shield className="h-5 w-5 text-green-500" />
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={handleIndividualSignup} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors duration-300 group-hover:shadow-lg"
                  >
                    إنشاء حساب فردي
                  </Button>
                </div>
              </div>

              {/* Corporate Account */}
              <div className="group cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-500 p-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Building2 className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    حساب مؤسسي
                  </h3>
                  <p className="text-gray-600 mb-8">
                    للشركات العقارية والمكاتب العقارية الكبيرة
                  </p>
                  
                  <ul className="text-right space-y-3 mb-8 text-gray-600">
                    <li className="flex items-center justify-end">
                      <span className="mr-3">إدارة فرق العمل المتعددة</span>
                      <Users className="h-5 w-5 text-blue-500" />
                    </li>
                    <li className="flex items-center justify-end">
                      <span className="mr-3">تقارير شاملة للشركة</span>
                      <Users className="h-5 w-5 text-blue-500" />
                    </li>
                    <li className="flex items-center justify-end">
                      <span className="mr-3">صلاحيات مرنة للموظفين</span>
                      <Users className="h-5 w-5 text-blue-500" />
                    </li>
                    <li className="flex items-center justify-end">
                      <span className="mr-3">دعم فني مخصص</span>
                      <Users className="h-5 w-5 text-blue-500" />
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={handleCorporateSignup} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-300 group-hover:shadow-lg"
                  >
                    إنشاء حساب مؤسسي
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-gray-300 to-transparent hidden md:block"></div>
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