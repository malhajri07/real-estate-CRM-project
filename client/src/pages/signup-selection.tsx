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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Individual Account */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <User className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                حساب فردي
              </CardTitle>
              <p className="text-gray-600">
                للوكلاء العقاريين الأفراد
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-700">
                  <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>وصول فردي كامل للمنصة</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Building2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>إدارة العقارات والعملاء</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>تسجيل سريع بحساب جوجل</span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-green-800 mb-2">المستندات المطلوبة:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• ترخيص فال العقاري السعودي</li>
                  <li>• رقم الهوية الوطنية</li>
                  <li>• رقم الجوال</li>
                </ul>
              </div>

              <Button 
                onClick={handleIndividualSignup}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
              >
                إنشاء حساب فردي
              </Button>
            </CardContent>
          </Card>

          {/* Corporate Account */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                حساب الشركات
              </CardTitle>
              <p className="text-gray-600">
                للشركات والمؤسسات العقارية
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-700">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span>إدارة متعددة المستخدمين</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span>أدوات إدارة الشركات</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span>دعم فني مخصص</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">عملية التحقق:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• تفاصيل الشركة والتراخيص</li>
                  <li>• معلومات المسؤولين</li>
                  <li>• مراجعة وموافقة الفريق</li>
                </ul>
              </div>

              <Button 
                onClick={handleCorporateSignup}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
              >
                التقدم للحساب المؤسسي
              </Button>
            </CardContent>
          </Card>
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