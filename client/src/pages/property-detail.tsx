import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowRight, Bed, Bath, Square, MapPin, Calendar, Edit, Trash2, Share } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyMap } from "@/components/ui/property-map";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Property } from "@shared/schema";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, dir } = useLanguage();

  const { data: property, isLoading, error } = useQuery<Property>({
    queryKey: ["/api/properties", id],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${id}`);
      if (!response.ok) throw new Error('Property not found');
      return response.json();
    },
    enabled: !!id,
  });

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "sold": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "withdrawn": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">جار تحميل تفاصيل العقار...</div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-muted-foreground mb-4">لم يتم العثور على العقار</div>
          <Button onClick={() => setLocation('/properties')} variant="outline">
            العودة إلى العقارات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/properties')}
              className="rounded-xl apple-transition"
            >
              <ArrowRight size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />
              العودة إلى العقارات
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-xl font-semibold">{property.title}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Share size={16} className="ml-2" />
              مشاركة
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Edit size={16} className="ml-2" />
              تعديل
            </Button>
          </div>
        </div>
      </div>

      <main className="p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            {property.photoUrls && property.photoUrls.length > 0 ? (
              <Card className="apple-card overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={property.photoUrls[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  {property.photoUrls.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
                      +{property.photoUrls.length - 1} صورة إضافية
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="apple-card">
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  لا توجد صور متاحة
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            <Card className="apple-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{property.title}</CardTitle>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin size={16} />
                      <span>{property.address}, {property.city}, {property.state}</span>
                    </div>
                  </div>
                  <Badge className={`${getStatusBadgeColor(property.status)} rounded-full px-4 py-2`}>
                    {property.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Price and Key Features */}
                <div className="mb-6">
                  <div className="text-3xl font-bold text-primary mb-4">
                    {formatCurrency(property.price)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {property.bedrooms && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Bed size={20} />
                        <span>{property.bedrooms} غرف نوم</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Bath size={20} />
                        <span>{property.bathrooms} حمام</span>
                      </div>
                    )}
                    {property.squareFeet && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Square size={20} />
                        <span>{property.squareFeet.toLocaleString()} قدم²</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {property.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">الوصف</h3>
                    <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                  </div>
                )}

                {/* Property Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">تفاصيل العقار</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع العقار</span>
                        <span>{property.propertyType}</span>
                      </div>
                      {property.yearBuilt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">سنة البناء</span>
                          <span>{property.yearBuilt}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ الإضافة</span>
                        <span>{new Date(property.createdAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">آخر تحديث</span>
                        <span>{new Date(property.updatedAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Map */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="text-lg">الموقع</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyMap
                  address={`${property.address}, ${property.city}, ${property.state}`}
                  latitude={property.latitude ? parseFloat(property.latitude) : undefined}
                  longitude={property.longitude ? parseFloat(property.longitude) : undefined}
                  className="h-48 w-full mb-4"
                  showLink={true}
                />
                <div className="text-sm text-muted-foreground">
                  {property.address}, {property.city}, {property.state}
                </div>
                {property.latitude && property.longitude && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {parseFloat(property.latitude).toFixed(4)}, {parseFloat(property.longitude).toFixed(4)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Actions */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full apple-transition">
                  جدولة معاينة
                </Button>
                <Button variant="outline" className="w-full apple-transition">
                  طلب معلومات إضافية
                </Button>
                <Button variant="outline" className="w-full apple-transition">
                  إضافة إلى المفضلة
                </Button>
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="text-lg">إحصائيات العقار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المشاهدات</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الاستفسارات</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المعاينات</span>
                  <span className="font-medium">-</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}