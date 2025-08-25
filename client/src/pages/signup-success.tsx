import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/Aqaraty_logo_selected_1755461935189.png";

export default function SignupSuccess() {
  const [, setLocation] = useLocation();

  const handleBackToLanding = () => {
    setLocation("/");
  };

  const handleGoToLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="شعار عقاراتي" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            تم إرسال طلبك بنجاح!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-8">
            <p className="text-slate-600">
              شكراً لك على التسجيل في منصة عقاراتي
            </p>
            <div className="bg-green-50 p-4 rounded-lg text-right">
              <h4 className="font-semibold text-green-800 mb-2">الخطوات التالية:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• سيتم مراجعة طلبك خلال 24 ساعة</li>
                <li>• سنتواصل معك عبر الجوال أو البريد الإلكتروني</li>
                <li>• سيتم إرسال بيانات الدخول عند الموافقة</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleGoToLogin}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              تسجيل الدخول
            </Button>
            
            <Button 
              onClick={handleBackToLanding}
              variant="outline" 
              className="w-full text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة إلى الصفحة الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}