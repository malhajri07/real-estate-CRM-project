import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Users, TrendingUp, Shield, BarChart3, MessageSquare, Phone, Mail, MapPin } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleSignUp = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-600 ml-3" />
                <span className="text-xl font-bold text-gray-900">منصة عقاراتي</span>
              </div>
            </div>
            <nav className="hidden md:flex space-x-reverse space-x-8">
              <a href="#home" className="text-gray-700 hover:text-green-600">الرئيسية</a>
              <a href="#features" className="text-gray-700 hover:text-green-600">المميزات</a>
              <a href="#solutions" className="text-gray-700 hover:text-green-600">الحلول</a>
              <a href="#contact" className="text-gray-700 hover:text-green-600">اتصل بنا</a>
            </nav>
            <div className="flex items-center space-x-reverse space-x-4">
              <Button onClick={handleLogin} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                تسجيل الدخول
              </Button>
              <Button onClick={handleSignUp} className="bg-green-600 hover:bg-green-700 text-white">
                إنشاء حساب جديد
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-right">
              <p className="text-green-600 font-medium mb-4">مرحباً بك في</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                منصة عقاراتي لإدارة العقارات
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                نظام شامل لإدارة العقارات والعملاء والصفقات مع واجهة حديثة وسهلة الاستخدام. 
                تابع عملائك المحتملين، أدر عقاراتك، وتحكم في صفقاتك من مكان واحد.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSignUp} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
                  جرب المنصة مجاناً
                </Button>
                <Button onClick={handleLogin} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 text-lg">
                  تسجيل الدخول
                </Button>
              </div>
            </div>
            <div className="lg:text-left">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-semibold">لوحة التحكم</span>
                    <div className="flex space-x-reverse space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-32 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-16 w-16 text-green-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">150</div>
                      <div className="text-sm text-blue-700">عميل محتمل</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">45</div>
                      <div className="text-sm text-green-700">عقار</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">إدارة العقارات</h3>
                <p className="text-gray-600">
                  أضف وأدر عقاراتك مع تفاصيل شاملة وصور ومعلومات السعر والموقع
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">متابعة الصفقات</h3>
                <p className="text-gray-600">
                  تتبع مراحل الصفقات من التفاوض الأولي حتى الإغلاق النهائي
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
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
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-red-600" />
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
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-blue-600" />
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
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-10 w-10 text-orange-600" />
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
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">البريد الإلكتروني</h3>
                <p className="text-gray-600">info@aqaraty.sa</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-orange-600" />
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