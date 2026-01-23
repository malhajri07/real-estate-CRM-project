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

export default function ListingPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<any>({ queryKey: ["/api/listings", id] });
  const { data: similar = [] } = useQuery<any[]>({ queryKey: ["/api/listings", id, "similar"], queryFn: async () => {
    const r = await fetch(`/api/listings/${id}/similar`);
    if (!r.ok) return [];
    return r.json();
  }});

  if (isLoading) return <div className="text-gray-600">...جار التحميل</div>;
  if (error || !data) return <div className="text-gray-600">غير متوفر</div>;

  const p = data;
  const photos: string[] = Array.isArray(p.photoUrls) ? p.photoUrls : [];

  return ( 
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {photos.length > 0 ? (
            <div className="ui-surface overflow-hidden">
              <PhotoCarousel photos={photos} alt={p.title} className="aspect-video" showIndicators={true} />
            </div>
          ) : (
            <div className="ui-surface h-64 flex items-center justify-center text-gray-500">لا توجد صور</div>
          )}
          <div className="ui-surface p-6 mt-6">
            <h2 className="font-semibold mb-3">الوصف</h2>
            <p className="text-gray-700 leading-7">{p.description || 'بدون وصف'}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="ui-surface p-5">
            <div className="text-2xl font-bold text-green-700 mb-2">{p.price} ﷼</div>
            <div className="text-sm text-gray-600">{p.propertyType}</div>
            <div className="text-sm text-gray-600">الحالة: {p.status}</div>
          </div>
          <div className="ui-surface p-5">
            <a className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded" href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`}>تواصل عبر واتساب</a>
            <button className="block w-full mt-2 border rounded px-4 py-2" onClick={() => window.history.back()}>رجوع</button>
            <button className="block w-full mt-2 border rounded px-4 py-2" onClick={async ()=>{
              await fetch('/api/reports', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ listingId: id, reason: 'محتوى غير مناسب' })});
              alert('تم إرسال البلاغ');
            }}>الإبلاغ عن إعلان</button>
          </div>
        </div>
      </div>
      {Array.isArray(similar) && similar.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4">عقارات مشابهة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {similar.slice(0,6).map((p:any)=> <ListingCard key={p.id} item={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
