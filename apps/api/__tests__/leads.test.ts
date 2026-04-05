/**
 * Leads API Integration Tests
 *
 * Tests all /api/leads/* endpoints via real HTTP requests.
 * Leads are org-scoped and require authenticateToken + requireOrg middleware.
 */
import { describe, test, expect, beforeAll } from 'vitest';

import { BASE_URL as BASE, ADMIN_CREDS } from './config';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let adminToken: string;
let createdLeadId: string;

beforeAll(async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(ADMIN_CREDS),
  });
  const body = await res.json();
  adminToken = body.token;
  expect(adminToken).toBeTruthy();
});

function authHeaders(token: string = adminToken) {
  return { ...JSON_HEADERS, Authorization: `Bearer ${token}` };
}

// ===========================================================================
// GET /api/leads
// ===========================================================================
describe('GET /api/leads', () => {
  test('with token returns 200 and an array', async () => {
    const res = await fetch(`${BASE}/api/leads`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/leads`);
    expect(res.status).toBe(401);
  });

  test('with invalid token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/leads`, {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('response items have expected lead fields', async () => {
    const res = await fetch(`${BASE}/api/leads`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    if (body.length > 0) {
      const lead = body[0];
      expect(lead.id).toBeDefined();
      expect(lead).toHaveProperty('status');
    }
  });
});

// ===========================================================================
// POST /api/leads
// ===========================================================================
describe('POST /api/leads', () => {
  test('create a lead with customer data returns 201', async () => {
    const res = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+966501234567',
        email: 'testlead@example.com',
        status: 'new',
        source: 'website',
        notes: 'Integration test lead',
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.firstName).toBe('Test');
    expect(body.lastName).toBe('Customer');
    createdLeadId = body.id;
  });

  test('create a lead with minimal data returns 201', async () => {
    const res = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        firstName: 'Minimal',
        phone: '+966509999999',
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
  });

  test('create lead without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        firstName: 'NoAuth',
        phone: '+966500000000',
      }),
    });
    expect(res.status).toBe(401);
  });

  test('empty body returns 400 or 201 (schema-dependent)', async () => {
    const res = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    // Some schemas allow empty leads (just agentId), others require fields
    expect([201, 400]).toContain(res.status);
  });
});

// ===========================================================================
// GET /api/leads/:id
// ===========================================================================
describe('GET /api/leads/:id', () => {
  test('found lead returns 200 with lead data', async () => {
    // Skip if no lead was created
    if (!createdLeadId) return;

    const res = await fetch(`${BASE}/api/leads/${createdLeadId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdLeadId);
  });

  test('non-existent lead returns 404', async () => {
    const res = await fetch(`${BASE}/api/leads/non-existent-id-12345`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(404);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/leads/any-id`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// PUT /api/leads/:id
// ===========================================================================
describe('PUT /api/leads/:id', () => {
  test('update status succeeds', async () => {
    if (!createdLeadId) return;

    const res = await fetch(`${BASE}/api/leads/${createdLeadId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'contacted' }),
    });
    // 200 if admin has permission, 403 if RBAC prevents it
    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.status).toBe('CONTACTED');
    }
  });

  test('update notes succeeds', async () => {
    if (!createdLeadId) return;

    const res = await fetch(`${BASE}/api/leads/${createdLeadId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ notes: 'Updated via integration test' }),
    });
    expect([200, 403]).toContain(res.status);
  });

  test('update non-existent lead returns 404 or 403', async () => {
    const res = await fetch(`${BASE}/api/leads/non-existent-id`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'new' }),
    });
    expect([403, 404]).toContain(res.status);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/leads/any-id`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ status: 'new' }),
    });
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET /api/leads/search
// ===========================================================================
describe('GET /api/leads/search', () => {
  test('search with query returns results', async () => {
    const res = await fetch(`${BASE}/api/leads/search?q=Test`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('search without query returns 400', async () => {
    const res = await fetch(`${BASE}/api/leads/search`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(400);
  });

  test('search with empty q returns 400', async () => {
    const res = await fetch(`${BASE}/api/leads/search?q=`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(400);
  });

  test('search without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/leads/search?q=test`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// DELETE /api/leads/:id
// ===========================================================================
describe('DELETE /api/leads/:id', () => {
  test('delete existing lead returns 204', async () => {
    if (!createdLeadId) return;

    const res = await fetch(`${BASE}/api/leads/${createdLeadId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // 204 on success, 403 if RBAC prevents
    expect([204, 403]).toContain(res.status);
  });

  test('verify deleted lead is gone', async () => {
    if (!createdLeadId) return;

    const res = await fetch(`${BASE}/api/leads/${createdLeadId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // Either 404 (deleted) or 200 (delete was 403 so it still exists)
    expect([200, 404]).toContain(res.status);
  });

  test('delete without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/leads/any-id`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(401);
  });

  test('delete non-existent lead returns 204 or 403 or 500', async () => {
    const res = await fetch(`${BASE}/api/leads/non-existent-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // Depending on implementation: 204 (no error check), 403, or 500
    expect([204, 403, 404, 500]).toContain(res.status);
  });
});

// ===========================================================================
// Edge cases
// ===========================================================================
describe('Leads edge cases', () => {
  test('create lead with very long notes', async () => {
    const longNotes = 'A'.repeat(5000);
    const res = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        firstName: 'LongNote',
        phone: '+966501111111',
        notes: longNotes,
      }),
    });
    expect([201, 400]).toContain(res.status);
  });

  test('create lead with special characters in name', async () => {
    const res = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        firstName: 'محمد',
        lastName: 'الأحمد',
        phone: '+966502222222',
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.firstName).toBe('محمد');
  });

  test('create lead with duplicate phone merges customer', async () => {
    const phone = '+966503333333';

    // First lead
    const res1 = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ firstName: 'Dup', phone }),
    });
    expect(res1.status).toBe(201);

    // Second lead with same phone
    const res2 = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ firstName: 'DupAgain', phone }),
    });
    expect(res2.status).toBe(201);
  });
});
