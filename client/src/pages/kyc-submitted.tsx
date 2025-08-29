import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowRight, Mail, Phone } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/Aqaraty_logo_selected_1755461935189.png";

export default function KYCSubmitted() {
  const [, setLocation] = useLocation();

  const handleBackToLanding = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
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
            <Clock className="w-16 h-16 text-green-100 drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Droid Arabic Kufi, Janat Bold, Noto Sans Arabic' }}>
            تم استلام طلب الحساب المؤسسي
          </h1>
          <p className="text-green-100 text-lg">
            شكراً لاهتمامك بالانضمام إلى منصة عقاراتي
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <div className="space-y-6 mb-8">
            <div className="bg-green-50/80 backdrop-blur-sm p-6 rounded-2xl border border-green-200 text-right">
              <h4 className="font-semibold text-green-800 mb-6 text-lg">عملية المراجعة والموافقة:</h4>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div>
                    <h5 className="font-semibold text-green-800 mb-1">المراجعة الأولية</h5>
                    <p className="text-green-700">سيتم مراجعة طلبك وتدقيق المعلومات خلال 48 ساعة</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <h5 className="font-semibold text-green-800 mb-1">التحقق من الوثائق</h5>
                    <p className="text-green-700">قد نطلب مستندات إضافية أو توضيحات</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <div>
                    <h5 className="font-semibold text-green-800 mb-1">المكالمة التعريفية</h5>
                    <p className="text-green-700">سنتواصل معك لترتيب مكالمة لمناقشة احتياجاتك</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                  <div>
                    <h5 className="font-semibold text-green-800 mb-1">إنشاء الحساب</h5>
                    <p className="text-green-700">عند الموافقة، سيتم إنشاء حسابكم وإرسال بيانات الدخول</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 text-green-600 mb-3">
                  <Mail className="w-5 h-5" />
                  <span className="font-semibold">البريد الإلكتروني</span>
                </div>
                <p className="text-gray-700 font-medium">info@aqaraty.sa</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 text-green-600 mb-3">
                  <Phone className="w-5 h-5" />
                  <span className="font-semibold">الهاتف</span>
                </div>
                <p className="text-gray-700 font-medium">+966 50 123 4567</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleBackToLanding}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              العودة إلى الصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}