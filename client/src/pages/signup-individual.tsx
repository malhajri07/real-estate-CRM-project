import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Calendar, Phone, CreditCard, Upload, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/Aqaraty_logo_selected_1755461935189.png";

export default function SignupIndividual() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saudiId, setSaudiId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [certificationNumber, setCertificationNumber] = useState("");
  const [certificationImages, setCertificationImages] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleGoogleSignup = () => {
    toast({
      title: "تسجيل الدخول بجوجل",
      description: "سيتم توجيهك لتسجيل الدخول بحساب جوجل...",
    });
    // TODO: Implement Google OAuth integration
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !saudiId || !mobileNumber || !certificationNumber) {
      toast({
        title: "خطأ في البيانات",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!certificationImages || certificationImages.length === 0) {
      toast({
        title: "مطلوب صور الترخيص",
        description: "الرجاء رفع صور ترخيص فال العقاري",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate Saudi ID (should be 10 digits)
    if (!/^\d{10}$/.test(saudiId)) {
      toast({
        title: "رقم الهوية غير صحيح",
        description: "رقم الهوية الوطنية يجب أن يكون 10 أرقام",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate mobile number (Saudi format)
    if (!/^(05|5)\d{8}$/.test(mobileNumber)) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "الرجاء إدخال رقم جوال سعودي صحيح",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Submit form to backend API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      toast({
        title: "تم إرسال طلبك بنجاح",
        description: "سيتم مراجعة طلبك والتواصل معك خلال 24 ساعة",
      });

      // Redirect to success page or login
      setLocation("/signup/success");
    } catch (error) {
      toast({
        title: "خطأ في إرسال الطلب",
        description: "حدث خطأ أثناء إرسال طلبك، الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertificationImages(e.target.files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="شعار عقاراتي" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            إنشاء حساب فردي
          </CardTitle>
          <p className="text-slate-600 mt-2">
            أدخل بياناتك لإنشاء حسابك الشخصي في منصة عقاراتي
          </p>
        </CardHeader>
        <CardContent>
          {/* Google Signup Option */}
          <div className="mb-8">
            <Button 
              onClick={handleGoogleSignup}
              variant="outline" 
              className="w-full py-3 text-lg border-2 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              تسجيل سريع بحساب جوجل
            </Button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-100 text-gray-500">أو أدخل بياناتك يدوياً</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center">
                  <User size={16} className="ml-2" />
                  الاسم الأول *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="أدخل الاسم الأول"
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center">
                  <User size={16} className="ml-2" />
                  اسم العائلة *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="أدخل اسم العائلة"
                  required
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center">
                <Calendar size={16} className="ml-2" />
                تاريخ الميلاد *
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saudiId" className="flex items-center">
                <CreditCard size={16} className="ml-2" />
                رقم الهوية الوطنية *
              </Label>
              <Input
                id="saudiId"
                type="text"
                value={saudiId}
                onChange={(e) => setSaudiId(e.target.value)}
                placeholder="أدخل رقم الهوية الوطنية (10 أرقام)"
                required
                className="text-right"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber" className="flex items-center">
                <Phone size={16} className="ml-2" />
                رقم الجوال *
              </Label>
              <Input
                id="mobileNumber"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="05xxxxxxxx"
                required
                className="text-right"
              />
            </div>

            {/* Certification Information */}
            <div className="bg-green-50 p-4 rounded-lg space-y-4">
              <h4 className="font-semibold text-green-800">معلومات ترخيص فال العقاري</h4>
              
              <div className="space-y-2">
                <Label htmlFor="certificationNumber" className="flex items-center">
                  <CreditCard size={16} className="ml-2" />
                  رقم ترخيص فال العقاري *
                </Label>
                <Input
                  id="certificationNumber"
                  type="text"
                  value={certificationNumber}
                  onChange={(e) => setCertificationNumber(e.target.value)}
                  placeholder="أدخل رقم الترخيص"
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificationImages" className="flex items-center">
                  <Upload size={16} className="ml-2" />
                  صور ترخيص فال العقاري *
                </Label>
                <Input
                  id="certificationImages"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  required
                  className="text-right"
                />
                <p className="text-sm text-green-600">
                  يمكنك رفع عدة صور لترخيص فال العقاري (أمامي وخلفي)
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "جار إرسال الطلب..." : "إنشاء الحساب"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/signup")}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة إلى خيارات التسجيل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}