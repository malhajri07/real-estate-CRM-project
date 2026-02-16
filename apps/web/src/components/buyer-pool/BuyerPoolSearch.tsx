/**
 * BuyerPoolSearch.tsx - Buyer Pool Search Component
 * 
 * Location: apps/web/src/ → Components/ → Feature Components → buyer-pool/ → BuyerPoolSearch.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Buyer pool search component for agents. Provides:
 * - Buyer request search and filtering
 * - Request claiming functionality
 * - Request detail view
 * 
 * Related Files:
 * - apps/api/routes/buyer-pool.ts - Buyer pool API routes
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Bed, Bath, DollarSign, Clock, User, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface BuyerRequest {
  id: string;
  city: string;
  type: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  contactPreferences: any;
  status: string;
  maskedContact: any;
  fullContact?: any;
  hasActiveClaim: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface SearchFilters {
  city: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  maxBedrooms: string;
}

export default function BuyerPoolSearch() {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SearchFilters>({
    city: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    maxBedrooms: ''
  });

  // Check if user can search buyer pool
  const canSearchBuyerPool = hasPermission('search_buyer_pool');
  const canClaimBuyerRequests = hasPermission('claim_buyer_requests');

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (filters.city) queryParams.set('city', filters.city);
  if (filters.type) queryParams.set('type', filters.type);
  if (filters.minPrice) queryParams.set('minPrice', filters.minPrice);
  if (filters.maxPrice) queryParams.set('maxPrice', filters.maxPrice);
  if (filters.minBedrooms) queryParams.set('minBedrooms', filters.minBedrooms);
  if (filters.maxBedrooms) queryParams.set('maxBedrooms', filters.maxBedrooms);

  // Fetch buyer requests
  const { data: buyerRequests, isLoading, error } = useQuery({
    queryKey: ['buyer-requests', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/pool/buyers/search?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch buyer requests');
      }
      
      const data = await response.json();
      return data.data as BuyerRequest[];
    },
    enabled: canSearchBuyerPool,
  });

  // Claim buyer request mutation
  const claimMutation = useMutation({
    mutationFn: async (buyerRequestId: string) => {
      const response = await fetch(`/api/pool/buyers/${buyerRequestId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ notes: 'Claimed via buyer pool search' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim buyer request');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-requests'] });
    },
  });

  // Release claim mutation
  const releaseMutation = useMutation({
    mutationFn: async (buyerRequestId: string) => {
      const response = await fetch(`/api/pool/buyers/${buyerRequestId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ notes: 'Released via buyer pool search' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to release claim');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-requests'] });
    },
  });

  const handleClaim = (buyerRequestId: string) => {
    claimMutation.mutate(buyerRequestId);
  };

  const handleRelease = (buyerRequestId: string) => {
    releaseMutation.mutate(buyerRequestId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (!canSearchBuyerPool) {
    return (
      <Alert>
        <AlertDescription>
          ليس لديك صلاحية للوصول إلى قاعدة بيانات المشترين
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>البحث في قاعدة بيانات المشترين</CardTitle>
          <CardDescription>
            ابحث عن طلبات المشترين وادعيها للحصول على تفاصيل الاتصال الكاملة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">المدينة</label>
              <Select value={filters.city || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المدن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدن</SelectItem>
                  <SelectItem value="الرياض">الرياض</SelectItem>
                  <SelectItem value="جدة">جدة</SelectItem>
                  <SelectItem value="الدمام">الدمام</SelectItem>
                  <SelectItem value="مكة">مكة</SelectItem>
                  <SelectItem value="المدينة">المدينة</SelectItem>
                  <SelectItem value="الخبر">الخبر</SelectItem>
                  <SelectItem value="الطائف">الطائف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">نوع العقار</label>
              <Select value={filters.type || "any"} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === "any" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">جميع الأنواع</SelectItem>
                  <SelectItem value="شقة">شقة</SelectItem>
                  <SelectItem value="فيلا">فيلا</SelectItem>
                  <SelectItem value="دوبلكس">دوبلكس</SelectItem>
                  <SelectItem value="تاون هاوس">تاون هاوس</SelectItem>
                  <SelectItem value="استوديو">استوديو</SelectItem>
                  <SelectItem value="بنتهاوس">بنتهاوس</SelectItem>
                  <SelectItem value="شقة مفروشة">شقة مفروشة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">الحد الأدنى للسعر</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">الحد الأقصى للسعر</label>
              <Input
                type="number"
                placeholder="10000000"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">الحد الأدنى للغرف</label>
              <Input
                type="number"
                placeholder="1"
                value={filters.minBedrooms || "any"}
                onChange={(e) => setFilters(prev => ({ ...prev, minBedrooms: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">الحد الأقصى للغرف</label>
              <Input
                type="number"
                placeholder="10"
                value={filters.maxBedrooms || "any"}
                onChange={(e) => setFilters(prev => ({ ...prev, maxBedrooms: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            خطأ في تحميل طلبات المشترين: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {buyerRequests && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buyerRequests.map((request) => (
            <Card key={request.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.type}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {request.city}
                    </CardDescription>
                  </div>
                  <Badge variant={request.hasActiveClaim ? "default" : "secondary"}>
                    {request.hasActiveClaim ? "مُدعى" : "متاح"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    <span>
                      {request.minBedrooms && request.maxBedrooms
                        ? `${request.minBedrooms}-${request.maxBedrooms} غرف`
                        : request.minBedrooms
                        ? `${request.minBedrooms}+ غرف`
                        : 'غير محدد'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {request.minPrice && request.maxPrice
                        ? `${formatPrice(request.minPrice)} - ${formatPrice(request.maxPrice)}`
                        : request.minPrice
                        ? `${formatPrice(request.minPrice)}+`
                        : 'غير محدد'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{request.createdBy.firstName} {request.createdBy.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(request.createdAt)}</span>
                  </div>
                </div>

                {request.hasActiveClaim ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">تفاصيل الاتصال الكاملة</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{request.fullContact?.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{request.fullContact?.email}</span>
                        </div>
                      </div>
                    </div>
                    {canClaimBuyerRequests && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRelease(request.id)}
                        disabled={releaseMutation.isPending}
                        className="w-full"
                      >
                        {releaseMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'إلغاء المطالبة'
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">معلومات الاتصال المقنعة</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{request.maskedContact?.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{request.maskedContact?.email}</span>
                        </div>
                      </div>
                    </div>
                    {canClaimBuyerRequests && (
                      <Button
                        onClick={() => handleClaim(request.id)}
                        disabled={claimMutation.isPending}
                        className="w-full"
                      >
                        {claimMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'ادعي هذا الطلب'
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {claimMutation.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {claimMutation.error.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {buyerRequests && buyerRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">لا توجد طلبات مشترين تطابق معايير البحث</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
