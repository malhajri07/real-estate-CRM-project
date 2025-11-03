# ?? Application Audit - Issues & Recommended Fixes

**Date:** January 2025  
**Application:** Real Estate CRM Platform  
**Audit Type:** End-to-End Code & Configuration Review

---

## ?? CRITICAL ISSUES

### 1. JWT Fallback Secret Vulnerability
**Location:** `apps/api/auth.ts:17`

**Issue:**
```typescript
const JWT_SECRET = getJwtSecret() || 'fallback-jwt-secret-key-12345';
```
Hardcoded fallback secret completely defeats the purpose of environment-based secrets. If `getJwtSecret()` returns empty/null, the application uses a predictable hardcoded secret, making JWT tokens vulnerable to forgery.

**Recommended Fix:**
```typescript
import { JWT_SECRET as getJwtSecret } from './config/env';

// Remove fallback - env.ts already throws if missing
const JWT_SECRET = getJwtSecret();
```

**Why:** The `env.ts` file already has proper error handling that throws if `JWT_SECRET` is missing. Using the fallback bypasses this security check.

---

### 2. Hardcoded CORS Origins
**Location:** `apps/api/index.ts:42-45`

**Issue:**
```typescript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  // ...
});
```
Only allows requests from `localhost:3000`, which will break in production or any other environment.

**Recommended Fix:**
```typescript
import cors from 'cors';

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));
```

**Environment Variable:**
```bash
CORS_ORIGINS=http://localhost:3000,https://app.example.com,https://www.example.com
```

---

### 3. Insecure Session Cookies
**Location:** `apps/api/index.ts:67-79`

**Issue:**
```typescript
app.use(
  session({
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false, // ? Insecure in production
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  }),
);
```
`secure: false` means cookies are sent over HTTP, making them vulnerable to man-in-the-middle attacks. Also missing explicit `httpOnly: true`.

**Recommended Fix:**
```typescript
app.use(
  session({
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production' || req.secure,
      httpOnly: true, // Explicitly prevent XSS access
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      domain: process.env.COOKIE_DOMAIN || undefined, // Set in production
    },
  }),
);
```

**Note:** For production behind a proxy (Cloud Run, etc.), you may need:
```typescript
app.set('trust proxy', 1); // Trust first proxy
```

---

### 4. No Rate Limiting
**Location:** Authentication endpoints (`apps/api/routes/auth.ts`)

**Issue:** No rate limiting on authentication endpoints, making the application vulnerable to brute force attacks and credential stuffing.

**Recommended Fix:**
```typescript
import rateLimit from 'express-rate-limit';

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Optional: Store in Redis for distributed systems
  // store: new RedisStore({ client: redis }),
});

// Apply to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

app.use('/api/', apiLimiter);
```

**Install:**
```bash
npm install express-rate-limit
npm install --save-dev @types/express-rate-limit
```

---

### 5. Missing Security Headers
**Location:** `apps/api/index.ts` (main app setup)

**Issue:** No security headers configured, leaving application vulnerable to XSS, clickjacking, and other web vulnerabilities.

**Recommended Fix:**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Consider removing if possible
        "https://maps.googleapis.com", // Google Maps
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // May need false for Google Maps
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));
```

**Install:**
```bash
npm install helmet
npm install --save-dev @types/helmet
```

---

## ?? HIGH PRIORITY ISSUES

### 6. Monolithic Routes File
**Location:** `apps/api/routes.ts` (1,013 lines)

**Issue:** Single file contains both imported route modules and inline route definitions, making it difficult to maintain, test, and scale.

**Recommended Fix:**
Extract inline routes to separate modules:

```typescript
// routes/leads.ts
import { Router } from 'express';
import { storage } from '../storage-prisma';
import { decodeAuth, requireAnyPerm } from '../auth';
import { z } from 'zod';

const router = Router();

const insertLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.union([z.string().email(), z.literal('')]).optional().transform(v => v || undefined),
  phone: z.string().min(1).optional(),
  status: z.string().optional(),
  leadSource: z.string().optional(),
  interestType: z.string().optional(),
  city: z.string().optional(),
  budgetRange: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional(),
});

router.get('/', async (req, res) => {
  try {
    const auth = decodeAuth(req);
    const leads = await storage.getAllLeads();
    // ... existing logic
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leads' });
  }
});

router.post('/', requireAnyPerm(['requests:manage:all', 'requests:manage:corporate']), async (req, res) => {
  try {
    const validatedData = insertLeadSchema.parse(req.body);
    const lead = await storage.createLead(validatedData);
    res.status(201).json(lead);
  } catch (error) {
    // ... error handling
  }
});

export default router;
```

```typescript
// routes/index.ts
import leadsRoutes from './leads';
import propertiesRoutes from './properties';
import dealsRoutes from './deals';
import activitiesRoutes from './activities';
import messagesRoutes from './messages';

