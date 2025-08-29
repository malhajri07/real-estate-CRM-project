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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-12 text-center">
          <div className="flex justify-center mb-6">
            <img 
              src={logoImage} 
              alt="شعار عقاراتي" 
              className="w-24 h-24 object-contain drop-shadow-lg"
            />
          </div>
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-100 drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Janat Bold, Noto Sans Arabic' }}>
            تم إرسال طلبك بنجاح!
          </h1>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <div className="space-y-6 mb-8">
            <p className="text-slate-600 text-lg text-center">
              شكراً لك على التسجيل في منصة عقاراتي
            </p>
            <div className="bg-green-50/80 backdrop-blur-sm p-6 rounded-2xl border border-green-200 text-right">
              <h4 className="font-semibold text-green-800 mb-4 text-lg">الخطوات التالية:</h4>
              <ul className="text-green-700 space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>سيتم مراجعة طلبك خلال 24 ساعة</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>سنتواصل معك عبر الجوال أو البريد الإلكتروني</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>سيتم إرسال بيانات الدخول عند الموافقة</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleGoToLogin}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              تسجيل الدخول
            </Button>
            
            <Button 
              onClick={handleBackToLanding}
              variant="outline" 
              className="w-full h-12 text-gray-600 border-gray-200 hover:bg-gray-50 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة إلى الصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}