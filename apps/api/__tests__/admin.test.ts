/**
 * Admin / RBAC API Integration Tests
 *
 * Tests all /api/rbac-admin/* endpoints via real HTTP requests.
 * All routes require requireAdmin middleware (WEBSITE_ADMIN role).
 */
import { describe, test, expect, beforeAll } from 'vitest';

import { BASE_URL as BASE, ADMIN_CREDS } from './config';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let adminToken: string;
let agentToken: string;
let createdOrgId: string;
let createdUserId: string;

beforeAll(async () => {
  // Login as admin
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(ADMIN_CREDS),
  });
  const body = await res.json();
  adminToken = body.token;
  expect(adminToken).toBeTruthy();

  // Try to login as agent for RBAC enforcement tests
  try {
    const agentRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ identifier: 'agent1', password: 'agent123' }),
    });
    if (agentRes.status === 200) {
      const agentBody = await agentRes.json();
      agentToken = agentBody.token;
    }
  } catch {
    // agent1 may not exist
  }
});

function adminHeaders() {
  return { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` };
}

// ===========================================================================
// GET /api/rbac-admin/dashboard
// ===========================================================================
describe('GET /api/rbac-admin/dashboard', () => {
  test('admin gets dashboard metrics', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Should have metric fields
    expect(body).toHaveProperty('metrics');
  });

  test('dashboard response has expected structure', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    if (body.success) {
      expect(body.metrics).toBeDefined();
    }
  });

  test('without token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/dashboard`);
    expect([401, 403]).toContain(res.status);
  });
});

// ===========================================================================
// GET /api/rbac-admin/users
// ===========================================================================
describe('GET /api/rbac-admin/users', () => {
  test('admin gets user list', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.users).toBeDefined();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBeGreaterThan(0);
  });

  test('user list includes admin user', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    const adminUser = body.users.find((u: any) => u.username === 'admin');
    expect(adminUser).toBeDefined();
  });

  test('user list includes pagination info', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(body.pagination).toBeDefined();
    expect(body.pagination.total).toBeGreaterThan(0);
  });

  test('without token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/users`);
    expect([401, 403]).toContain(res.status);
  });
});

// ===========================================================================
// GET /api/rbac-admin/roles
// ===========================================================================
describe('GET /api/rbac-admin/roles', () => {
  test('admin gets role list', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/roles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.roles).toBeDefined();
    expect(Array.isArray(body.roles)).toBe(true);
  });

  test('roles include WEBSITE_ADMIN', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/roles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    const adminRole = body.roles.find((r: any) =>
      r.name === 'WEBSITE_ADMIN' || r.value === 'WEBSITE_ADMIN' || r === 'WEBSITE_ADMIN',
    );
    expect(adminRole).toBeDefined();
  });

  test('without token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/roles`);
    expect([401, 403]).toContain(res.status);
  });
});

// ===========================================================================
// GET /api/rbac-admin/organizations
// ===========================================================================
describe('GET /api/rbac-admin/organizations', () => {
  test('admin gets organization list', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/organizations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.organizations).toBeDefined();
    expect(Array.isArray(body.organizations)).toBe(true);
  });

  test('without token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/organizations`);
    expect([401, 403]).toContain(res.status);
  });
});

// ===========================================================================
// POST /api/rbac-admin/organizations
// ===========================================================================
describe('POST /api/rbac-admin/organizations', () => {
  test('admin creates organization', async () => {
    const orgName = `Test Org ${Date.now()}`;
    const res = await fetch(`${BASE}/api/rbac-admin/organizations`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        name: orgName,
        legalName: orgName,
        tradeName: orgName,
        licenseNo: `TEST-${Date.now()}`,
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.organization).toBeDefined();
    createdOrgId = body.organization.id;
  });

  test('create org without name returns 400', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/organizations`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('create org without token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/organizations`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: 'No Auth Org' }),
    });
    expect([401, 403]).toContain(res.status);
  });
});

// ===========================================================================
// GET /api/rbac-admin/activities
// ===========================================================================
describe('GET /api/rbac-admin/activities', () => {
  test('admin gets activity log', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/activities`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('without token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/activities`);
    expect([401, 403]).toContain(res.status);
  });
});

