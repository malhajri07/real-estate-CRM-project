import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Phone, Mail, MapPin, Upload, ArrowRight, FileText, Building, Check } from "lucide-react";
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
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
                <div className="flex items-center mb-8">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">معلومات الشركة</h2>
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
                      <SelectContent position="popper" sideOffset={4} align="end">
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
                      <SelectContent position="popper" sideOffset={4} align="end">
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
                      <SelectContent position="popper" sideOffset={4} align="end">
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
                <div className="flex items-center mb-8 pt-8 border-t border-gray-100">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">معلومات الشخص المسؤول</h2>
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
                <div className="flex items-center mb-8 pt-8 border-t border-gray-100">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">المستندات المطلوبة (اختيارية)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="commercialRegDoc" className="text-sm font-medium text-gray-700 text-right block flex items-center justify-end">
                      <span className="mr-2">صورة السجل التجاري</span>
                      <Upload className="w-4 h-4" />
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
                    <Label htmlFor="vatCertificate" className="text-sm font-medium text-gray-700 text-right block flex items-center justify-end">
                      <span className="mr-2">شهادة التسجيل في ضريبة القيمة المضافة</span>
                      <Upload className="w-4 h-4" />
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
                    <Label htmlFor="companyProfile" className="text-sm font-medium text-gray-700 text-right block flex items-center justify-end">
                      <span className="mr-2">ملف تعريف الشركة</span>
                      <Upload className="w-4 h-4" />
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

              {/* Terms and Conditions */}
              <div className="space-y-6">
                <div className="flex items-center mb-8 pt-8 border-t border-gray-100">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">الشروط والأحكام</h2>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl max-h-80 overflow-y-auto">
                  <div className="space-y-4 text-sm text-gray-700 text-right">
                    <h3 className="font-semibold text-base text-gray-900">شروط استخدام منصة عقاراتي:</h3>
                    
                    <div className="space-y-3">
                      <p><strong>1. القبول والاتفاقية:</strong></p>
                      <p>باستخدام هذه المنصة، فإنك توافق على جميع الشروط والأحكام المدرجة أدناه. إذا كنت لا توافق على أي من هذه الشروط، فلا يحق لك استخدام خدماتنا.</p>
                      
                      <p><strong>2. نطاق الخدمة:</strong></p>
                      <p>توفر منصة عقاراتي نظاماً شاملاً لإدارة العقارات والعملاء والصفقات العقارية. نحتفظ بالحق في تعديل أو تحديث خدماتنا في أي وقت دون إشعار مسبق.</p>
                      
                      <p><strong>3. التزامات المستخدم:</strong></p>
                      <ul className="space-y-2 mr-4">
                        <li>• تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
                        <li>• عدم إساءة استخدام النظام أو انتهاك حقوق المستخدمين الآخرين</li>
                        <li>• الحفاظ على سرية بيانات الدخول والحسابات</li>
                        <li>• الالتزام بالقوانين السعودية والأنظمة المعمول بها</li>
                        <li>• عدم نشر محتوى مخالف أو ضار أو غير قانوني</li>
                      </ul>

                      <p><strong>4. الخصوصية وحماية البيانات:</strong></p>
                      <p>نلتزم بحماية خصوصيتك وبياناتك الشخصية وفقاً لنظام حماية البيانات الشخصية السعودي. لن نشارك معلوماتك مع أطراف ثالثة إلا بموافقتك الصريحة.</p>
                      
                      <p><strong>5. الرسوم والمدفوعات:</strong></p>
                      <ul className="space-y-2 mr-4">
                        <li>• جميع الرسوم محددة في خطة الاشتراك المختارة</li>
                        <li>• الدفع يتم شهرياً أو سنوياً حسب الاختيار</li>
                        <li>• لا توجد استردادات للمبالغ المدفوعة</li>
                        <li>• نحتفظ بالحق في تغيير الأسعار مع إشعار مسبق 30 يوماً</li>
                      </ul>

                      <p><strong>6. المسؤولية القانونية:</strong></p>
                      <p>لا نتحمل المسؤولية عن أي أضرار مباشرة أو غير مباشرة قد تنتج عن استخدام منصتنا. استخدام الخدمة على مسؤوليتك الخاصة.</p>
                      
                      <p><strong>7. الملكية الفكرية:</strong></p>
                      <p>جميع حقوق الملكية الفكرية للمنصة محفوظة لشركة عقاراتي. لا يحق لك نسخ أو توزيع أو تعديل أي جزء من النظام دون إذن كتابي مسبق.</p>
                      
                      <p><strong>8. إنهاء الخدمة:</strong></p>
                      <p>نحتفظ بالحق في إيقاف أو إنهاء حسابك في حالة انتهاك هذه الشروط. كما يمكنك إلغاء حسابك في أي وقت من خلال الإعدادات.</p>
                      
                      <p><strong>9. تعديل الشروط:</strong></p>
                      <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات مهمة عبر البريد الإلكتروني أو من خلال المنصة.</p>
                      
                      <p><strong>10. القانون المطبق:</strong></p>
                      <p>تخضع هذه الاتفاقية للقوانين السعودية، وأي نزاع يخضع لاختصاص المحاكم السعودية المختصة.</p>
                      
                      <p><strong>11. معلومات الاتصال:</strong></p>
                      <p>للاستفسارات حول هذه الشروط، يمكنك التواصل معنا على: support@aqaraty.sa أو هاتف: +966501234567</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="flex items-center h-5">
                    <input
                      id="terms-agreement"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <div className="text-sm">
                    <Label htmlFor="terms-agreement" className="text-gray-700 text-right cursor-pointer">
                      أوافق على جميع الشروط والأحكام المذكورة أعلاه وأقر بأنني قد قرأتها وفهمتها بالكامل. كما أوافق على سياسة الخصوصية وشروط الاستخدام لمنصة عقاراتي.
                    </Label>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl h-14 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !agreedToTerms}
                >
                  {isLoading ? "جار إرسال الطلب..." : "إرسال طلب التحقق"}
                </Button>
                {!agreedToTerms && (
                  <p className="text-sm text-red-600 mt-2 text-center">يجب الموافقة على الشروط والأحكام قبل المتابعة</p>
                )}
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
            <div className="mt-12 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 p-8 rounded-2xl shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-xl">ماذا يحدث بعد ذلك؟</h3>
              </div>
              <div className="space-y-4 text-right">
                <div className="flex items-start bg-white/50 p-4 rounded-xl">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mt-1 ml-4 flex-shrink-0 shadow-sm"></div>
                  <p className="text-slate-700 font-medium">سيقوم فريق المراجعة بدراسة طلبك خلال 48 ساعة</p>
                </div>
                <div className="flex items-start bg-white/50 p-4 rounded-xl">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mt-1 ml-4 flex-shrink-0 shadow-sm"></div>
                  <p className="text-slate-700 font-medium">قد نطلب مستندات إضافية أو توضيحات</p>
                </div>
                <div className="flex items-start bg-white/50 p-4 rounded-xl">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mt-1 ml-4 flex-shrink-0 shadow-sm"></div>
                  <p className="text-slate-700 font-medium">سنتواصل معك لترتيب مكالمة تعريفية</p>
                </div>
                <div className="flex items-start bg-white/50 p-4 rounded-xl">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mt-1 ml-4 flex-shrink-0 shadow-sm"></div>
                  <p className="text-slate-700 font-medium">عند الموافقة، سيتم إنشاء حسابكم وإرسال بيانات الدخول</p>
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