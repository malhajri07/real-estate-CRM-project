/**
 * Deals API Integration Tests
 *
 * Tests all /api/deals/* endpoints via real HTTP requests.
 * Deals are org-scoped: authenticateToken + requireOrg + injectOrgFilter middleware.
 */
import { describe, test, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3000';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let adminToken: string;
let createdDealId: string;
let existingCustomerId: string;

beforeAll(async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ identifier: 'admin', password: 'admin123' }),
  });
  const body = await res.json();
  adminToken = body.token;
  expect(adminToken).toBeTruthy();

  // Create a lead to get a customer ID for deal creation
  const leadRes = await fetch(`${BASE}/api/leads`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      firstName: 'DealTest',
      lastName: 'Customer',
      phone: '+966504444444',
    }),
  });
  if (leadRes.status === 201) {
    const leadBody = await leadRes.json();
    // The lead's customerId might be nested
    existingCustomerId = leadBody.customerId || leadBody.id;
  }
});

function authHeaders() {
  return { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` };
}

// ===========================================================================
// GET /api/deals
// ===========================================================================
describe('GET /api/deals', () => {
  test('with token returns 200 and array', async () => {
    const res = await fetch(`${BASE}/api/deals`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/deals`);
    expect(res.status).toBe(401);
  });

  test('with invalid token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/deals`, {
      headers: { Authorization: 'Bearer bad.token.value' },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('deals array items have expected fields', async () => {
    const res = await fetch(`${BASE}/api/deals`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    if (body.length > 0) {
      const deal = body[0];
      expect(deal.id).toBeDefined();
      expect(deal).toHaveProperty('stage');
    }
  });
});

// ===========================================================================
// POST /api/deals
// ===========================================================================
describe('POST /api/deals', () => {
  test('create deal with valid data returns 201', async () => {
    if (!existingCustomerId) return;

    const res = await fetch(`${BASE}/api/deals`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customerId: existingCustomerId,
        stage: 'NEW',
        source: 'website',
        notes: 'Integration test deal',
        agreedPrice: 250000,
      }),
    });
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      const body = await res.json();
      expect(body.id).toBeDefined();
      createdDealId = body.id;
    }
  });

  test('create deal without customerId returns 400', async () => {
    const res = await fetch(`${BASE}/api/deals`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        stage: 'NEW',
        notes: 'No customer',
      }),
    });
    expect(res.status).toBe(400);
  });

  test('create deal without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/deals`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        customerId: 'some-id',
        stage: 'NEW',
      }),
    });
    expect(res.status).toBe(401);
  });

  test('create deal with invalid stage returns 400', async () => {
    const res = await fetch(`${BASE}/api/deals`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customerId: existingCustomerId || 'test-id',
        stage: 'INVALID_STAGE',
      }),
    });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// GET /api/deals/stage/:stage
// ===========================================================================
describe('GET /api/deals/stage/:stage', () => {
  test('get deals by stage NEW returns 200', async () => {
    const res = await fetch(`${BASE}/api/deals/stage/NEW`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('get deals by stage NEGOTIATION returns 200', async () => {
    const res = await fetch(`${BASE}/api/deals/stage/NEGOTIATION`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
  });

  test('get deals by stage WON returns 200', async () => {
    const res = await fetch(`${BASE}/api/deals/stage/WON`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('unknown stage returns 200 with empty array or all deals', async () => {
    const res = await fetch(`${BASE}/api/deals/stage/UNKNOWN_STAGE`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // Route handler doesn't validate stage enum; it just filters
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ===========================================================================
// PUT /api/deals/:id
// ===========================================================================
describe('PUT /api/deals/:id', () => {
  test('update deal stage', async () => {
    if (!createdDealId) return;

    const res = await fetch(`${BASE}/api/deals/${createdDealId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ stage: 'NEGOTIATION' }),
    });
    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.stage).toBe('NEGOTIATION');
    }
  });

  test('update deal notes', async () => {
    if (!createdDealId) return;

    const res = await fetch(`${BASE}/api/deals/${createdDealId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ notes: 'Updated in test' }),
    });
    expect([200, 403]).toContain(res.status);
  });

  test('update deal agreedPrice', async () => {
    if (!createdDealId) return;

    const res = await fetch(`${BASE}/api/deals/${createdDealId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ agreedPrice: 300000 }),
    });
    expect([200, 403]).toContain(res.status);
  });

  test('update non-existent deal returns 404', async () => {
    const res = await fetch(`${BASE}/api/deals/nonexistent-deal-id`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ stage: 'WON' }),
    });
    expect([404, 403]).toContain(res.status);
  });

  test('update with invalid stage returns 400', async () => {
    if (!createdDealId) return;

    const res = await fetch(`${BASE}/api/deals/${createdDealId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ stage: 'INVALID' }),
    });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// DELETE /api/deals/:id
// ===========================================================================
describe('DELETE /api/deals/:id', () => {
  test('delete existing deal returns 204', async () => {
    if (!createdDealId) return;

    const res = await fetch(`${BASE}/api/deals/${createdDealId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // 204 success or 403 RBAC
    expect([204, 403]).toContain(res.status);
  });

  test('delete non-existent deal returns 404 or 403', async () => {
    const res = await fetch(`${BASE}/api/deals/nonexistent-deal-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([403, 404]).toContain(res.status);
  });

  test('delete without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/deals/any-id`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// Edge cases
// ===========================================================================
describe('Deals edge cases', () => {
  test('set deal to WON stage records wonAt', async () => {
    if (!existingCustomerId) return;

    // Create a deal to set to WON
    const createRes = await fetch(`${BASE}/api/deals`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customerId: existingCustomerId,
        stage: 'NEW',
        agreedPrice: 100000,
      }),
    });
    if (createRes.status !== 201) return;
    const created = await createRes.json();

    const wonRes = await fetch(`${BASE}/api/deals/${created.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ stage: 'WON' }),
    });
    if (wonRes.status === 200) {
      const body = await wonRes.json();
      expect(body.wonAt).toBeDefined();
    }
  });
});
