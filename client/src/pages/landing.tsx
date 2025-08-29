import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Users, TrendingUp, Shield, BarChart3, MessageSquare, Phone, Mail, MapPin } from "lucide-react";
import PropertySearchMap from "@/components/PropertySearchMap";
import agarkomLogo from "@assets/Aqarkom (2)_1756500960938.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleSignUp = () => {
    window.location.href = "/signup";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex items-center">
                <img src={agarkomLogo} alt="عقارکم" className="h-36 ml-3" />
              </div>
            </div>
            <nav className="hidden md:flex space-x-reverse space-x-8">
              <a href="#home" className="text-gray-700 hover:text-primary">الرئيسية</a>
              <a href="#map" className="text-gray-700 hover:text-primary">خريطة العقارات</a>
              <a href="#features" className="text-gray-700 hover:text-primary">المميزات</a>
              <a href="#solutions" className="text-gray-700 hover:text-primary">الحلول</a>
              <a href="#pricing" className="text-gray-700 hover:text-primary">الأسعار</a>
              <a href="#contact" className="text-gray-700 hover:text-primary">اتصل بنا</a>
            </nav>
            <div className="flex items-center space-x-reverse space-x-4">
              <Button onClick={handleLogin} variant="outline" className="text-primary border-primary hover:bg-primary/10">
                تسجيل الدخول
              </Button>
              <Button onClick={handleSignUp} className="bg-primary hover:bg-primary/90 text-white">
                إنشاء حساب جديد
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20 bg-gradient-to-br from-primary/10 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-right">
              <p className="text-primary font-medium mb-4">مرحباً بك في</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                عقارکم - منصة إدارة العقارات الذكية
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                نظام شامل لإدارة العقارات والعملاء والصفقات مع واجهة حديثة وسهلة الاستخدام. 
                تابع عملائك المحتملين، أدر عقاراتك، وتحكم في صفقاتك من مكان واحد.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSignUp} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg">
                  جرب المنصة مجاناً
                </Button>
                <Button onClick={handleLogin} variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg">
                  تسجيل الدخول
                </Button>
              </div>
            </div>
            <div className="lg:text-left">
              <div className="bg-white rounded-2xl shadow-2xl p-3 transform rotate-3 hover:rotate-0 transition-transform duration-300 overflow-hidden">
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                    <div className="flex items-center space-x-reverse space-x-1">
                      <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center">
                        <Building className="h-2 w-2 text-white" />
                      </div>
                      <span className="text-green-600 font-bold text-[10px]">منصة عقاراتي - لوحة التحكم</span>
                    </div>
                    <div className="flex space-x-reverse space-x-0.5">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Top Metrics Grid */}
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-1.5 rounded">
                      <div className="text-xs font-bold text-blue-600">1.2M ﷼</div>
                      <div className="text-[7px] text-blue-700">إيرادات</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-1.5 rounded">
                      <div className="text-xs font-bold text-green-600">3,847</div>
                      <div className="text-[7px] text-green-700">عملاء</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-1.5 rounded">
                      <div className="text-xs font-bold text-orange-600">89</div>
                      <div className="text-[7px] text-orange-700">عقارات</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-1.5 rounded">
                      <div className="text-xs font-bold text-purple-600">45</div>
                      <div className="text-[7px] text-purple-700">صفقات</div>
                    </div>
                  </div>

                  {/* Multi-Section Grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Recent Activities */}
                    <div className="bg-gray-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-gray-700">أنشطة حديثة</span>
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="bg-white p-1 rounded text-[6px]">
                          <div className="flex items-center space-x-reverse space-x-0.5">
                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                            <span>عقد فيلا</span>
                          </div>
                        </div>
                        <div className="bg-white p-1 rounded text-[6px]">
                          <div className="flex items-center space-x-reverse space-x-0.5">
                            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                            <span>معاينة شقة</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Marketing Campaigns */}
                    <div className="bg-indigo-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-indigo-800">حملات تسويق</span>
                        <BarChart3 className="h-2 w-2 text-indigo-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="bg-white bg-opacity-50 rounded p-0.5 text-[6px]">
                          <div className="flex justify-between">
                            <span>24 نشطة</span>
                            <span className="text-indigo-600">89K مشاهدة</span>
                          </div>
                        </div>
                        <div className="bg-white bg-opacity-50 rounded p-0.5 text-[6px]">
                          <div className="flex justify-between">
                            <span>عملاء جدد</span>
                            <span className="text-indigo-600">2.8K</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales Performance */}
                    <div className="bg-purple-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-purple-800">أداء المبيعات</span>
                        <span className="text-[6px] text-purple-600">+23%</span>
                      </div>
                      <div className="flex items-end h-4 space-x-0.5 space-x-reverse">
                        <div className="bg-purple-400 w-1 h-2 rounded-t"></div>
                        <div className="bg-purple-500 w-1 h-3 rounded-t"></div>
                        <div className="bg-purple-600 w-1 h-4 rounded-t"></div>
                        <div className="bg-purple-500 w-1 h-3 rounded-t"></div>
                        <div className="bg-purple-600 w-1 h-4 rounded-t"></div>
                      </div>
                    </div>
                  </div>

                  {/* Communication & Social Media */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* WhatsApp & Email */}
                    <div className="bg-green-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-green-700">واتساب وإيميل</span>
                        <MessageSquare className="h-2 w-2 text-green-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[6px]">
                          <span>156 رسالة اليوم</span>
                          <span className="text-green-600">94% رد</span>
                        </div>
                        <div className="flex justify-between text-[6px]">
                          <span>12 حملة إيميل</span>
                          <span className="text-green-600">87% فتح</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="bg-blue-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-blue-700">شبكات التواصل</span>
                        <TrendingUp className="h-2 w-2 text-blue-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[6px]">
                          <span>تويتر: 45K</span>
                          <span>إنستغرام: 28K</span>
                        </div>
                        <div className="flex justify-between text-[6px]">
                          <span>سناب: 10K</span>
                          <span>تيك توك: 6K</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Base & Team Performance */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Customer Analytics */}
                    <div className="bg-yellow-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-yellow-800">قاعدة العملاء</span>
                        <Users className="h-2 w-2 text-yellow-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[6px]">
                          <span>+284 الشهر الماضي</span>
                          <span className="text-yellow-600">نمو 8.1%</span>
                        </div>
                        <div className="flex justify-between text-[6px]">
                          <span>نشاط 92%</span>
                          <span className="text-yellow-600">تحويل 12.4%</span>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Details */}
                    <div className="bg-rose-50 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-medium text-rose-800">حملات نشطة</span>
                        <TrendingUp className="h-2 w-2 text-rose-600" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[6px]">
                          <span>واتساب: 18</span>
                          <span>تويتر: 6</span>
                        </div>
                        <div className="flex justify-between text-[6px]">
                          <span>الفريق: أحمد 12</span>
                          <span>فاطمة 8</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-100 rounded p-1.5">
                    <div className="text-[8px] font-medium text-gray-700 mb-1">إجراءات سريعة</div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="bg-white rounded p-1 text-center">
                        <div className="w-2.5 h-2.5 bg-blue-100 rounded mx-auto mb-0.5 flex items-center justify-center">
                          <Users className="h-1 w-1 text-blue-600" />
                        </div>
                        <div className="text-[6px] text-gray-600">عميل</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="w-2.5 h-2.5 bg-green-100 rounded mx-auto mb-0.5 flex items-center justify-center">
                          <Building className="h-1 w-1 text-green-600" />
                        </div>
                        <div className="text-[6px] text-gray-600">عقار</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="w-2.5 h-2.5 bg-purple-100 rounded mx-auto mb-0.5 flex items-center justify-center">
                          <Phone className="h-1 w-1 text-purple-600" />
                        </div>
                        <div className="text-[6px] text-gray-600">اتصال</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Search Map Section */}
      <section id="map" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              اكتشف العقارات على الخريطة
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ابحث عن العقار المناسب لك باستخدام خريطتنا التفاعلية مع تصنيفات متنوعة ومرشحات متقدمة
            </p>
          </div>
          
          <PropertySearchMap className="w-full" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              اكتشف الفرق في إدارة العقارات
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">إدارة العملاء المحتملين</h3>
                <p className="text-gray-600">
                  تتبع وإدارة العملاء المحتملين من الاستفسار الأولي حتى إتمام الصفقة
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">إدارة العقارات</h3>
                <p className="text-gray-600">
                  أضف وأدر عقاراتك مع تفاصيل شاملة وصور ومعلومات السعر والموقع
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">متابعة الصفقات</h3>
                <p className="text-gray-600">
                  تتبع مراحل الصفقات من التفاوض الأولي حتى الإغلاق النهائي
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">تقارير مفصلة</h3>
                <p className="text-gray-600">
                  احصل على تقارير شاملة حول أداء المبيعات والعملاء والعقارات
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">تواصل واتساب</h3>
                <p className="text-gray-600">
                  تواصل مع العملاء مباشرة عبر واتساب من داخل المنصة
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">أمان البيانات</h3>
                <p className="text-gray-600">
                  بيانات آمنة ومحمية بأعلى معايير الأمن والحماية
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              حلول شاملة لإدارة العقارات
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              أدوات متكاملة تساعدك في إدارة جميع جوانب أعمالك العقارية
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">إدارة العملاء</h3>
                <p className="text-gray-600 mb-6">
                  تتبع العملاء المحتملين وإدارة قاعدة بيانات شاملة مع تفاصيل الاتصال والاهتمامات
                </p>
                <ul className="text-right space-y-2 text-gray-600">
                  <li>• إضافة وتصنيف العملاء</li>
                  <li>• متابعة حالة كل عميل</li>
                  <li>• تسجيل الملاحظات والمتابعات</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow duration-300 border-green-200">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">إدارة العقارات</h3>
                <p className="text-gray-600 mb-6">
                  أضف وأدر عقاراتك مع معلومات مفصلة وصور عالية الجودة ومعلومات الأسعار
                </p>
                <ul className="text-right space-y-2 text-gray-600">
                  <li>• معرض صور للعقارات</li>
                  <li>• تفاصيل شاملة للعقار</li>
                  <li>• إدارة الأسعار والعروض</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">متابعة الصفقات</h3>
                <p className="text-gray-600 mb-6">
                  تتبع مراحل الصفقات من البداية حتى الإنجاز مع إدارة المهام والمتابعات
                </p>
                <ul className="text-right space-y-2 text-gray-600">
                  <li>• مراحل الصفقة المختلفة</li>
                  <li>• تتبع الأنشطة والمهام</li>
                  <li>• تقارير الأداء</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              باقات الاشتراك
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              اختر الباقة المناسبة لحجم أعمالك واحتياجاتك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {/* Starter Plan */}
            <Card className="relative hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">الباقة الأساسية</h3>
                  <div className="text-4xl font-bold text-green-600 mb-2">مجاناً</div>
                  <p className="text-gray-600">للمبتدئين</p>
                </div>
                
                <div className="flex-1">
                  <ul className="space-y-4 text-right">
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">حتى 50 عميل محتمل</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Building className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">حتى 25 عقار</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <MessageSquare className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">5 حملات تسويقية شهرياً</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Phone className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">100 رسالة واتساب شهرياً</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <BarChart3 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">تقارير أساسية</span>
                    </li>
                    <li className="flex items-center gap-4 pb-3">
                      <Mail className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">دعم فني عبر البريد</span>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-8">
                  <Button onClick={handleSignUp} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold">
                    ابدأ مجاناً
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative hover:shadow-xl transition-all duration-300 border-2 border-green-500 h-full transform scale-110">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  الأكثر شعبية
                </span>
              </div>
              <CardContent className="p-8 flex flex-col h-full">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">الباقة الاحترافية</h3>
                  <div className="text-4xl font-bold text-green-600 mb-2">299 ﷼</div>
                  <p className="text-gray-600">شهرياً</p>
                </div>
                
                <div className="flex-1">
                  <ul className="space-y-4 text-right">
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">حتى 500 عميل محتمل</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Building className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">حتى 200 عقار</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <MessageSquare className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">25 حملة تسويقية شهرياً</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Phone className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">2000 رسالة واتساب شهرياً</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <BarChart3 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">تقارير متقدمة وتحليلات</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">دعم فني على مدار الساعة</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">إدارة 3 مستخدمين</span>
                    </li>
                    <li className="flex items-center gap-4 pb-3">
                      <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">تكامل مع الأنظمة الخارجية</span>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-8">
                  <Button onClick={handleSignUp} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold">
                    اختر هذه الباقة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">باقة الشركات</h3>
                  <div className="text-4xl font-bold text-green-600 mb-2">899 ﷼</div>
                  <p className="text-gray-600">شهرياً</p>
                </div>
                
                <div className="flex-1">
                  <ul className="space-y-4 text-right">
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">عملاء محتملين غير محدودين</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Building className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">عقارات غير محدودة</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <MessageSquare className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">حملات تسويقية غير محدودة</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Phone className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">10,000 رسالة واتساب شهرياً</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <BarChart3 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">تقارير مخصصة ولوحات تحكم</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">مدير حساب مخصص</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">مستخدمين غير محدودين</span>
                    </li>
                    <li className="flex items-center gap-4 border-b border-gray-100 pb-3">
                      <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">API مخصص للتكامل</span>
                    </li>
                    <li className="flex items-center gap-4 pb-3">
                      <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">نسخ احتياطية يومية</span>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-8">
                  <Button onClick={handleSignUp} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-lg font-semibold">
                    اتصل بنا
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Features Comparison */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">مقارنة بين الباقات</h3>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">المميزات</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">الأساسية</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 bg-green-50">الاحترافية</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">الشركات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">مساحة التخزين</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">1 جيجا</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900 bg-green-50">50 جيجا</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">500 جيجا</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">النسخ الاحتياطية</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">أسبوعية</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900 bg-green-50">يومية</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">فورية</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">تطبيق الجوال</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600">✓</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600 bg-green-50">✓</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600">✓</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">التدريب المجاني</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-400">-</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600 bg-green-50">✓</td>
                      <td className="px-6 py-4 text-center text-sm text-green-600">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            ابدأ رحلتك مع منصة عقاراتي اليوم
          </h2>
          <p className="text-xl text-green-100 mb-8">
            انضم إلى آلاف الوكلاء العقاريين الذين يستخدمون منصتنا لإدارة أعمالهم بكفاءة
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleSignUp} className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
              إنشاء حساب مجاني
            </Button>
            <Button onClick={handleLogin} variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-semibold">
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              تواصل معنا
            </h2>
            <p className="text-xl text-gray-600">
              فريق عمل منصة عقاراتي جاهز دوماً للإجابة على استفساراتكم
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">الهاتف</h3>
                <p className="text-gray-600">+966 50 123 4567</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">البريد الإلكتروني</h3>
                <p className="text-gray-600">info@aqaraty.sa</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">العنوان</h3>
                <p className="text-gray-600">الرياض، المملكة العربية السعودية</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

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