export function registerRoutes(app: Express) {
  app.use('/api/leads', leadsRoutes);
  app.use('/api/properties', propertiesRoutes);
  app.use('/api/deals', dealsRoutes);
  app.use('/api/activities', activitiesRoutes);
  app.use('/api/messages', messagesRoutes);
  // ... other route modules
}
```

**Benefits:**
- Better code organization
- Easier testing
- Parallel development
- Reduced merge conflicts

---

### 7. No Centralized Error Handling
**Location:** Throughout `apps/api/routes/` and `apps/api/routes.ts`

**Issue:** Error handling is inconsistent - some routes catch errors, others don't. Error responses vary in format, making debugging difficult.

**Recommended Fix:**
Create centralized error handling:

```typescript
// errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
```

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code || 'APP_ERROR',
      message: err.message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
      }),
    });
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError' && (err as any).issues) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: (err as any).issues,
    });
  }

  // Handle unknown errors
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};

// middleware/asyncHandler.ts
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**Usage in routes:**
```typescript
import { asyncHandler } from '../middleware/asyncHandler';
import { NotFoundError, ValidationError } from '../errors/AppError';

router.get('/:id', asyncHandler(async (req, res) => {
  const lead = await storage.getLead(req.params.id);
  if (!lead) {
    throw new NotFoundError('Lead');
  }
  res.json(lead);
}));
```

**Register after all routes:**
```typescript
// apps/api/index.ts
import { errorHandler } from './middleware/errorHandler';

// ... register routes

// Error handler must be last
app.use(errorHandler);
```

---

### 8. No Query Optimization
**Location:** Throughout database queries

**Issue:** 
- No pagination on list endpoints (will load all records)
- Potential N+1 query problems
- Missing database indexes
- No query result caching

**Recommended Fix:**

**A. Add Pagination:**
```typescript
// routes/leads.ts
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    prisma.leads.findMany({
      where: { agentId: userId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leads.count({ where: { agentId: userId } }),
  ]);

  res.json({
    data: leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));
```

**B. Fix N+1 Queries:**
```typescript
// Bad (N+1 queries)
const leads = await prisma.leads.findMany();
for (const lead of leads) {
  const customer = await prisma.customers.findUnique({ where: { id: lead.customerId } });
  // ...
}

// Good (single query with include)
const leads = await prisma.leads.findMany({
  include: {
    customer: true,
    property: true,
    contactLogs: {
      take: 5,
      orderBy: { contactedAt: 'desc' },
    },
  },
});
```

**C. Add Database Indexes:**
```sql
-- Add to Prisma schema or migration
-- apps/api/data/schema/prisma/schema.prisma

model leads {
  // ... existing fields
  
  @@index([agentId, status])  // Composite index for common queries
  @@index([createdAt])
  @@index([customerId])
  @@index([propertyId])
}

model properties {
  // ... existing fields
  
  @@index([city, status])
  @@index([createdAt])
  @@index([price])
}
```

**D. Implement Query Caching:**
```typescript
// utils/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600 // 1 hour default
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Usage
router.get('/cities', asyncHandler(async (req, res) => {
  const cities = await getCachedData(
    'cities:all',
    () => storage.getAllCities(),
    86400 // 24 hours for static data
  );
  res.json(cities);
}));
```

---

### 9. Excessive Console Logging
**Location:** 528 console.log/error/warn statements across 76 files

**Issue:** Console logging is not structured, cannot be filtered in production, and doesn't integrate with logging infrastructure.

**Recommended Fix:**
Implement structured logging with Pino:

```typescript
// logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Usage examples
logger.info({ userId, action: 'login' }, 'User logged in');
logger.error({ error, path }, 'Request failed');
logger.warn({ queryTime: 1500 }, 'Slow query detected');
logger.debug({ query }, 'Database query executed');
```

**Replace all console.* statements:**
```typescript
// Before
console.log('User logged in', userId);
console.error('Error:', error);

// After
logger.info({ userId }, 'User logged in');
logger.error({ error }, 'Error occurred');
```

**Install:**
```bash
npm install pino pino-pretty
```

---

### 10. No Test Coverage
**Location:** Only 3 test files found, mostly `it.todo()`

**Issue:** Critical business logic (auth, RBAC, data mutations) is not tested, increasing risk of bugs in production.

**Recommended Fix:**
Set up Vitest for unit/integration tests:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

```typescript
// tests/unit/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, comparePassword } from '../../apps/api/auth';

describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('should verify password correctly', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await comparePassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });
});
```

```typescript
// tests/integration/api/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../apps/api/index';

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'testuser',
        password: 'TestPassword123!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'testuser',
        password: 'WrongPassword',
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });

  it('should rate limit after 5 attempts', async () => {
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'testuser',
          password: 'WrongPassword',
        });
    }

    // 6th attempt should be rate limited
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'testuser',
        password: 'WrongPassword',
      });

    expect(response.status).toBe(429);
  });
});
```

**Package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "supertest": "^6.3.0"
  }
}
```