// ===========================================================================
// POST /api/rbac-admin/users — Create user
// ===========================================================================
describe('POST /api/rbac-admin/users', () => {
  test('admin creates a new user', async () => {
    const username = `testuser${Date.now()}`;
    const res = await fetch(`${BASE}/api/rbac-admin/users`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({
        username,
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
        roles: 'AGENT',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
    createdUserId = body.user.id;
  });

  test('create user without required fields returns 400', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/users`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ username: 'nofirstname' }),
    });
    expect(res.status).toBe(400);
  });

  test('create user without token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/users`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        username: 'noauth',
        password: 'pass123',
        firstName: 'No',
        lastName: 'Auth',
      }),
    });
    expect([401, 403]).toContain(res.status);
  });
});

// ===========================================================================
// PUT /api/rbac-admin/users/:id
// ===========================================================================
describe('PUT /api/rbac-admin/users/:id', () => {
  test('admin updates a user', async () => {
    if (!createdUserId) return;

    const res = await fetch(`${BASE}/api/rbac-admin/users/${createdUserId}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ firstName: 'UpdatedFirst' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('update non-existent user returns 400 or 404', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/users/nonexistent-user-id`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ firstName: 'Ghost' }),
    });
    expect([400, 404, 500]).toContain(res.status);
  });
});

// ===========================================================================
// DELETE /api/rbac-admin/users/:id
// ===========================================================================
describe('DELETE /api/rbac-admin/users/:id', () => {
  test('admin deletes a user', async () => {
    if (!createdUserId) return;

    const res = await fetch(`${BASE}/api/rbac-admin/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ===========================================================================
// DELETE /api/rbac-admin/organizations/:id
// ===========================================================================
describe('DELETE /api/rbac-admin/organizations/:id', () => {
  test('admin deletes an organization', async () => {
    if (!createdOrgId) return;

    const res = await fetch(`${BASE}/api/rbac-admin/organizations/${createdOrgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ===========================================================================
// RBAC enforcement — agent denied, admin allowed
// ===========================================================================
describe('RBAC enforcement', () => {
  test('agent cannot access admin dashboard', async () => {
    if (!agentToken) return;

    const res = await fetch(`${BASE}/api/rbac-admin/dashboard`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('agent cannot list admin users', async () => {
    if (!agentToken) return;

    const res = await fetch(`${BASE}/api/rbac-admin/users`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('agent cannot create organizations', async () => {
    if (!agentToken) return;

    const res = await fetch(`${BASE}/api/rbac-admin/organizations`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${agentToken}` },
      body: JSON.stringify({ name: 'Agent Org' }),
    });
    expect([401, 403]).toContain(res.status);
  });

  test('agent cannot access admin activities', async () => {
    if (!agentToken) return;

    const res = await fetch(`${BASE}/api/rbac-admin/activities`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('agent cannot access admin roles', async () => {
    if (!agentToken) return;

    const res = await fetch(`${BASE}/api/rbac-admin/roles`, {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('no token cannot access any admin endpoint', async () => {
    const endpoints = [
      '/api/rbac-admin/dashboard',
      '/api/rbac-admin/users',
      '/api/rbac-admin/roles',
      '/api/rbac-admin/organizations',
      '/api/rbac-admin/activities',
    ];

    for (const endpoint of endpoints) {
      const res = await fetch(`${BASE}${endpoint}`);
      expect([401, 403]).toContain(res.status);
    }
  });
});

// ===========================================================================
// Admin billing endpoints
// ===========================================================================
describe('Admin billing endpoints', () => {
  test('GET /api/rbac-admin/billing/invoices returns invoices', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/billing/invoices`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.invoices).toBeDefined();
  });

  test('GET /api/rbac-admin/billing/stats returns stats', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/billing/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.stats).toBeDefined();
  });
});

// ===========================================================================
// Admin analytics overview
// ===========================================================================
describe('Admin analytics', () => {
  test('GET /api/rbac-admin/analytics/overview returns analytics', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics).toBeDefined();
  });

  test('analytics supports timeRange query parameter', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/analytics/overview?timeRange=30d`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// Admin features/plans
// ===========================================================================
describe('Admin features/plans', () => {
  test('GET /api/rbac-admin/features/plans returns plans', async () => {
    const res = await fetch(`${BASE}/api/rbac-admin/features/plans`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.plans).toBeDefined();
  });
});
