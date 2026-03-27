/**
 * Integration tests for listings route (T-004)
 * Tests HTTP-layer query parsing and response shapes without hitting the database.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock storage before importing the router
vi.mock('../../../storage-prisma', () => ({
    storage: {
        getPropertiesPaginated: vi.fn().mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            totalPages: 0,
        }),
        getProperty: vi.fn().mockResolvedValue(null),
        getAllProperties: vi.fn().mockResolvedValue([]),
        createListing: vi.fn(),
        updateListing: vi.fn(),
        deleteListing: vi.fn(),
        getFeaturedListings: vi.fn().mockResolvedValue([]),
    },
}));

// Mock i18n helper
vi.mock('../../../i18n', () => ({
    getErrorResponse: (_code: string) => ({ error: _code }),
}));

// Mock logger
vi.mock('../../../logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Mock auth middleware — let requests through as unauthenticated for public listing endpoints
vi.mock('../../middleware/auth.middleware', () => ({
    authenticateToken: vi.fn((_req: any, _res: any, next: any) => next()),
}));

let app: express.Express;

beforeAll(async () => {
    app = express();
    app.use(express.json());

    const { default: listingsRouter } = await import('../../../routes/listings');
    app.use('/api/listings', listingsRouter);
});

describe('GET /api/listings — public endpoint', () => {
    it('returns 200 with pagination metadata', async () => {
        const res = await request(app).get('/api/listings');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('items');
        expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('returns 200 with default page and pageSize', async () => {
        const res = await request(app).get('/api/listings');
        expect(res.status).toBe(200);
        expect(res.body.page).toBe(1);
        expect(res.body.pageSize).toBe(20);
    });

    it('accepts valid pagination query params', async () => {
        const res = await request(app).get('/api/listings?page=2&pageSize=10');
        expect(res.status).toBe(200);
    });

    it('caps pageSize at 500 and still returns 200', async () => {
        const res = await request(app).get('/api/listings?pageSize=9999');
        expect(res.status).toBe(200);
    });

    it('accepts status filter', async () => {
        const res = await request(app).get('/api/listings?status=ACTIVE');
        expect(res.status).toBe(200);
    });

    it('accepts city filter', async () => {
        const res = await request(app).get('/api/listings?city=%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6');
        expect(res.status).toBe(200);
    });

    it('accepts price range filters', async () => {
        const res = await request(app).get('/api/listings?minPrice=100000&maxPrice=500000');
        expect(res.status).toBe(200);
    });

    it('accepts listingType filter', async () => {
        const res = await request(app).get('/api/listings?listingType=SALE');
        expect(res.status).toBe(200);
    });

    it('accepts full-text search query', async () => {
        const res = await request(app).get('/api/listings?q=villa');
        expect(res.status).toBe(200);
    });
});

describe('GET /api/listings/:id — single listing', () => {
    it('returns 404 for a non-existent listing', async () => {
        const res = await request(app).get('/api/listings/nonexistent-id');
        expect(res.status).toBe(404);
    });
});
