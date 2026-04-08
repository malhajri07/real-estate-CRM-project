/**
 * valuation.service.ts — Property Valuation & CMA
 *
 * Comparable Market Analysis (CMA) + rule-based property valuation.
 * Finds similar properties and estimates value based on comparables.
 */

import { prisma } from "../../prismaClient";

export interface Comparable {
  id: string;
  title: string;
  city: string;
  district: string;
  type: string;
  price: number;
  areaSqm: number;
  bedrooms: number;
  pricePerSqm: number;
}

export interface ValuationResult {
  estimatedValue: number;
  confidenceRange: { low: number; high: number };
  pricePerSqm: number;
  comparables: Comparable[];
  factors: { factor: string; impact: string }[];
  methodology: string;
}

export class ValuationService {
  /**
   * Find comparable properties and estimate value.
   */
  async getValuation(propertyId: string): Promise<ValuationResult | null> {
    const property = await prisma.properties.findUnique({
      where: { id: propertyId },
      select: { city: true, district: true, type: true, price: true, areaSqm: true, bedrooms: true, buildingAge: true, facadeDirection: true },
    });

    if (!property || !property.city) return null;

    const area = Number(property.areaSqm) || 0;
    const bedrooms = property.bedrooms || 0;

    // Find comparables: same city, similar type, area ±30%, bedrooms ±1
    const comparables = await prisma.properties.findMany({
      where: {
        id: { not: propertyId },
        city: property.city,
        ...(property.district && { district: property.district }),
        ...(property.type && { type: property.type }),
        price: { not: null },
        areaSqm: area > 0 ? { gte: area * 0.7, lte: area * 1.3 } : undefined,
        ...(bedrooms > 0 && { bedrooms: { gte: bedrooms - 1, lte: bedrooms + 1 } }),
      },
      select: { id: true, title: true, city: true, district: true, type: true, price: true, areaSqm: true, bedrooms: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    if (comparables.length === 0) return null;

    const compData: Comparable[] = comparables
      .filter((c) => c.price && c.areaSqm)
      .map((c) => ({
        id: c.id,
        title: c.title || "",
        city: c.city || "",
        district: c.district || "",
        type: c.type || "",
        price: Number(c.price),
        areaSqm: Number(c.areaSqm),
        bedrooms: c.bedrooms || 0,
        pricePerSqm: Number(c.price) / Number(c.areaSqm),
      }));

    if (compData.length === 0) return null;

    // Calculate average price per sqm from comparables
    const avgPricePerSqm = compData.reduce((sum, c) => sum + c.pricePerSqm, 0) / compData.length;
    const estimatedValue = area > 0 ? Math.round(avgPricePerSqm * area) : Math.round(compData.reduce((sum, c) => sum + c.price, 0) / compData.length);

    // Confidence range: ±15%
    const low = Math.round(estimatedValue * 0.85);
    const high = Math.round(estimatedValue * 1.15);

    // Adjustment factors
    const factors: { factor: string; impact: string }[] = [];
    if (property.buildingAge && property.buildingAge < 5) factors.push({ factor: "عقار حديث البناء", impact: "+5%" });
    if (property.buildingAge && property.buildingAge > 20) factors.push({ factor: "عقار قديم", impact: "-10%" });
    if (property.facadeDirection === "NORTH" || property.facadeDirection === "EAST") factors.push({ factor: "واجهة شمالية/شرقية", impact: "+3%" });
    if (property.district) factors.push({ factor: `حي ${property.district}`, impact: "مؤثر" });

    return {
      estimatedValue,
      confidenceRange: { low, high },
      pricePerSqm: Math.round(avgPricePerSqm),
      comparables: compData.slice(0, 10),
      factors,
      methodology: `تم التقييم بناءً على ${compData.length} عقار مشابه في ${property.city}${property.district ? ` - ${property.district}` : ""}. متوسط سعر المتر المربع: ${Math.round(avgPricePerSqm).toLocaleString()} ر.س.`,
    };
  }
}

export const valuationService = new ValuationService();
