import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Calendar, Phone, CreditCard, Upload, ArrowRight, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import logoImage from "@assets/Aqaraty_logo_selected_1755461935189.png";

export default function SignupIndividual() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saudiId, setSaudiId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [certificationNumber, setCertificationNumber] = useState("");
  const [certificationStartDate, setCertificationStartDate] = useState("");
  const [certificationEndDate, setCertificationEndDate] = useState("");
  const [certificationFile, setCertificationFile] = useState<FileList | null>(null);
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Saudi regions
  const saudiRegions = [
    "الرياض",
    "مكة المكرمة", 
    "المدينة المنورة",
    "المنطقة الشرقية",
    "عسير",
    "تبوك",
    "القصيم",
    "حائل",
    "الحدود الشمالية",
    "جازان",
    "نجران",
    "الباحة",
    "الجوف"
  ];

  // Convert English numbers to Arabic numbers
  const toArabicNumerals = (str: string) => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
  };

  // Convert Arabic numbers to English for validation
  const toEnglishNumerals = (str: string) => {
    const englishNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return str.replace(/[٠-٩]/g, (digit) => {
      const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return englishNumerals[arabicNumerals.indexOf(digit)];
    });
  };

  const handleNumericInput = (value: string, setter: (val: string) => void) => {
    // Only allow Arabic numerals
    const arabicOnly = value.replace(/[^٠-٩]/g, '');
    setter(arabicOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !saudiId || !mobileNumber || !certificationNumber || !gender || !city || !certificationStartDate || !certificationEndDate) {
      toast({
        title: "خطأ في البيانات",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!certificationFile || certificationFile.length === 0) {
      toast({
        title: "مطلوب ملف الترخيص",
        description: "الرجاء رفع ملف ترخيص فال العقاري بصيغة PDF",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Convert Arabic numerals to English for validation
    const saudiIdEnglish = toEnglishNumerals(saudiId);
    const mobileEnglish = toEnglishNumerals(mobileNumber);

    // Validate Saudi ID (should be 10 digits)
    if (!/^\d{10}$/.test(saudiIdEnglish)) {
      toast({
        title: "رقم الهوية غير صحيح",
        description: "رقم الهوية الوطنية يجب أن يكون ١٠ أرقام",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate mobile number (Saudi format)
    if (!/^(05|5)\d{8}$/.test(mobileEnglish)) {
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
    setCertificationFile(e.target.files);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="gender" className="flex items-center">
                  <User size={16} className="ml-2" />
                  النوع *
                </Label>
                <Select value={gender} onValueChange={setGender} required>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="saudiId" className="flex items-center">
                  <CreditCard size={16} className="ml-2" />
                  رقم الهوية الوطنية *
                </Label>
                <Input
                  id="saudiId"
                  type="text"
                  value={saudiId}
                  onChange={(e) => handleNumericInput(e.target.value, setSaudiId)}
                  placeholder="أدخل رقم الهوية الوطنية (١٠ أرقام)"
                  required
                  className="text-right"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center">
                  <MapPin size={16} className="ml-2" />
                  المنطقة *
                </Label>
                <Select value={city} onValueChange={setCity} required>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر المنطقة" />
                  </SelectTrigger>
                  <SelectContent>
                    {saudiRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                onChange={(e) => handleNumericInput(e.target.value, setMobileNumber)}
                placeholder="٠٥xxxxxxxx"
                required
                className="text-right"
              />
            </div>

            {/* Certification Information */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200 space-y-6">
              <h4 className="font-bold text-green-800 text-lg flex items-center">
                <span className="w-3 h-3 bg-green-600 rounded-full ml-2"></span>
                معلومات ترخيص فال العقاري
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="certificationNumber" className="flex items-center font-semibold">
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
                  className="text-right bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificationStartDate" className="flex items-center font-semibold">
                    <Calendar size={16} className="ml-2" />
                    تاريخ بداية الترخيص *
                  </Label>
                  <Input
                    id="certificationStartDate"
                    type="date"
                    value={certificationStartDate}
                    onChange={(e) => setCertificationStartDate(e.target.value)}
                    required
                    className="text-right bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificationEndDate" className="flex items-center font-semibold">
                    <Calendar size={16} className="ml-2" />
                    تاريخ انتهاء الترخيص *
                  </Label>
                  <Input
                    id="certificationEndDate"
                    type="date"
                    value={certificationEndDate}
                    onChange={(e) => setCertificationEndDate(e.target.value)}
                    required
                    className="text-right bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificationFile" className="flex items-center font-semibold">
                  <Upload size={16} className="ml-2" />
                  ملف ترخيص فال العقاري (PDF) *
                </Label>
                <Input
                  id="certificationFile"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  required
                  className="text-right bg-white"
                />
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    📋 يجب رفع ملف ترخيص فال العقاري بصيغة PDF فقط
                  </p>
                </div>
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