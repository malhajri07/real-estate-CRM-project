import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

type Listing = {
  id: string;
  title: string;
  address?: string | null;
  city?: string | null;
  price?: string | number | null;
  propertyType?: string | null;
  status?: string | null;
  photoUrls?: string[] | null;
};

export default function ListingCard({ item }: { item: Listing }) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const img = item.photoUrls?.[0];

  const onSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: item.id })
      });
      if (!res.ok) throw new Error('save failed');
      alert(t('listing.added'));
    } catch {
      alert(t('listing.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const onCompare = () => {
    try {
      const raw = localStorage.getItem('compareIds');
      const arr = raw ? JSON.parse(raw) : [];
      let list: string[] = Array.isArray(arr) ? arr : [];
      if (list.includes(item.id)) list = list.filter((x) => x !== item.id); else list = [...list, item.id].slice(0, 4);
      localStorage.setItem('compareIds', JSON.stringify(list));
      alert(t('listing.compare_added'));
    } catch {}
  };

  const toDetails = () => {
    window.location.href = `/home/platform/listing/${item.id}`;
  };

  return (
    <div className="apple-card overflow-hidden group">
      <div className="aspect-video bg-gray-100 relative">
        {img ? (
          <img src={img} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">{t('listing.no_photo')}</div>
        )}
        {item.status && (
          <span className="absolute top-2 left-2 text-xs bg-white/90 rounded px-2 py-1 text-gray-700">{item.status}</span>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm text-gray-500">{item.city}{item.address ? `، ${item.address}` : ''}</div>
        <div className="font-semibold text-gray-900 mt-1 line-clamp-2">{item.title}</div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-green-700 font-bold">{item.price ? `${item.price} ﷼` : ''}</div>
          {item.propertyType && <span className="text-xs px-2 py-1 bg-gray-100 rounded">{item.propertyType}</span>}
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={toDetails} className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs">{t('listing.details')}</Button>
          <Button onClick={onSave} disabled={saving} variant="outline" className="h-8 px-3 text-xs">{t('listing.save')}</Button>
          <Button onClick={onCompare} variant="outline" className="h-8 px-3 text-xs">{t('listing.compare')}</Button>
        </div>
      </div>
    </div>
  );
}
