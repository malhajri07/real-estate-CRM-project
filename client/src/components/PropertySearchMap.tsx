import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Building2, Warehouse, Trees, Search } from 'lucide-react';
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

  // Format price for mobile-style display (like "100 ألف")
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (numPrice >= 1000000) {
      return `${Math.round(numPrice / 1000000)} مليون`;
    } else if (numPrice >= 1000) {
      return `${Math.round(numPrice / 1000)} ألف`;
    }
    return `${numPrice} ﷼`;
  };

  // Format full price for popup
  const formatFullPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice) + ' ﷼';
  };

  // Create custom price bubble marker (mobile app style)
  const createPriceBubbleIcon = (price: string | number, category: string) => {
    const priceText = formatPrice(price);
    const categoryInfo = PROPERTY_CATEGORIES[category as keyof typeof PROPERTY_CATEGORIES];
    
    return L.divIcon({
      html: `
        <div class="relative">
          <div class="bg-green-600 text-white px-2 py-1 rounded-md shadow-lg text-xs font-bold whitespace-nowrap border border-green-700" style="direction: rtl;">
            ${priceText}
          </div>
          <div class="absolute left-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600 transform -translate-x-1/2"></div>
        </div>
      `,
      className: 'price-bubble-marker',
      iconSize: [60, 30],
      iconAnchor: [30, 34],
      popupAnchor: [0, -34],
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
    <div className={`${className} bg-white`} dir="rtl">
      {/* Mobile-style Top Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Main Filter Tabs */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Button
              variant={selectedCategory === 'الكل' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('الكل')}
              className={`whitespace-nowrap ${selectedCategory === 'الكل' ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
            >
              الكل
            </Button>
            {Object.entries(PROPERTY_CATEGORIES).map(([key, category]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className={`whitespace-nowrap ${selectedCategory === key ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
              >
                {category.label}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mr-2">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Property Type Filter */}
        {selectedCategory !== 'الكل' && (
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
            <Button
              variant={selectedType === 'الكل' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedType('الكل')}
              className={`whitespace-nowrap text-xs ${selectedType === 'الكل' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              الكل
            </Button>
            {getAvailableTypes().map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedType(type)}
                className={`whitespace-nowrap text-xs ${selectedType === type ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {type}
              </Button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
          {filteredProperties.length} عقار متاح
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[70vh] md:h-[600px] lg:h-[700px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جار تحميل الخريطة...</p>
            </div>
          </div>
        ) : (
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
                  icon={createPriceBubbleIcon(property.price, property.propertyCategory)}
                >
                  <Popup>
                    <div className="text-right p-3 min-w-[220px]" dir="rtl">
                      <h4 className="font-bold text-gray-900 mb-2 text-base">{property.title}</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span className="font-medium">النوع:</span>
                          <span>{property.propertyType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">الموقع:</span>
                          <span>{property.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">السعر:</span>
                          <span className="font-bold text-green-600">{formatFullPrice(property.price)}</span>
                        </div>
                        {property.bedrooms && (
                          <div className="flex justify-between">
                            <span className="font-medium">الغرف:</span>
                            <span>{property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms && (
                          <div className="flex justify-between">
                            <span className="font-medium">الحمامات:</span>
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        {property.squareFeet && (
                          <div className="flex justify-between">
                            <span className="font-medium">المساحة:</span>
                            <span>{property.squareFeet} قدم²</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <Badge className="bg-green-600 text-white text-xs">
                          {property.propertyCategory}
                        </Badge>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}