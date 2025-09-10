import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MapPin, Home, Building2, Warehouse, Trees, Search, Filter, X, Save, Map } from 'lucide-react';
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
  searchQuery?: string;
}

export default function PropertySearchMap({ className = '', searchQuery = '' }: PropertySearchMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedType, setSelectedType] = useState<string>('الكل');
  const [selectedCity, setSelectedCity] = useState<string>('الكل');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [bedrooms, setBedrooms] = useState<string>('الكل');
  const [bathrooms, setBathrooms] = useState<string>('الكل');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [savedSearchName, setSavedSearchName] = useState<string>('');

  // Default map center (Riyadh, Saudi Arabia)
  const defaultCenter: [number, number] = [24.7136, 46.6753];

  const params = new URLSearchParams();
  if (selectedCategory !== 'الكل') params.set('propertyCategory', selectedCategory);
  if (selectedType !== 'الكل') params.set('propertyType', selectedType);
  const url = `/api/listings/map${params.toString() ? `?${params.toString()}` : ''}`;

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: [url],
  });

  // Filter properties based on all filters using useMemo
  const filteredProperties = useMemo(() => {
    if (!properties || !Array.isArray(properties)) {
      return [];
    }

    let filtered = properties.filter(property => 
      property.latitude && 
      property.longitude &&
      property.status === 'active'
    );

    // Text search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(searchLower) ||
        property.description?.toLowerCase().includes(searchLower) ||
        property.city?.toLowerCase().includes(searchLower) ||
        property.propertyType?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategory !== 'الكل') {
      filtered = filtered.filter(property => property.propertyCategory === selectedCategory);
    }

    // Type filter
    if (selectedType !== 'الكل') {
      filtered = filtered.filter(property => property.propertyType === selectedType);
    }

    // City filter
    if (selectedCity !== 'الكل') {
      filtered = filtered.filter(property => property.city === selectedCity);
    }

    // Price range filter
    filtered = filtered.filter(property => {
      const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Bedrooms filter
    if (bedrooms !== 'الكل') {
      const bedroomCount = parseInt(bedrooms);
      filtered = filtered.filter(property => {
        if (property.bedrooms === null) return false;
        const propertyBedrooms = typeof property.bedrooms === 'string' ? parseInt(property.bedrooms) : property.bedrooms;
        return propertyBedrooms === bedroomCount;
      });
    }

    // Bathrooms filter
    if (bathrooms !== 'الكل') {
      const bathroomCount = parseFloat(bathrooms);
      filtered = filtered.filter(property => {
        if (property.bathrooms === null) return false;
        const propertyBathrooms = typeof property.bathrooms === 'string' ? parseFloat(property.bathrooms) : property.bathrooms;
        return propertyBathrooms === bathroomCount;
      });
    }

    return filtered;
  }, [properties, selectedCategory, selectedType, searchQuery, selectedCity, priceRange, bedrooms, bathrooms]);

  // Get available types for selected category
  const getAvailableTypes = () => {
    if (selectedCategory === 'الكل') {
      return Object.values(PROPERTY_CATEGORIES).flatMap(cat => cat.types);
    }
    return PROPERTY_CATEGORIES[selectedCategory as keyof typeof PROPERTY_CATEGORIES]?.types || [];
  };

  // Get unique cities from properties
  const getUniqueCities = () => {
    if (!properties || !Array.isArray(properties)) return [];
    const cities = properties
      .map(property => property.city)
      .filter((city, index, arr) => city && arr.indexOf(city) === index)
      .sort();
    return cities;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategory('الكل');
    setSelectedType('الكل');
    setSelectedCity('الكل');
    setPriceRange([0, 10000000]);
    setBedrooms('الكل');
    setBathrooms('الكل');
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

  const toggleCompare = (id: string) => {
    try {
      const raw = localStorage.getItem('compareIds');
      const arr = raw ? JSON.parse(raw) : [];
      let list: string[] = Array.isArray(arr) ? arr : [];
      if (list.includes(id)) list = list.filter((x) => x !== id); else list = [...list, id].slice(0, 4);
      localStorage.setItem('compareIds', JSON.stringify(list));
      alert('تم تحديث قائمة المقارنة');
    } catch {}
  };

  const saveFavorite = async (id: string) => {
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id })
      });
      if (!res.ok) throw new Error('failed');
      alert('تمت إضافة العقار إلى المفضلة');
    } catch {
      alert('تعذر حفظ العقار');
    }
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
    <div className={`${className} bg-white flex flex-col h-full min-h-[500px]`} dir="rtl">
      {/* Enhanced Top Navigation with Filters */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        {/* Filter Controls */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Filter className="h-4 w-4 ml-2" />
            مرشحات
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <X className="h-4 w-4 ml-2" />
            مسح الكل
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الكل">الكل</SelectItem>
                    {getUniqueCities().map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نطاق السعر: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={10000000}
                  min={0}
                  step={100000}
                  className="w-full"
                />
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد الغرف</label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر عدد الغرف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الكل">الكل</SelectItem>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>{num} غرف</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bathrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد الحمامات</label>
                <Select value={bathrooms} onValueChange={setBathrooms}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر عدد الحمامات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الكل">الكل</SelectItem>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>{num} حمامات</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
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
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                const payload = {
                  alertName: savedSearchName || 'بحث الخريطة',
                  propertyTypes: selectedType !== 'الكل' ? [selectedType] : [],
                  cities: selectedCity !== 'الكل' ? [selectedCity] : [],
                };
                const res = await fetch('/api/search/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!res.ok) throw new Error('failed');
                alert('تم حفظ البحث');
              } catch { alert('تعذر حفظ البحث'); }
            }}>
              <Save className="h-4 w-4 ml-2" />
              حفظ البحث
            </Button>
            <div className="text-sm text-gray-500">
              {filteredProperties.length} عقار متاح
            </div>
          </div>
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
      </div>

      {/* Full Height Map Container */}
      <div className="flex-1 relative">
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
                            <span>{property.squareFeet} متر²</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <Badge className="bg-green-600 text-white text-xs">
                          {property.propertyCategory}
                        </Badge>
                        <div className="flex gap-2 mt-2">
                          <button className="px-2 py-1 text-xs rounded bg-green-600 text-white" onClick={() => saveFavorite(property.id)}>حفظ</button>
                          <button className="px-2 py-1 text-xs rounded bg-gray-200" onClick={() => toggleCompare(property.id)}>مقارنة</button>
                        </div>
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
