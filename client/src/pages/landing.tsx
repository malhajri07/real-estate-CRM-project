import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, BarChart3, MessageCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Building className="text-primary-foreground" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            نظام إدارة العقارات
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            نظام شامل لإدارة العقارات والعملاء مع أدوات متقدمة للتواصل والمتابعة
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="text-blue-600" size={24} />
              </div>
              <CardTitle className="text-lg">إدارة العملاء</CardTitle>
              <CardDescription>
                تتبع العملاء المحتملين وإدارة قاعدة بيانات شاملة للعملاء
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building className="text-green-600" size={24} />
              </div>
              <CardTitle className="text-lg">إدارة العقارات</CardTitle>
              <CardDescription>
                كتالوج شامل للعقارات مع تفاصيل كاملة وإدارة متقدمة
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-purple-600" size={24} />
              </div>
              <CardTitle className="text-lg">التواصل المباشر</CardTitle>
              <CardDescription>
                إرسال رسائل واتساب وإدارة حملات التسويق بسهولة
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Login Card */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
            <CardDescription>
              سجل دخولك للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full h-12 text-lg"
              data-testid="button-login"
            >
              تسجيل الدخول
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-slate-500">
                نظام آمن ومحمي لإدارة أعمالك العقارية
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features List */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            المزايا الرئيسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-slate-600">إدارة شاملة للعملاء المحتملين</span>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-slate-600">كتالوج متقدم للعقارات</span>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-slate-600">متابعة مراحل الصفقات</span>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-slate-600">رسائل واتساب المباشرة</span>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-slate-600">تقارير مفصلة وإحصائيات</span>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-slate-600">حملات تسويقية متقدمة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}