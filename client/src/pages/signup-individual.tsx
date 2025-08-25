import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Calendar, Phone, CreditCard, Upload, ArrowRight, MapPin, Building, FileText, Check } from "lucide-react";
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

    // Check terms agreement first
    if (!agreedToTerms) {
      toast({
        title: "الموافقة على الشروط مطلوبة",
        description: "يجب الموافقة على الشروط والأحكام قبل المتابعة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-20">
            <div className="flex items-center">
              <img 
                src={logoImage} 
                alt="شعار عقاراتي" 
                className="w-12 h-12 object-contain ml-3"
              />
              <span className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>منصة عقاراتي</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-4xl bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>إنشاء حساب فردي</h1>
              <p className="text-blue-100 text-lg">انضم إلى منصة عقاراتي كوسيط عقاري معتمد</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">

            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Personal Information */}
              <div className="space-y-6">
                <div className="flex items-center mb-8">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center ml-4">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">المعلومات الشخصية</h2>
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 text-right block">
                      الاسم الأول *
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="أدخل الاسم الأول"
                      required
                      className="text-right h-12 border-gray-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 text-right block">
                      اسم العائلة *
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="أدخل اسم العائلة"
                      required
                      className="text-right h-12 border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 text-right block">
                      تاريخ الميلاد *
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="text-right h-12 border-gray-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700 text-right block">
                      النوع *
                    </Label>
                    <Select value={gender} onValueChange={setGender} required>
                      <SelectTrigger className="text-right h-12 border-gray-200 rounded-xl">
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} align="end" className="z-[100]">
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="saudiId" className="text-sm font-medium text-gray-700 text-right block">
                      رقم الهوية الوطنية *
                    </Label>
                    <Input
                      id="saudiId"
                      type="text"
                      value={saudiId}
                      onChange={(e) => handleNumericInput(e.target.value, setSaudiId)}
                      placeholder="أدخل رقم الهوية الوطنية (١٠ أرقام)"
                      required
                      className="text-right h-12 border-gray-200 rounded-xl"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700 text-right block">
                      المنطقة *
                    </Label>
                    <Select value={city} onValueChange={setCity} required>
                      <SelectTrigger className="text-right h-12 border-gray-200 rounded-xl">
                        <SelectValue placeholder="اختر المنطقة" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} align="end" className="z-[100]">
                        {saudiRegions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700 text-right block">
                    رقم الجوال *
                  </Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => handleNumericInput(e.target.value, setMobileNumber)}
                    placeholder="٠٥xxxxxxxx"
                    required
                    className="text-right h-12 border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Certification Information */}
              <div className="space-y-6">
                <div className="flex items-center mb-8 pt-8 border-t border-gray-100">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center ml-4">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">معلومات ترخيص فال العقاري</h2>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="certificationNumber" className="text-sm font-medium text-gray-700 text-right block">
                    رقم ترخيص فال العقاري *
                  </Label>
                  <Input
                    id="certificationNumber"
                    type="text"
                    value={certificationNumber}
                    onChange={(e) => setCertificationNumber(e.target.value)}
                    placeholder="أدخل رقم الترخيص"
                    required
                    className="text-right h-12 border-gray-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="certificationStartDate" className="text-sm font-medium text-gray-700 text-right block">
                      تاريخ بداية الترخيص *
                    </Label>
                    <Input
                      id="certificationStartDate"
                      type="date"
                      value={certificationStartDate}
                      onChange={(e) => setCertificationStartDate(e.target.value)}
                      required
                      className="text-right h-12 border-gray-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="certificationEndDate" className="text-sm font-medium text-gray-700 text-right block">
                      تاريخ انتهاء الترخيص *
                    </Label>
                    <Input
                      id="certificationEndDate"
                      type="date"
                      value={certificationEndDate}
                      onChange={(e) => setCertificationEndDate(e.target.value)}
                      required
                      className="text-right h-12 border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="certificationFile" className="text-sm font-medium text-gray-700 text-right block">
                    ملف ترخيص فال العقاري (PDF) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="certificationFile"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      required
                      className="text-right h-12 border-gray-200 rounded-xl file:mr-10 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 pl-10"
                    />
                    <Upload className="w-4 h-4 text-gray-500 absolute left-3 top-4 pointer-events-none" />
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <p className="text-sm text-green-700 font-medium text-right">
                      📋 يجب رفع ملف ترخيص فال العقاري بصيغة PDF فقط
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-6">
                <div className="flex items-center mb-8 pt-8 border-t border-gray-100">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center ml-4">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">الشروط والأحكام</h2>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl max-h-80 overflow-y-auto">
                  <div className="space-y-4 text-sm text-gray-700 text-right">
                    <h3 className="font-semibold text-base text-gray-900">شروط استخدام منصة عقاراتي للوسطاء العقاريين:</h3>
                    
                    <div className="space-y-3">
                      <p><strong>1. الأهلية والتسجيل:</strong></p>
                      <p>يجب أن يكون المتقدم حاصلاً على ترخيص فال عقاري ساري المفعول وأن يكون مؤهلاً لممارسة الوساطة العقارية في المملكة العربية السعودية وفقاً للأنظمة المعمول بها.</p>
                      
                      <p><strong>2. صحة البيانات والمعلومات:</strong></p>
                      <p>يتعهد المستخدم بتقديم معلومات صحيحة ودقيقة عن هويته الشخصية وترخيصه المهني، وتحديث هذه المعلومات عند الحاجة. أي معلومات مضللة قد تؤدي إلى إلغاء الحساب نهائياً.</p>
                      
                      <p><strong>3. استخدام النظام:</strong></p>
                      <ul className="space-y-2 mr-4">
                        <li>• الالتزام بأخلاقيات المهنة وقواعد السلوك المهني للوسطاء العقاريين</li>
                        <li>• عدم استخدام النظام لأغراض غير مشروعة أو مخالفة للأنظمة</li>
                        <li>• الحفاظ على سرية بيانات العملاء وعدم إساءة استخدامها</li>
                        <li>• عدم نشر إعلانات مضللة أو غير دقيقة للعقارات</li>
                        <li>• الالتزام بالشفافية في جميع التعاملات مع العملاء</li>
                      </ul>

                      <p><strong>4. الترخيص المهني:</strong></p>
                      <p>يجب المحافظة على سريان ترخيص فال العقاري وإشعار المنصة بأي تغيير في حالة الترخيص فوراً. انتهاء صلاحية الترخيص يؤدي إلى تعليق الحساب تلقائياً حتى تجديده.</p>
                      
                      <p><strong>5. العمولات والرسوم:</strong></p>
                      <ul className="space-y-2 mr-4">
                        <li>• رسوم الاشتراك الشهري/السنوي وفقاً للخطة المختارة</li>
                        <li>• عمولة المنصة على الصفقات المنجزة حسب الاتفاقية</li>
                        <li>• جميع المبالغ غير قابلة للاسترداد بعد التأكيد</li>
                        <li>• يحق للمنصة تعديل الرسوم مع إشعار مسبق 30 يوماً</li>
                      </ul>

                      <p><strong>6. حماية البيانات والخصوصية:</strong></p>
                      <p>نلتزم بحماية بياناتك الشخصية ومعلومات عملائك وفقاً لنظام حماية البيانات الشخصية السعودي، ولن نشاركها مع أطراف ثالثة إلا بموافقتك أو وفقاً للمتطلبات القانونية.</p>
                      
                      <p><strong>7. المسؤولية المهنية:</strong></p>
                      <p>تتحمل المسؤولية الكاملة عن جميع تصرفاتك المهنية وتعاملاتك مع العملاء. المنصة غير مسؤولة عن أي نزاعات قد تنشأ بينك وبين عملائك.</p>
                      
                      <p><strong>8. قواعد السلوك:</strong></p>
                      <ul className="space-y-2 mr-4">
                        <li>• احترام حقوق الملكية الفكرية للمنصة</li>
                        <li>• عدم محاولة اختراق أو إلحاق الضرر بالنظام</li>
                        <li>• التعامل بأدب واحترام مع جميع المستخدمين</li>
                        <li>• الالتزام بمعايير الجودة في الخدمات المقدمة</li>
                      </ul>
                      
                      <p><strong>9. إنهاء الحساب:</strong></p>
                      <p>نحتفظ بالحق في إيقاف أو إنهاء حسابك في حالة انتهاك هذه الشروط أو الأنظمة المعمول بها. كما يمكنك إلغاء حسابك في أي وقت مع مراعاة فترة الإشعار المطلوبة.</p>
                      
                      <p><strong>10. التحديثات والتعديلات:</strong></p>
                      <p>نحتفظ بالحق في تعديل هذه الشروط أو تحديث المنصة في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل أو من خلال المنصة.</p>
                      
                      <p><strong>11. القانون المطبق والاختصاص:</strong></p>
                      <p>تخضع هذه الاتفاقية للقوانين واللوائح السعودية، بما في ذلك نظام التطوير العقاري ولائحة أعمال الوساطة العقارية. المحاكم السعودية المختصة لها الاختصاص في حل أي نزاعات.</p>
                      
                      <p><strong>12. الاتصال والدعم:</strong></p>
                      <p>لأي استفسارات أو مشاكل تتعلق بهذه الشروط أو استخدام المنصة، يمكنك التواصل معنا على: support@aqaraty.sa أو هاتف: +966501234567</p>
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
                      أوافق على جميع الشروط والأحكام المذكورة أعلاه وأقر بأنني قد قرأتها وفهمتها بالكامل. كما أتعهد بالالتزام بأخلاقيات المهنة وقواعد السلوك للوسطاء العقاريين وأؤكد صحة جميع البيانات المقدمة.
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
                  {isLoading ? "جار إرسال الطلب..." : "إنشاء الحساب"}
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
                className="text-gray-600 border-gray-300 hover:bg-gray-50 h-12 px-8 rounded-xl"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة إلى خيارات التسجيل
              </Button>
            </div>

            {/* What happens next */}
            <div className="mt-12 bg-gradient-to-br from-slate-50 to-green-50 border border-slate-200 p-8 rounded-2xl shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center ml-4 shadow-lg">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-xl">ماذا يحدث بعد ذلك؟</h3>
              </div>
              <div className="space-y-4 text-right">
                <div className="flex items-start bg-white/50 p-4 rounded-xl">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-1 ml-4 flex-shrink-0 shadow-sm"></div>
                  <p className="text-slate-700 font-medium">سيتم التحقق من صحة بياناتك والترخيص المهني خلال 24 ساعة</p>
                </div>
                <div className="flex items-start bg-white/50 p-4 rounded-xl">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-1 ml-4 flex-shrink-0 shadow-sm"></div>
                  <p className="text-slate-700 font-medium">قد نطلب وثائق إضافية أو توضيحات حول الترخيص</p>
                </div>
                <div className="flex items-start bg-white/50 p-4 rounded-xl">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-1 ml-4 flex-shrink-0 shadow-sm"></div>
                  <p className="text-slate-700 font-medium">سنتواصل معك لاستكمال إعداد حسابك المهني</p>
                </div>
                <div className="flex items-start bg-white/50 p-4 rounded-xl">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-1 ml-4 flex-shrink-0 shadow-sm"></div>
                  <p className="text-slate-700 font-medium">عند الموافقة، ستحصل على بيانات الدخول لحسابك الجديد</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src={logoImage} 
                  alt="شعار عقاراتي" 
                  className="w-8 h-8 object-contain ml-3"
                />
                <span className="text-xl font-bold" style={{fontFamily: 'Janat Bold, Noto Sans Arabic'}}>منصة عقاراتي</span>
              </div>
              <p className="text-gray-400 mb-4">
                نظام شامل لإدارة العقارات والعملاء والصفقات مع واجهة حديثة وسهلة الاستخدام
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/" className="hover:text-green-400 transition-colors">الرئيسية</a></li>
                <li><a href="/#features" className="hover:text-green-400 transition-colors">المميزات</a></li>
                <li><a href="/#solutions" className="hover:text-green-400 transition-colors">الحلول</a></li>
                <li><a href="/#pricing" className="hover:text-green-400 transition-colors">الأسعار</a></li>
                <li><a href="/#contact" className="hover:text-green-400 transition-colors">اتصل بنا</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">الدعم</h3>
              <ul className="space-y-2 text-gray-400">
                <li>الهاتف: +966 50 123 4567</li>
                <li>البريد: support@aqaraty.sa</li>
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