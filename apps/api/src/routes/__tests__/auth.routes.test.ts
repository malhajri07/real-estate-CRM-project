/**
 * Integration tests for auth route validation (T-003)
 * Tests HTTP-layer validation without hitting the database.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';

// Static mock for AuthService — must mirror the class shape used in auth.middleware.ts
const mockAuthServiceStatic = {
    verifyToken: vi.fn().mockReturnValue(null),
    generateToken: vi.fn().mockReturnValue('mock-token'),
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
};

vi.mock('../../services/auth.service', () => ({
    AuthService: Object.assign(
        vi.fn().mockImplementation(() => ({
            login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
            register: vi.fn().mockRejectedValue(new Error('Email already exists')),
        })),
        mockAuthServiceStatic,
    ),
}));

// Mock prisma — needed by auth.middleware.ts
vi.mock('../../../prismaClient', () => ({
    prisma: {
        users: {
            findFirst: vi.fn().mockResolvedValue(null),
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
        },
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

let app: express.Express;

beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Mount auth router — import after mocks are set up
    const { default: authRouter } = await import('../../../routes/auth');
    app.use('/api/auth', authRouter);
});

describe('POST /api/auth/login — validation', () => {
    it('returns 400 when body is empty', async () => {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.status).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when email format is invalid', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'not-an-email', password: 'pass123' });
        expect(res.status).toBe(400);
    });

    it('returns 401 for valid format but wrong credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@example.com', password: 'wrongpass' });
        expect(res.status).toBe(401);
    });
});

describe('POST /api/auth/register — validation', () => {
    it('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@example.com' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'bad-email',
                password: 'SecurePass1!',
                firstName: 'Ahmed',
                lastName: 'Ali',
                roles: 'AGENT',
            });
        expect(res.status).toBe(400);
    });

    it('returns 400 when password is too weak (no uppercase)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'weakpassword1',
                firstName: 'Ahmed',
                lastName: 'Ali',
                roles: 'AGENT',
            });
        expect(res.status).toBe(400);
    });

    it('returns 400 when phone has invalid Saudi format', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'SecurePass1!',
                firstName: 'Ahmed',
                lastName: 'Ali',
                roles: 'AGENT',
                phone: '12345678',
            });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/auth/me — authentication guard', () => {
    it('returns 401 when no Authorization header', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    it('returns 403 when token is malformed (verifyToken returns null)', async () => {
        // verifyToken mock already returns null — middleware sends 403
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer not.a.valid.token');
        expect(res.status).toBe(403);
    });
});
