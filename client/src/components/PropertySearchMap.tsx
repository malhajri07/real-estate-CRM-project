import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Building2, Warehouse, Trees, Filter } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property } from '@shared/schema';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Property categories with their types and colors
const PROPERTY_CATEGORIES = {
  'سكني': {
    label: 'سكني',
    icon: Home,
    color: 'bg-blue-500',
    types: ['شقة', 'شقة مفروشة', 'بيت', 'فيلا', 'دور']
  },
  'ترفيهي/استجمام': {
    label: 'ترفيهي / استجمام',
    icon: Trees,
    color: 'bg-green-500',
    types: ['استراحة', 'شاليه', 'مخيم']
  },
  'تجاري/مكاتب': {
    label: 'تجاري / مكاتب',
    icon: Building2,
    color: 'bg-purple-500',
    types: ['مكتب', 'محل', 'عمارة']
  },
  'مستودعات/أراضٍ': {
    label: 'مستودعات / أراضٍ',
    icon: Warehouse,
    color: 'bg-orange-500',
    types: ['مستودع', 'أرض']
  },
  'عام': {
    label: 'عام',
    icon: MapPin,
    color: 'bg-gray-500',
    types: ['غرفة', 'الكل']
  }
};

interface PropertySearchMapProps {
  className?: string;
}

export default function PropertySearchMap({ className = '' }: PropertySearchMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedType, setSelectedType] = useState<string>('الكل');

  // Default map center (Riyadh, Saudi Arabia)
  const defaultCenter: [number, number] = [24.7136, 46.6753];

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties/map'],
  });

  // Filter properties based on selected category and type using useMemo
  const filteredProperties = useMemo(() => {
    if (!properties || !Array.isArray(properties)) {
      return [];
    }

    let filtered = properties.filter(property => 
      property.latitude && 
      property.longitude &&
      property.status === 'active'
    );

    if (selectedCategory !== 'الكل') {
      filtered = filtered.filter(property => property.propertyCategory === selectedCategory);
    }

    if (selectedType !== 'الكل') {
      filtered = filtered.filter(property => property.propertyType === selectedType);
    }

    return filtered;
  }, [properties, selectedCategory, selectedType]);

  // Get available types for selected category
  const getAvailableTypes = () => {
    if (selectedCategory === 'الكل') {
      return Object.values(PROPERTY_CATEGORIES).flatMap(cat => cat.types);
    }
    return PROPERTY_CATEGORIES[selectedCategory as keyof typeof PROPERTY_CATEGORIES]?.types || [];
  };

  // Format price
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice) + ' ﷼';
  };

  // Create custom marker based on property category
  const createCustomIcon = (category: string) => {
    const categoryInfo = PROPERTY_CATEGORIES[category as keyof typeof PROPERTY_CATEGORIES];
    const color = categoryInfo?.color.replace('bg-', '') || 'blue';
    
    return L.divIcon({
      html: `
        <div class="w-8 h-8 ${categoryInfo?.color || 'bg-blue-500'} rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  if (isLoading) {
    return (
      <div className={`${className} bg-white rounded-lg p-8 text-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">جار تحميل الخريطة...</p>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`} dir="rtl">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">فلترة العقارات</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="الكل">الكل</SelectItem>
                  {Object.entries(PROPERTY_CATEGORIES).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع العقار</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="الكل">الكل</SelectItem>
                  {getAvailableTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <Badge variant="outline" className="text-green-600 border-green-600">
                {filteredProperties.length} عقار
              </Badge>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCategory('الكل');
                  setSelectedType('الكل');
                }}
                className="w-full"
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-96 md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden">
            <MapContainer
              center={defaultCenter}
              zoom={11}
              className="h-full w-full"
              style={{ direction: 'ltr' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {filteredProperties.map((property) => {
                if (!property.latitude || !property.longitude) return null;
                
                const lat = parseFloat(property.latitude.toString());
                const lng = parseFloat(property.longitude.toString());
                
                return (
                  <Marker
                    key={property.id}
                    position={[lat, lng]}
                    icon={createCustomIcon(property.propertyCategory)}
                  >
                    <Popup>
                      <div className="text-right p-2 min-w-[200px]" dir="rtl">
                        <h4 className="font-semibold text-gray-900 mb-2">{property.title}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">النوع:</span> {property.propertyType}</p>
                          <p><span className="font-medium">الموقع:</span> {property.city}</p>
                          <p><span className="font-medium">السعر:</span> {formatPrice(property.price)}</p>
                          {property.bedrooms && (
                            <p><span className="font-medium">الغرف:</span> {property.bedrooms}</p>
                          )}
                          {property.bathrooms && (
                            <p><span className="font-medium">الحمامات:</span> {property.bathrooms}</p>
                          )}
                          {property.squareFeet && (
                            <p><span className="font-medium">المساحة:</span> {property.squareFeet} قدم²</p>
                          )}
                        </div>
                        <div className="mt-3">
                          <Badge className={`${PROPERTY_CATEGORIES[property.propertyCategory as keyof typeof PROPERTY_CATEGORIES]?.color || 'bg-gray-500'} text-white`}>
                            {property.propertyCategory}
                          </Badge>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Legend */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">دليل التصنيفات</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(PROPERTY_CATEGORIES).map(([key, category]) => {
              const IconComponent = category.icon;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${category.color} rounded-full`}></div>
                  <IconComponent className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{category.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}