---

### 11. ESLint Not Configured for TypeScript
**Location:** `eslint.config.js`

**Issue:** ESLint only configured for JavaScript files, TypeScript files are ignored.

**Recommended Fix:**
```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.config.js',
      '**/*.config.ts',
      'build/**',
      '.next/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'react/prop-types': 'off', // TypeScript handles this
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Allow console.error/warn
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  }
);
```

**Install:**
```bash
npm install --save-dev \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  typescript-eslint
```

---

### 12. No Caching Strategy
**Location:** Throughout API routes

**Issue:** No caching for frequently accessed data (cities, regions, property types), causing unnecessary database load.

**Recommended Fix:**
Implement Redis caching for static/rarely-changing data:

```typescript
// lib/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

export class CacheService {
  static async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600 // 1 hour default
  ): Promise<T> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn({ error, key }, 'Cache read failed, falling back to source');
    }

    const data = await fetchFn();
    
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.warn({ error, key }, 'Cache write failed, continuing without cache');
    }
    
    return data;
  }

  static async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  static async clear(): Promise<void> {
    await redis.flushdb();
  }
}
```

**Usage:**
```typescript
// routes/locations.ts
router.get('/cities', asyncHandler(async (req, res) => {
  const cities = await CacheService.get(
    'cities:all',
    () => storage.getAllCities(),
    86400 // 24 hours - static data
  );
  res.json(cities);
}));

// routes/properties.ts
router.get('/property-types', asyncHandler(async (req, res) => {
  const types = await CacheService.get(
    'property-types:all',
    () => storage.getAllPropertyTypes(),
    86400 // 24 hours
  );
  res.json(types);
}));

// Invalidate cache when data changes
router.post('/properties', asyncHandler(async (req, res) => {
  const property = await storage.createProperty(req.body);
  await CacheService.invalidate('properties:*'); // Invalidate all property caches
  res.status(201).json(property);
}));
```

**Install:**
```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

---

### 13. Missing Input Validation
**Location:** Throughout API routes

**Issue:** Validation is done per-route with Zod schemas, but inconsistent. Some routes don't validate input properly.

**Recommended Fix:**
Create reusable validation middleware:

```typescript
// middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../errors/AppError';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid input data', error.errors);
      }
      throw error;
    }
  };
};
```

**Usage:**
```typescript
// schemas/lead.schema.ts
import { z } from 'zod';

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required').optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  leadSource: z.string().optional(),
  interestType: z.string().optional(),
  city: z.string().optional(),
  budgetRange: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional(),
});

// routes/leads.ts
import { validate } from '../middleware/validate';
import { createLeadSchema } from '../schemas/lead.schema';

router.post('/', requireAnyPerm(['requests:manage:all']), validate(createLeadSchema), asyncHandler(async (req, res) => {
  const lead = await storage.createLead(req.body);
  res.status(201).json(lead);
}));
```

---

## ?? MEDIUM PRIORITY ISSUES

### 14. Environment Variable Validation
**Location:** `apps/api/config/env.ts`

**Issue:** Only validates a few environment variables. Others are accessed directly from `process.env` without validation.

**Recommended Fix:**
Use Zod for comprehensive validation:

```typescript
// config/env.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  CORS_ORIGINS: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  COOKIE_DOMAIN: z.string().optional(),
  ALLOW_PRODUCTION: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// config/env.ts
import { envSchema, type Env } from './env.schema';

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('? Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();

// Export individual getters for compatibility
export const JWT_SECRET = () => env.JWT_SECRET;
export const SESSION_SECRET = () => env.SESSION_SECRET;
export const DATABASE_URL = () => env.DATABASE_URL;
export const BACKEND_PORT = () => env.PORT;
```

---

### 15. Dockerfile User Naming
**Location:** `Dockerfile`

**Issue:** Uses `nextjs` user name (copied from Next.js template), but this is an Express application.

**Recommended Fix:**
```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user with correct name
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built application
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=appuser:nodejs /app/package-lock.json ./package-lock.json

# Set correct permissions
USER appuser

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
```

---

### 16. Missing Health Check Endpoint
**Location:** `apps/api/index.ts`

**Issue:** No health check endpoint for monitoring and orchestration (Docker, Kubernetes, Cloud Run).

**Recommended Fix:**
```typescript
// routes/health.ts
import { Router } from 'express';
import { prisma } from '../prismaClient';
import { CacheService } from '../lib/cache';

const router = Router();

router.get('/', async (req, res) => {
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() };
  } catch (error) {
    checks.database = { status: 'error', error: (error as Error).message };
  }

  try {
    // Check Redis connection if configured
    if (process.env.REDIS_URL) {
      await CacheService.get('health:check', async () => 'ok', 10);
      checks.redis = { status: 'ok' };
    } else {
      checks.redis = { status: 'not_configured' };
    }
  } catch (error) {
    checks.redis = { status: 'error', error: (error as Error).message };
  }

  const healthy = checks.database?.status === 'ok';
  res.status(healthy ? 200 : 503).json(checks);
});
```

**Register route:**
```typescript
// apps/api/index.ts
import healthRoutes from './routes/health';

