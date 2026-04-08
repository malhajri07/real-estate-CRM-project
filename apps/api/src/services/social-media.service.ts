/**
 * social-media.service.ts — Social Media Post Generator (Session 5.10)
 *
 * Generate formatted posts from listing data for Instagram/Twitter/LinkedIn.
 * Internal tool — agents copy the generated text, not auto-posted.
 */

export interface ListingPostData {
  title: string;
  city: string;
  district?: string;
  type: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  features?: string[];
  agentName: string;
  agentPhone: string;
  listingUrl?: string;
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} مليون ر.س`;
  if (n >= 1000) return `${Math.round(n / 1000)} ألف ر.س`;
  return `${n} ر.س`;
}

export function generateInstagramPost(data: ListingPostData): string {
  const specs = [
    data.bedrooms && `🛏 ${data.bedrooms} غرف`,
    data.bathrooms && `🚿 ${data.bathrooms} حمام`,
    data.area && `📐 ${data.area} م²`,
  ].filter(Boolean).join(" · ");

  const features = (data.features || []).slice(0, 5).map((f) => `✅ ${f}`).join("\n");

  return `🏠 ${data.title}

📍 ${data.city}${data.district ? ` - ${data.district}` : ""}
💰 ${formatPrice(data.price)}
${specs}

${features}

📞 للتواصل: ${data.agentPhone}
👤 الوسيط: ${data.agentName}

#عقارات #${data.city.replace(/\s/g, "_")} #عقار_للبيع #عقاركم #سعودي #استثمار_عقاري`;
}

export function generateTwitterPost(data: ListingPostData): string {
  return `🏠 ${data.type} ${data.bedrooms ? `${data.bedrooms} غرف` : ""} في ${data.city}
💰 ${formatPrice(data.price)}
📍 ${data.district || data.city}
📞 ${data.agentPhone}
${data.listingUrl || ""}
#عقارات_السعودية`;
}

export function generateWhatsAppPost(data: ListingPostData): string {
  const specs = [
    data.bedrooms && `غرف: ${data.bedrooms}`,
    data.bathrooms && `حمامات: ${data.bathrooms}`,
    data.area && `المساحة: ${data.area} م²`,
  ].filter(Boolean).join("\n");

  return `🏠 *${data.title}*

📍 ${data.city}${data.district ? ` - ${data.district}` : ""}
💰 *${formatPrice(data.price)}*

${specs}

${(data.features || []).slice(0, 4).map((f) => `✅ ${f}`).join("\n")}

👤 الوسيط: ${data.agentName}
📞 ${data.agentPhone}
${data.listingUrl ? `🔗 ${data.listingUrl}` : ""}`;
}

export const socialMediaService = { generateInstagramPost, generateTwitterPost, generateWhatsAppPost };
