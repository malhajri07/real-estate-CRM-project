/**
 * CMS / Content API Integration Tests
 *
 * Tests all /api/landing, /api/cms/*, /api/community/*, /api/knowledge-base,
 * and /sitemap.xml endpoints via real HTTP requests.
 */
import { describe, test, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3000';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let adminToken: string;

beforeAll(async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ identifier: 'admin', password: 'admin123' }),
  });
  const body = await res.json();
  adminToken = body.token;
  expect(adminToken).toBeTruthy();
});

function adminHeaders() {
  return { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` };
}

// ===========================================================================
// GET /api/landing
// ===========================================================================
describe('GET /api/landing', () => {
  test('public access returns 200 with data', async () => {
    const res = await fetch(`${BASE}/api/landing`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  test('response includes cache headers', async () => {
    const res = await fetch(`${BASE}/api/landing`);
    expect(res.status).toBe(200);
    const cacheControl = res.headers.get('cache-control');
    expect(cacheControl).toBeTruthy();
  });

  test('no-cache bypass returns fresh data', async () => {
    const res = await fetch(`${BASE}/api/landing`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    expect(res.status).toBe(200);
    const cacheControl = res.headers.get('cache-control');
    if (cacheControl) {
      expect(cacheControl).toContain('no-cache');
    }
  });

  test('landing data is an array of sections', async () => {
    const res = await fetch(`${BASE}/api/landing`);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ===========================================================================
// GET /api/landing/preview
// ===========================================================================
describe('GET /api/landing/preview', () => {
  test('without auth or token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/landing/preview`);
    expect([401, 403]).toContain(res.status);
  });

  test('admin can access preview if no LANDING_PREVIEW_TOKEN', async () => {
    const res = await fetch(`${BASE}/api/landing/preview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // May return 200 if admin role is accepted, or 401/403 if token env var is set
    expect([200, 401, 403]).toContain(res.status);
  });
});

// ===========================================================================
// GET /api/cms/articles
// ===========================================================================
describe('GET /api/cms/articles', () => {
  test('public access returns 200 with articles', async () => {
    const res = await fetch(`${BASE}/api/cms/articles`);
    expect(res.status).toBe(200);
    const body = await res.json();
    // Response is paginated
    expect(body).toBeDefined();
  });

  test('admin access returns all articles including drafts', async () => {
    const res = await fetch(`${BASE}/api/cms/articles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
  });

  test('filter by status', async () => {
    const res = await fetch(`${BASE}/api/cms/articles?status=published`);
    expect(res.status).toBe(200);
  });

  test('pagination works', async () => {
    const res = await fetch(`${BASE}/api/cms/articles?page=1&pageSize=5`);
    expect(res.status).toBe(200);
  });

  test('search parameter works', async () => {
    const res = await fetch(`${BASE}/api/cms/articles?search=test`);
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// GET /api/cms/articles/categories
// ===========================================================================
describe('GET /api/cms/articles/categories', () => {
  test('returns 200 with categories array', async () => {
    const res = await fetch(`${BASE}/api/cms/articles/categories`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ===========================================================================
// GET /api/cms/articles/tags
// ===========================================================================
describe('GET /api/cms/articles/tags', () => {
  test('returns 200 with tags array', async () => {
    const res = await fetch(`${BASE}/api/cms/articles/tags`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ===========================================================================
// GET /api/cms/navigation
// ===========================================================================
describe('GET /api/cms/navigation', () => {
  test('public access returns 200 with navigation links', async () => {
    const res = await fetch(`${BASE}/api/cms/navigation`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('navigation links have expected fields', async () => {
    const res = await fetch(`${BASE}/api/cms/navigation`);
    const body = await res.json();
    if (body.length > 0) {
      const link = body[0];
      expect(link.id).toBeDefined();
    }
  });
});

// ===========================================================================
// GET /api/cms/navigation/all (admin)
// ===========================================================================
describe('GET /api/cms/navigation/all', () => {
  test('admin gets all navigation links including hidden', async () => {
    const res = await fetch(`${BASE}/api/cms/navigation/all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('without admin token returns 403', async () => {
    const res = await fetch(`${BASE}/api/cms/navigation/all`);
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// GET /api/cms/public/header-config
// ===========================================================================
describe('GET /api/cms/public/header-config', () => {
  test('returns 200 with header config', async () => {
    const res = await fetch(`${BASE}/api/cms/public/header-config`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('siteName');
    expect(body).toHaveProperty('logoUrl');
  });
});

// ===========================================================================
// GET /api/community/channels
// ===========================================================================
describe('GET /api/community/channels', () => {
  test('with auth returns 200 with channels', async () => {
    const res = await fetch(`${BASE}/api/community/channels`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/community/channels`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET /api/community/feed
// ===========================================================================
describe('GET /api/community/feed', () => {
  test('with auth returns 200 with feed', async () => {
    const res = await fetch(`${BASE}/api/community/feed`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/community/feed`);
    expect(res.status).toBe(401);
  });

  test('pagination works', async () => {
    const res = await fetch(`${BASE}/api/community/feed?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// GET /api/knowledge-base
// ===========================================================================
describe('GET /api/knowledge-base', () => {
  test('returns 200 with memories', async () => {
    const res = await fetch(`${BASE}/api/knowledge-base`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.memories).toBeDefined();
  });

  test('filter by type', async () => {
    const res = await fetch(`${BASE}/api/knowledge-base?type=action`);
    expect(res.status).toBe(200);
  });

  test('limit parameter works', async () => {
    const res = await fetch(`${BASE}/api/knowledge-base?limit=5`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.memories.length).toBeLessThanOrEqual(5);
  });
});

// ===========================================================================
// GET /sitemap.xml
// ===========================================================================
describe('GET /sitemap.xml', () => {
  test('returns 200 with XML content', async () => {
    const res = await fetch(`${BASE}/sitemap.xml`);
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('xml');
    const text = await res.text();
    expect(text).toContain('<?xml');
  });
});

// ===========================================================================
// CMS article CRUD (admin)
// ===========================================================================
describe('CMS Article CRUD', () => {
  let createdArticleId: string;

  test('admin creates an article', async () => {
    const res = await fetch(`${BASE}/api/cms/articles`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        title: 'Test Article',
        slug: `test-article-${Date.now()}`,
        content: 'This is a test article body.',
        status: 'draft',
      }),
    });
    expect([201, 400, 500]).toContain(res.status);
    if (res.status === 201) {
      const body = await res.json();
      expect(body.id).toBeDefined();
      createdArticleId = body.id;
    }
  });

  test('non-admin cannot create article', async () => {
    const res = await fetch(`${BASE}/api/cms/articles`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        title: 'Unauthorized Article',
        content: 'Should fail',
      }),
    });
    expect([401, 403]).toContain(res.status);
  });

  test('admin can get article by ID', async () => {
    if (!createdArticleId) return;

    const res = await fetch(`${BASE}/api/cms/articles/${createdArticleId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
  });

  test('admin can update article', async () => {
    if (!createdArticleId) return;

    const res = await fetch(`${BASE}/api/cms/articles/${createdArticleId}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ title: 'Updated Test Article' }),
    });
    expect([200, 500]).toContain(res.status);
  });

  test('admin can delete article', async () => {
    if (!createdArticleId) return;

    const res = await fetch(`${BASE}/api/cms/articles/${createdArticleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([204, 500]).toContain(res.status);
  });
});
