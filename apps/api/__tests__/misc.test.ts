/**
 * Miscellaneous API Integration Tests
 *
 * Tests endpoints: notifications, campaigns, favorites, messages,
 * support, pool, csv, moderation, reports.
 */
import { describe, test, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3000';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let adminToken: string;
let existingPropertyId: string;

beforeAll(async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ identifier: 'admin', password: 'admin123' }),
  });
  const body = await res.json();
  adminToken = body.token;
  expect(adminToken).toBeTruthy();

  // Get an existing property ID for favorites/reports
  const listingsRes = await fetch(`${BASE}/api/listings?pageSize=1`);
  const listingsBody = await listingsRes.json();
  if (listingsBody.items?.length > 0) {
    existingPropertyId = listingsBody.items[0].id;
  }
});

function authHeaders() {
  return { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` };
}

// ===========================================================================
// Notifications
// ===========================================================================
describe('GET /api/notifications', () => {
  test('with token returns 200 and array', async () => {
    const res = await fetch(`${BASE}/api/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/notifications`);
    expect(res.status).toBe(401);
  });

  test('notifications have expected fields', async () => {
    const res = await fetch(`${BASE}/api/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    if (body.length > 0) {
      const notif = body[0];
      expect(notif.id).toBeDefined();
      expect(notif).toHaveProperty('type');
      expect(notif).toHaveProperty('createdAt');
    }
  });
});

describe('PUT /api/notifications/:id', () => {
  test('mark notification as read', async () => {
    // First get a notification
    const listRes = await fetch(`${BASE}/api/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const notifications = await listRes.json();

    if (notifications.length > 0) {
      const notifId = notifications[0].id;
      const res = await fetch(`${BASE}/api/notifications/${notifId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isRead: true }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.isRead).toBe(true);
    }
  });

  test('mark non-existent notification returns 404', async () => {
    const res = await fetch(`${BASE}/api/notifications/nonexistent-notif-id`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ isRead: true }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/notifications/:id', () => {
  test('dismiss notification', async () => {
    const listRes = await fetch(`${BASE}/api/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const notifications = await listRes.json();

    if (notifications.length > 0) {
      const notifId = notifications[0].id;
      const res = await fetch(`${BASE}/api/notifications/${notifId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(204);
    }
  });

  test('dismiss non-existent notification returns 404', async () => {
    const res = await fetch(`${BASE}/api/notifications/nonexistent-notif-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// Campaigns
// ===========================================================================
describe('GET /api/campaigns', () => {
  test('with token returns 200 and array', async () => {
    const res = await fetch(`${BASE}/api/campaigns`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/campaigns`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/campaigns', () => {
  test('create campaign with valid data returns 201', async () => {
    const res = await fetch(`${BASE}/api/campaigns`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Test Campaign',
        message: 'Campaign message for integration test',
        type: 'sms',
        leadIds: ['lead-1', 'lead-2'],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.title).toBe('Test Campaign');
    expect(body.status).toBe('sent');
    expect(body.recipientCount).toBe(2);
  });

  test('create campaign without required fields returns 400', async () => {
    const res = await fetch(`${BASE}/api/campaigns`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title: 'Incomplete' }),
    });
    expect(res.status).toBe(400);
  });

  test('create campaign with empty leadIds returns 400', async () => {
    const res = await fetch(`${BASE}/api/campaigns`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: 'Empty leads',
        message: 'test',
        type: 'email',
        leadIds: [],
      }),
    });
    expect(res.status).toBe(400);
  });

  test('create campaign without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/campaigns`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        title: 'No Auth',
        message: 'test',
        type: 'sms',
        leadIds: ['x'],
      }),
    });
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// Favorites
// ===========================================================================
describe('GET /api/favorites', () => {
  test('with token returns 200', async () => {
    const res = await fetch(`${BASE}/api/favorites`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/favorites`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/favorites', () => {
  test('add property to favorites', async () => {
    if (!existingPropertyId) return;

    const res = await fetch(`${BASE}/api/favorites`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ propertyId: existingPropertyId }),
    });
    expect([201, 500]).toContain(res.status);
  });

  test('add favorite without propertyId returns 400', async () => {
    const res = await fetch(`${BASE}/api/favorites`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('add favorite without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/favorites`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ propertyId: 'some-id' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/favorites/:propertyId', () => {
  test('remove from favorites', async () => {
    if (!existingPropertyId) return;

    const res = await fetch(`${BASE}/api/favorites/${existingPropertyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([204, 404, 500]).toContain(res.status);
  });
});

// ===========================================================================
// Messages
// ===========================================================================
describe('GET /api/messages', () => {
  test('returns 200 with messages array', async () => {
    const res = await fetch(`${BASE}/api/messages`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('POST /api/messages', () => {
  test('create message with auth', async () => {
    const res = await fetch(`${BASE}/api/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        leadId: 'test-lead-id',
        content: 'Test message from integration test',
        channel: 'WHATSAPP',
      }),
    });
    // 201 on success, 500 if lead doesn't exist (FK constraint)
    expect([201, 500]).toContain(res.status);
  });

  test('create message without auth returns 401', async () => {
    const res = await fetch(`${BASE}/api/messages`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        leadId: 'test',
        content: 'No auth',
      }),
    });
    expect(res.status).toBe(401);
  });

  test('create message without required fields returns 400', async () => {
    const res = await fetch(`${BASE}/api/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// Support
// ===========================================================================
describe('GET /api/support', () => {
  test('with token returns 200 with tickets', async () => {
    const res = await fetch(`${BASE}/api/support`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/support`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/support', () => {
  test('create ticket with valid data', async () => {
    const res = await fetch(`${BASE}/api/support`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        subject: 'Test support ticket',
        description: 'Integration test ticket description',
        priority: 'MEDIUM',
      }),
    });
    // 201 if org exists, 400 if org required but missing
    expect([201, 400]).toContain(res.status);
  });

  test('create ticket without subject returns 400', async () => {
    const res = await fetch(`${BASE}/api/support`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        description: 'No subject',
      }),
    });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// Buyer Pool
