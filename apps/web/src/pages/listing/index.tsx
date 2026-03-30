/**
 * listing.tsx - Public Listing Page
 *
 * Location: apps/web/src/ → Pages/ → Platform Pages → listing.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 *
 * Public listing detail page. Displays:
 * - Public property listing information
 * - Property images
 * - Listing details
 *
 * Route: /home/platform/listing/:id or /listing/:id
 *
 * Related Files:
 * - apps/web/src/components/listings/ListingCard.tsx - Listing card component
 * - apps/api/routes/listings.ts - Listing API routes
 */

import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { PhotoCarousel } from '@/components/ui/photo-carousel';
import ListingCard from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { LISTING_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '@/constants/labels';

export default function ListingPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<any>({ queryKey: ["/api/listings", id] });
  const { data: similar = [] } = useQuery<any[]>({
    queryKey: ["/api/listings", id, "similar"],
    queryFn: async () => {
      const r = await fetch(`/api/listings/${id}/similar`);
      if (!r.ok) return [];
      return r.json();
    },
  });

  if (isLoading) return <div className="text-muted-foreground p-8 text-center">جار التحميل...</div>;
  if (error || !data) return <div className="text-muted-foreground p-8 text-center">غير متوفر</div>;

  const p = data;
  const photos: string[] = Array.isArray(p.photoUrls) ? p.photoUrls : [];

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            {photos.length > 0 ? (
              <PhotoCarousel photos={photos} alt={p.title} className="aspect-video" showIndicators={true} />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                لا توجد صور
              </div>
            )}
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-foreground mb-3">الوصف</h2>
              <p className="text-muted-foreground leading-7">{p.description || 'بدون وصف'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="text-2xl font-bold text-primary">{p.price} ﷼</div>
              <div className="text-sm text-muted-foreground">
                {PROPERTY_TYPE_LABELS[p.propertyType] ?? p.propertyType}
              </div>
              <div className="text-sm text-muted-foreground">
                الحالة: {LISTING_STATUS_LABELS[p.status] ?? p.status}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <Button asChild className="w-full" size="lg">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  تواصل عبر واتساب
                </a>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                رجوع
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={async () => {
                  await fetch('/api/reports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ listingId: id, reason: 'محتوى غير مناسب' }),
                  });
                  toast.success('تم إرسال البلاغ');
                }}
              >
                الإبلاغ عن إعلان
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {Array.isArray(similar) && similar.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold text-foreground mb-4">عقارات مشابهة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {similar.slice(0, 6).map((item: any) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
