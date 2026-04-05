/**
 * Billing API Integration Tests
 *
 * Tests all /api/billing/* endpoints via real HTTP requests.
 * All billing routes require authenticateToken middleware.
 */
import { describe, test, expect, beforeAll } from 'vitest';

import { BASE_URL as BASE, ADMIN_CREDS } from './config';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let adminToken: string;

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

function authHeaders() {
  return { Authorization: `Bearer ${adminToken}` };
}

// ===========================================================================
// POST /api/billing/seed — seed billing data first
// ===========================================================================
describe('POST /api/billing/seed', () => {
  test('admin can seed billing data', async () => {
    const res = await fetch(`${BASE}/api/billing/seed`, {
      method: 'POST',
      headers: authHeaders(),
    });
    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
    }
  });

  test('seed without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/billing/seed`, {
      method: 'POST',
    });
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET /api/billing/plans
// ===========================================================================
describe('GET /api/billing/plans', () => {
  test('returns 200 with array of plans', async () => {
    const res = await fetch(`${BASE}/api/billing/plans`, {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('plans have expected fields', async () => {
    const res = await fetch(`${BASE}/api/billing/plans`, {
      headers: authHeaders(),
    });
    const body = await res.json();
    if (body.length > 0) {
      const plan = body[0];
      expect(plan.id).toBeDefined();
      expect(plan.name).toBeDefined();
      expect(plan.price).toBeDefined();
    }
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/billing/plans`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET /api/billing/accounts
// ===========================================================================
describe('GET /api/billing/accounts', () => {
  test('returns 200 with array', async () => {
    const res = await fetch(`${BASE}/api/billing/accounts`, {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('accounts include subscriptions and invoices', async () => {
    const res = await fetch(`${BASE}/api/billing/accounts`, {
      headers: authHeaders(),
    });
    const body = await res.json();
    if (body.length > 0) {
      const account = body[0];
      expect(account.id).toBeDefined();
      expect(account).toHaveProperty('subscriptions');
      expect(account).toHaveProperty('invoices');
    }
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/billing/accounts`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET /api/billing/invoices
// ===========================================================================
describe('GET /api/billing/invoices', () => {
  test('returns 200 with array', async () => {
    const res = await fetch(`${BASE}/api/billing/invoices`, {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('invoices have expected fields', async () => {
    const res = await fetch(`${BASE}/api/billing/invoices`, {
      headers: authHeaders(),
    });
    const body = await res.json();
    if (body.length > 0) {
      const invoice = body[0];
      expect(invoice.id).toBeDefined();
      expect(invoice).toHaveProperty('status');
      expect(invoice).toHaveProperty('amountDue');
    }
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/billing/invoices`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET /api/billing/subscriptions
// ===========================================================================
describe('GET /api/billing/subscriptions', () => {
  test('returns 200 with array', async () => {
    const res = await fetch(`${BASE}/api/billing/subscriptions`, {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('subscriptions include plan info', async () => {
    const res = await fetch(`${BASE}/api/billing/subscriptions`, {
      headers: authHeaders(),
    });
    const body = await res.json();
    if (body.length > 0) {
      const sub = body[0];
      expect(sub.id).toBeDefined();
      expect(sub).toHaveProperty('status');
      expect(sub).toHaveProperty('plan');
    }
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/billing/subscriptions`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET /api/billing/analytics
// ===========================================================================
describe('GET /api/billing/analytics', () => {
  test('returns 200 with analytics data', async () => {
    const res = await fetch(`${BASE}/api/billing/analytics`, {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('totalRevenue');
    expect(body).toHaveProperty('activeSubscriptions');
    expect(typeof body.totalRevenue).toBe('number');
    expect(typeof body.activeSubscriptions).toBe('number');
  });

  test('analytics includes revenue chart data', async () => {
    const res = await fetch(`${BASE}/api/billing/analytics`, {
      headers: authHeaders(),
    });
    const body = await res.json();
    expect(body).toHaveProperty('revenueChartData');
    expect(Array.isArray(body.revenueChartData)).toBe(true);
  });

  test('analytics includes subscription distribution', async () => {
    const res = await fetch(`${BASE}/api/billing/analytics`, {
      headers: authHeaders(),
    });
    const body = await res.json();
    expect(body).toHaveProperty('subscriptionDistribution');
    expect(Array.isArray(body.subscriptionDistribution)).toBe(true);
  });

  test('analytics includes recent transactions', async () => {
    const res = await fetch(`${BASE}/api/billing/analytics`, {
      headers: authHeaders(),
    });
    const body = await res.json();
    expect(body).toHaveProperty('recentTransactions');
    expect(Array.isArray(body.recentTransactions)).toBe(true);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/billing/analytics`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET /api/billing/invoices/:id
// ===========================================================================
describe('GET /api/billing/invoices/:id', () => {
  test('non-existent invoice returns 404', async () => {
    const res = await fetch(`${BASE}/api/billing/invoices/nonexistent-invoice-id`, {
      headers: authHeaders(),
    });
    expect(res.status).toBe(404);
  });

  test('fetching existing invoice by ID', async () => {
    // First get list to find an ID
    const listRes = await fetch(`${BASE}/api/billing/invoices`, {
      headers: authHeaders(),
    });
    const invoices = await listRes.json();
    if (invoices.length > 0) {
      const invoiceId = invoices[0].id;
      const res = await fetch(`${BASE}/api/billing/invoices/${invoiceId}`, {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(invoiceId);
    }
  });
});

// ===========================================================================
// Edge cases
// ===========================================================================
describe('Billing edge cases', () => {
  test('seeding billing data twice does not duplicate', async () => {
    const res1 = await fetch(`${BASE}/api/billing/seed`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const res2 = await fetch(`${BASE}/api/billing/seed`, {
      method: 'POST',
      headers: authHeaders(),
    });

    if (res1.status === 200 && res2.status === 200) {
      // Both should succeed but not create duplicates
      const accountsRes = await fetch(`${BASE}/api/billing/accounts`, {
        headers: authHeaders(),
      });
      const accounts = await accountsRes.json();
      // Should not have duplicate accounts for same user
      const userIds = accounts.map((a: any) => a.userId);
      const uniqueUserIds = [...new Set(userIds)];
      expect(userIds.length).toBe(uniqueUserIds.length);
    }
  });
});
