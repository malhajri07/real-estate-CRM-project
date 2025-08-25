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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="شعار عقاراتي" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <div className="flex justify-center mb-4">
            <Clock className="w-16 h-16 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            تم استلام طلب الحساب المؤسسي
          </CardTitle>
          <p className="text-slate-600 mt-2">
            شكراً لاهتمامك بالانضمام إلى منصة عقاراتي
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg text-right">
              <h4 className="font-semibold text-blue-800 mb-4">عملية المراجعة والموافقة:</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h5 className="font-semibold text-blue-800">المراجعة الأولية</h5>
                    <p className="text-sm text-blue-700">سيتم مراجعة طلبك وتدقيق المعلومات خلال 48 ساعة</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h5 className="font-semibold text-blue-800">التحقق من الوثائق</h5>
                    <p className="text-sm text-blue-700">قد نطلب مستندات إضافية أو توضيحات</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h5 className="font-semibold text-blue-800">المكالمة التعريفية</h5>
                    <p className="text-sm text-blue-700">سنتواصل معك لترتيب مكالمة لمناقشة احتياجاتك</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h5 className="font-semibold text-green-800">إنشاء الحساب</h5>
                    <p className="text-sm text-green-700">عند الموافقة، سيتم إنشاء حسابكم وإرسال بيانات الدخول</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <Mail className="w-5 h-5" />
                  <span className="font-semibold">البريد الإلكتروني</span>
                </div>
                <p className="text-gray-600">info@aqaraty.sa</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <Phone className="w-5 h-5" />
                  <span className="font-semibold">الهاتف</span>
                </div>
                <p className="text-gray-600">+966 50 123 4567</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleBackToLanding}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              العودة إلى الصفحة الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}