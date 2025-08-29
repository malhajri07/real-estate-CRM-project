import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import PropertySearchMap from "@/components/PropertySearchMap";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";

export default function SearchProperties() {
  const handleBackToHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex items-center cursor-pointer" onClick={handleBackToHome}>
                <img src={agarkomLogo} alt="عقارکم" className="h-36 ml-3" />
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <Button 
                onClick={handleBackToHome} 
                variant="outline" 
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Property Search Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              ابحث عن عقار
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              اكتشف العقارات على خريطتنا التفاعلية واعثر على العقار المناسب لك مع تصنيفات متنوعة ومرشحات متقدمة
            </p>
          </div>
          
          <PropertySearchMap className="w-full rounded-lg shadow-lg" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            لم تجد العقار المناسب؟
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            تواصل معنا وسيساعدك فريقنا في العثور على العقار المثالي
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg font-semibold">
              تواصل معنا
            </Button>
            <Button 
              onClick={handleBackToHome}
              variant="outline" 
              className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 text-lg font-semibold"
            >
              تصفح المزيد من الخدمات
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}