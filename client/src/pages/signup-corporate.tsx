import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Phone, Mail, MapPin, Upload, ArrowRight, FileText, Building } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/Aqaraty_logo_selected_1755461935189.png";

export default function SignupCorporate() {
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [commercialRegistration, setCommercialRegistration] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [establishmentDate, setEstablishmentDate] = useState("");
  const [employeesCount, setEmployeesCount] = useState("");
  
  // Contact Person Info
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  
  // Documents
  const [commercialRegDoc, setCommercialRegDoc] = useState<FileList | null>(null);
  const [vatCertificate, setVatCertificate] = useState<FileList | null>(null);
  const [companyProfile, setCompanyProfile] = useState<FileList | null>(null);
  
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
    if (!companyName || !companyType || !commercialRegistration || !contactName || !contactEmail || !contactPhone) {
      toast({
        title: "خطأ في البيانات",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast({
        title: "البريد الإلكتروني غير صحيح",
        description: "الرجاء إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Convert Arabic numerals to English for validation
    const phoneEnglish = toEnglishNumerals(contactPhone);
    const commercialRegEnglish = toEnglishNumerals(commercialRegistration);

    // Validate phone
    if (!/^(05|5)\d{8}$/.test(phoneEnglish)) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "الرجاء إدخال رقم جوال سعودي صحيح",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Submit KYC application to backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      toast({
        title: "تم إرسال طلبك بنجاح",
        description: "سيقوم فريقنا بمراجعة طلبك والتواصل معك خلال 48 ساعة",
      });

      setLocation("/signup/kyc-submitted");
    } catch (error) {
      toast({
        title: "خطأ في إرسال الطلب",
        description: "حدث خطأ أثناء إرسال طلبك، الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white" dir="rtl">
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

      {/* Main Content */}
      <div className="flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
          {/* Header Section */}
          <div className="text-center px-8 py-12 border-b border-gray-100">
            <div className="flex justify-center mb-6">
              <img 
                src={logoImage} 
                alt="شعار عقاراتي" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              طلب حساب مؤسسي
            </h1>
            <p className="text-lg text-gray-600 leading-7">
              أدخل تفاصيل شركتك لبدء عملية التحقق والموافقة
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Company Information */}
              <div className="space-y-6">
                <div className="flex items-center justify-end mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mr-3">معلومات الشركة</h2>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 text-right block">
                      اسم الشركة *
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="أدخل اسم الشركة"
                      required
                      className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="companyType" className="text-sm font-medium text-gray-700 text-right block">
                      نوع الشركة *
                    </Label>
                    <Select value={companyType} onValueChange={setCompanyType} required>
                      <SelectTrigger className="text-right h-12 border-gray-200 rounded-xl">
                        <SelectValue placeholder="اختر نوع الشركة" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="llc">شركة ذات مسؤولية محدودة</SelectItem>
                        <SelectItem value="corporation">شركة مساهمة</SelectItem>
                        <SelectItem value="partnership">شركة تضامن</SelectItem>
                        <SelectItem value="sole-proprietorship">مؤسسة فردية</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="commercialRegistration" className="text-sm font-medium text-gray-700 text-right block">
                      رقم السجل التجاري *
                    </Label>
                    <Input
                      id="commercialRegistration"
                      type="text"
                      value={commercialRegistration}
                      onChange={(e) => handleNumericInput(e.target.value, setCommercialRegistration)}
                      placeholder="أدخل رقم السجل التجاري"
                      required
                      className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="taxNumber" className="text-sm font-medium text-gray-700 text-right block">
                      الرقم الضريبي
                    </Label>
                    <Input
                      id="taxNumber"
                      type="text"
                      value={taxNumber}
                      onChange={(e) => handleNumericInput(e.target.value, setTaxNumber)}
                      placeholder="أدخل الرقم الضريبي"
                      className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="establishmentDate" className="text-sm font-medium text-gray-700 text-right block">
                      تاريخ التأسيس
                    </Label>
                    <Input
                      id="establishmentDate"
                      type="date"
                      value={establishmentDate}
                      onChange={(e) => setEstablishmentDate(e.target.value)}
                      className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="employeesCount" className="text-sm font-medium text-gray-700 text-right block">
                      عدد الموظفين
                    </Label>
                    <Select value={employeesCount} onValueChange={setEmployeesCount}>
                      <SelectTrigger className="text-right h-12 border-gray-200 rounded-xl">
                        <SelectValue placeholder="اختر عدد الموظفين" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="1-10">1-10 موظفين</SelectItem>
                        <SelectItem value="11-50">11-50 موظف</SelectItem>
                        <SelectItem value="51-200">51-200 موظف</SelectItem>
                        <SelectItem value="200+">أكثر من 200 موظف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="companyAddress" className="text-sm font-medium text-gray-700 text-right block">
                    عنوان الشركة
                  </Label>
                  <Input
                    id="companyAddress"
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="أدخل العنوان التفصيلي"
                    className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="companyCity" className="text-sm font-medium text-gray-700 text-right block">
                      المنطقة
                    </Label>
                    <Select value={companyCity} onValueChange={setCompanyCity}>
                      <SelectTrigger className="text-right h-12 border-gray-200 rounded-xl">
                        <SelectValue placeholder="اختر المنطقة" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        {saudiRegions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="companyWebsite" className="text-sm font-medium text-gray-700 text-right block">
                      الموقع الإلكتروني
                    </Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="companyDescription" className="text-sm font-medium text-gray-700 text-right block">
                    نبذة عن الشركة
                  </Label>
                  <Textarea
                    id="companyDescription"
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    placeholder="اكتب نبذة مختصرة عن نشاط الشركة وخدماتها..."
                    className="text-right min-h-[80px] border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Contact Person Information */}
              <div className="space-y-6">
                <div className="flex items-center justify-end mb-8 pt-8 border-t border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mr-3">معلومات الشخص المسؤول</h2>
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="contactName" className="text-sm font-medium text-gray-700 text-right block">
                      الاسم الكامل *
                    </Label>
                    <Input
                      id="contactName"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="أدخل الاسم الكامل"
                      required
                      className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="contactPosition" className="text-sm font-medium text-gray-700 text-right block">
                      المنصب
                    </Label>
                    <Input
                      id="contactPosition"
                      type="text"
                      value={contactPosition}
                      onChange={(e) => setContactPosition(e.target.value)}
                      placeholder="أدخل المنصب الوظيفي"
                      className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700 text-right block">
                      البريد الإلكتروني *
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="example@company.com"
                      required
                      className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700 text-right block">
                      رقم الجوال *
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => handleNumericInput(e.target.value, setContactPhone)}
                      placeholder="٠٥xxxxxxxx"
                      required
                      className="text-right h-12 border-gray-200 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Required Documents */}
              <div className="space-y-6">
                <div className="flex items-center justify-end mb-8 pt-8 border-t border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mr-3">المستندات المطلوبة (اختيارية)</h2>
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="commercialRegDoc" className="text-sm font-medium text-gray-700 text-right block">
                      صورة السجل التجاري
                    </Label>
                    <Input
                      id="commercialRegDoc"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setCommercialRegDoc(e.target.files)}
                      className="text-right h-12 border-gray-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="vatCertificate" className="text-sm font-medium text-gray-700 text-right block">
                      شهادة التسجيل في ضريبة القيمة المضافة
                    </Label>
                    <Input
                      id="vatCertificate"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setVatCertificate(e.target.files)}
                      className="text-right h-12 border-gray-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="companyProfile" className="text-sm font-medium text-gray-700 text-right block">
                      ملف تعريف الشركة
                    </Label>
                    <Input
                      id="companyProfile"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setCompanyProfile(e.target.files)}
                      className="text-right h-12 border-gray-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                  <p className="text-sm text-orange-700 font-medium text-right">
                    📋 جميع الملفات يجب أن تكون بصيغة PDF فقط
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl h-14 transition-colors shadow-sm hover:shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? "جار إرسال الطلب..." : "إرسال طلب التحقق"}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/signup")}
                className="text-gray-600 border-gray-200 hover:bg-gray-50 h-12 px-6 rounded-xl"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة إلى خيارات التسجيل
              </Button>
            </div>

            {/* What happens next */}
            <div className="mt-12 bg-blue-50 border border-blue-100 p-6 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-4 text-right text-lg">ماذا يحدث بعد ذلك؟</h3>
              <div className="space-y-3 text-right">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 ml-4 flex-shrink-0"></div>
                  <p className="text-blue-700">سيقوم فريق المراجعة بدراسة طلبك خلال 48 ساعة</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 ml-4 flex-shrink-0"></div>
                  <p className="text-blue-700">قد نطلب مستندات إضافية أو توضيحات</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 ml-4 flex-shrink-0"></div>
                  <p className="text-blue-700">سنتواصل معك لترتيب مكالمة تعريفية</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 ml-4 flex-shrink-0"></div>
                  <p className="text-blue-700">عند الموافقة، سيتم إنشاء حسابكم وإرسال بيانات الدخول</p>
                </div>
              </div>
            </div>
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