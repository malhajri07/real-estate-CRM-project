/**
 * brochure.service.ts — Branded PDF Brochure Generator (Session 5.12)
 *
 * Generate property brochures with photos, specs, and agent branding.
 * Uses HTML template → browser print-to-PDF pattern.
 */

export interface BrochureData {
  property: {
    title: string;
    city: string;
    district?: string;
    type: string;
    price: number;
    area?: number;
    bedrooms?: number;
    bathrooms?: number;
    description?: string;
    photos: string[];
    features?: string[];
  };
  agent: {
    name: string;
    phone: string;
    email?: string;
    falNumber?: string;
    organization?: string;
    photo?: string;
  };
}

/**
 * Generate HTML for a property brochure (print-friendly).
 * Agent prints to PDF via browser.
 */
export function generateBrochureHTML(data: BrochureData): string {
  const { property: p, agent: a } = data;
  const photos = p.photos.slice(0, 6);
  const features = p.features || [];

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>${p.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'IBM Plex Sans Arabic', sans-serif; color: #1a1a1a; }
  .page { max-width: 210mm; margin: 0 auto; padding: 20mm; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d9668; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 24px; color: #0d9668; }
  .photos { display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 24px; }
  .photos img { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; }
  .photos img:first-child { grid-row: span 2; height: 408px; }
  .specs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .spec { text-align: center; padding: 12px; background: #f0fdf4; border-radius: 8px; }
  .spec .value { font-size: 20px; font-weight: 700; color: #0d9668; }
  .spec .label { font-size: 11px; color: #666; }
  .description { margin-bottom: 24px; line-height: 1.8; color: #444; }
  .features { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
  .feature { background: #f0fdf4; color: #0d9668; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
  .agent { display: flex; align-items: center; gap: 16px; background: #f8f9fa; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
  .agent .info { flex: 1; }
  .agent .name { font-size: 16px; font-weight: 700; }
  .agent .detail { font-size: 12px; color: #666; margin-top: 4px; }
  .price { font-size: 28px; font-weight: 700; color: #0d9668; margin-bottom: 8px; }
  .footer { text-align: center; margin-top: 24px; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @media print { .page { padding: 10mm; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <h1>${p.title}</h1>
      <p style="color:#666;font-size:14px;">${p.city}${p.district ? ` - ${p.district}` : ""} · ${p.type}</p>
    </div>
    <div class="price">${p.price.toLocaleString()} ر.س</div>
  </div>

  ${photos.length > 0 ? `<div class="photos">${photos.map((url) => `<img src="${url}" alt="">`).join("")}</div>` : ""}

  <div class="specs">
    ${p.bedrooms ? `<div class="spec"><div class="value">${p.bedrooms}</div><div class="label">غرف نوم</div></div>` : ""}
    ${p.bathrooms ? `<div class="spec"><div class="value">${p.bathrooms}</div><div class="label">حمامات</div></div>` : ""}
    ${p.area ? `<div class="spec"><div class="value">${p.area}</div><div class="label">م²</div></div>` : ""}
    <div class="spec"><div class="value">${Math.round(p.price / (p.area || 1)).toLocaleString()}</div><div class="label">ر.س/م²</div></div>
  </div>

  ${p.description ? `<div class="description"><strong>الوصف:</strong><br>${p.description}</div>` : ""}

  ${features.length > 0 ? `<div class="features">${features.map((f) => `<span class="feature">✓ ${f}</span>`).join("")}</div>` : ""}

  <div class="agent">
    <div class="info">
      <div class="name">${a.name}</div>
      <div class="detail">${a.phone}${a.email ? ` · ${a.email}` : ""}</div>
      ${a.falNumber ? `<div class="detail">رخصة فال: ${a.falNumber}</div>` : ""}
      ${a.organization ? `<div class="detail">${a.organization}</div>` : ""}
    </div>
  </div>

  <div class="footer">
    تم إنشاء هذا الكتيب بواسطة منصة عقاركم · rega.gov.sa
  </div>
</div>
</body>
</html>`;
}

export const brochureService = { generateBrochureHTML };
