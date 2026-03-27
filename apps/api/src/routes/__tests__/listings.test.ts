import { describe, it, expect } from 'vitest';

// Test the pagination/query logic in isolation
const MAX_PAGE_SIZE = 500;

function buildListingsQuery(params: {
    page?: string;
    limit?: string;
    status?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
}) {
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(params.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' };
    if (params.minPrice || params.maxPrice) {
        where.price = {
            ...(params.minPrice ? { gte: parseFloat(params.minPrice) } : {}),
            ...(params.maxPrice ? { lte: parseFloat(params.maxPrice) } : {}),
        };
    }

    return { skip, take: limit, where };
}

describe('Listings query builder', () => {
    it('uses default page=1 and limit=20', () => {
        const query = buildListingsQuery({});
        expect(query.skip).toBe(0);
        expect(query.take).toBe(20);
    });

    it('caps limit at MAX_PAGE_SIZE (500)', () => {
        const query = buildListingsQuery({ limit: '9999' });
        expect(query.take).toBe(500);
    });

    it('computes correct skip for page 3 with limit 20', () => {
        const query = buildListingsQuery({ page: '3', limit: '20' });
        expect(query.skip).toBe(40);
    });

    it('prevents negative page by clamping to 1', () => {
        const query = buildListingsQuery({ page: '-5' });
        expect(query.skip).toBe(0);
        expect(query.take).toBe(20);
    });

    it('filters by status', () => {
        const query = buildListingsQuery({ status: 'ACTIVE' });
        expect(query.where.status).toBe('ACTIVE');
    });

    it('filters by city (case-insensitive)', () => {
        const query = buildListingsQuery({ city: 'الرياض' });
        expect(query.where.city).toEqual({ contains: 'الرياض', mode: 'insensitive' });
    });

    it('builds price range filter with both min and max', () => {
        const query = buildListingsQuery({ minPrice: '100000', maxPrice: '500000' });
        expect(query.where.price).toEqual({ gte: 100000, lte: 500000 });
    });

    it('builds price range with only minPrice', () => {
        const query = buildListingsQuery({ minPrice: '250000' });
        expect(query.where.price).toEqual({ gte: 250000 });
    });

    it('does not add price filter when neither min nor max supplied', () => {
        const query = buildListingsQuery({});
        expect(query.where.price).toBeUndefined();
    });

    it('handles limit=1 (minimum)', () => {
        const query = buildListingsQuery({ limit: '0' });
        expect(query.take).toBe(1);
    });
});