app.use('/health', healthRoutes);
```

---

### 17. No Graceful Shutdown
**Location:** `apps/api/index.ts`

**Issue:** Application doesn't handle shutdown signals, potentially losing in-flight requests and not closing database connections.

**Recommended Fix:**
```typescript
// apps/api/index.ts
import { prisma } from './prismaClient';
import { logger } from './logger';

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, closing server gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connection
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error({ error }, 'Error closing database connection');
  }

  // Close Redis connection if used
  if (redis) {
    try {
      await redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error({ error }, 'Error closing Redis connection');
    }
  }

  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  gracefulShutdown('unhandledRejection');
});
```

---

### 18. Missing Bundle Size Optimization
**Location:** `apps/web/src/`

**Issue:** No route-level code splitting implemented, causing large initial bundle size.

**Recommended Fix:**
```typescript
// apps/web/src/App.tsx
import { lazy, Suspense } from 'react';
import { Route } from 'wouter';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load routes
const Dashboard = lazy(() => import('./pages/dashboard'));
const Leads = lazy(() => import('./pages/leads'));
const Properties = lazy(() => import('./pages/properties'));
const Reports = lazy(() => import('./pages/reports'));
const Settings = lazy(() => import('./pages/settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/leads" component={Leads} />
      <Route path="/properties" component={Properties} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
    </Suspense>
  );
}
```

**Analyze bundle:**
```json
{
  "scripts": {
    "build:analyze": "ANALYZE_BUNDLE=true npm run build"
  }
}
```

---

### 19. Inconsistent Styling Patterns
**Location:** `apps/web/src/` components

**Issue:** Mixed inline styles and Tailwind classes. Some components don't follow design system patterns.

**Recommended Fix:**
Follow existing UX recommendations:

1. **Use shared Tailwind primitives:**
```typescript
// Use design system utilities
import { surfaceCard, sectionShell } from '@/lib/design-system';

// Good
<div className={surfaceCard}>
  <div className={sectionShell}>
    {/* content */}
  </div>
</div>

// Bad
<div style={{ padding: '16px', borderRadius: '8px' }}>
  {/* content */}
</div>
```

2. **Replace inline styles:**
```typescript
// Before
<div style={{ padding: '1rem', margin: '0.5rem' }}>

// After
<div className="p-4 m-2">
```

3. **Use CSS variables for dynamic values:**
```typescript
// Before
<div style={{ width: `${percentage}%` }}>

// After
<div style={{ '--meter-fill': `${percentage}%` } as React.CSSProperties}
     className="meter">
```

---

### 20. No CI/CD Pipeline
**Location:** Missing `.github/workflows/`

**Issue:** No automated testing, linting, or deployment pipeline.

**Recommended Fix:**
Create GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --audit-level=moderate
```

---

## ?? LOW PRIORITY ISSUES

### 21. Missing API Documentation
**Issue:** No OpenAPI/Swagger specification for API endpoints.

**Recommended Fix:**
```typescript
// Use tsoa or swagger-jsdoc
// Example with swagger-jsdoc:

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 format: password
 *                 example: TestPassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
```

---

### 22. TODOs in Code
**Location:** Multiple files, especially `apps/api/routes.ts:452`

**Issue:** Several TODOs present in code without corresponding GitHub issues.

**Recommended Fix:**
1. Create GitHub issues for each TODO
2. Reference issues in code: `// TODO(#123): Implement CSV processing`
3. Remove TODOs when completed

---

### 23. Missing Pre-commit Hooks
**Issue:** No automated code quality checks before commits.

**Recommended Fix:**
```json
{
  "scripts": {
    "prepare": "husky install",
    "lint-staged": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
npm install --save-dev husky lint-staged prettier
npx husky install
npx husky add .husky/pre-commit "npm run lint-staged"
```

---

## Summary

**Critical Issues:** 5 (must fix before production)  
**High Priority Issues:** 8 (should fix soon)  
**Medium Priority Issues:** 10 (improve over time)  
**Low Priority Issues:** 3 (nice to have)

**Total Issues Found:** 26

All issues include specific code examples and recommended fixes. Prioritize critical security issues (#1-5) immediately before any production deployment.