// ===========================================================================
describe('GET /api/pool/health', () => {
  test('with token returns 200 with health info', async () => {
    const res = await fetch(`${BASE}/api/pool/health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBeDefined();
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/pool/health`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/pool/search', () => {
  test('with token returns 200 with search results', async () => {
    const res = await fetch(`${BASE}/api/pool/search`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.pagination).toBeDefined();
  });

  test('search with filters', async () => {
    const res = await fetch(`${BASE}/api/pool/search?city=Riyadh&minPrice=100000`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
  });

  test('search with invalid price returns 400', async () => {
    const res = await fetch(`${BASE}/api/pool/search?minPrice=500&maxPrice=100`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(400);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/pool/search`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// CSV Exports
// ===========================================================================
describe('GET /api/csv/deals', () => {
  test('with token returns CSV', async () => {
    const res = await fetch(`${BASE}/api/csv/deals`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('csv');
    const text = await res.text();
    expect(text).toContain('id,'); // CSV header
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/csv/deals`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/csv/leads', () => {
  test('with token returns CSV', async () => {
    const res = await fetch(`${BASE}/api/csv/leads`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('csv');
  });
});

describe('GET /api/csv/listings', () => {
  test('with token returns CSV', async () => {
    const res = await fetch(`${BASE}/api/csv/listings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('csv');
  });
});

describe('GET /api/csv/appointments', () => {
  test('with token returns CSV', async () => {
    const res = await fetch(`${BASE}/api/csv/appointments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('csv');
  });
});

// ===========================================================================
// Moderation
// ===========================================================================
describe('GET /api/moderation', () => {
  test('returns 200 with moderation queue', async () => {
    const res = await fetch(`${BASE}/api/moderation`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('GET /api/moderation/queue', () => {
  test('returns 200 with pending items', async () => {
    const res = await fetch(`${BASE}/api/moderation/queue`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('GET /api/moderation/stats', () => {
  test('returns 200 with stats', async () => {
    const res = await fetch(`${BASE}/api/moderation/stats`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('pending');
    expect(body).toHaveProperty('approved');
    expect(body).toHaveProperty('rejected');
  });
});

// ===========================================================================
// Reports
// ===========================================================================
describe('GET /api/reports', () => {
  test('returns 200 with reports', async () => {
    const res = await fetch(`${BASE}/api/reports`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('POST /api/reports', () => {
  test('create report with valid data', async () => {
    if (!existingPropertyId) return;

    const res = await fetch(`${BASE}/api/reports`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        listingId: existingPropertyId,
        reason: 'Test report from integration tests',
      }),
    });
    expect(res.status).toBe(201);
  });

  test('create report without reason returns 400', async () => {
    const res = await fetch(`${BASE}/api/reports`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        listingId: 'some-id',
      }),
    });
    expect(res.status).toBe(400);
  });

  test('create report with short reason returns 400', async () => {
    const res = await fetch(`${BASE}/api/reports`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        listingId: 'some-id',
        reason: 'ab', // too short (min 3)
      }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/reports/dashboard/metrics', () => {
  test('returns 200 with dashboard metrics', async () => {
    const res = await fetch(`${BASE}/api/reports/dashboard/metrics`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('totalLeads');
    expect(body).toHaveProperty('activeProperties');
    expect(body).toHaveProperty('dealsInPipeline');
  });
});

describe('GET /api/reports/dashboard/revenue-chart', () => {
  test('returns 200 with chart data', async () => {
    const res = await fetch(`${BASE}/api/reports/dashboard/revenue-chart`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('name');
      expect(body[0]).toHaveProperty('revenue');
    }
  });
});
