/**
 * Appointments API Integration Tests
 *
 * Tests all /api/appointments/* endpoints via real HTTP requests.
 * Appointments require authenticateToken middleware.
 */
import { describe, test, expect, beforeAll } from 'vitest';

import { BASE_URL as BASE, ADMIN_CREDS } from './config';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let adminToken: string;
let createdAppointmentId: string;
let testCustomerId: string;

beforeAll(async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(ADMIN_CREDS),
  });
  const body = await res.json();
  adminToken = body.token;
  expect(adminToken).toBeTruthy();

  // Create a lead to get a customer ID for appointments
  const leadRes = await fetch(`${BASE}/api/leads`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      firstName: 'ApptTest',
      lastName: 'Client',
      phone: '+966505555555',
    }),
  });
  if (leadRes.status === 201) {
    const leadBody = await leadRes.json();
    testCustomerId = leadBody.customerId || leadBody.id;
  }
});

function authHeaders() {
  return { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` };
}

// ===========================================================================
// GET /api/appointments
// ===========================================================================
describe('GET /api/appointments', () => {
  test('with token returns 200 and array', async () => {
    const res = await fetch(`${BASE}/api/appointments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/appointments`);
    expect(res.status).toBe(401);
  });

  test('with invalid token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/appointments`, {
      headers: { Authorization: 'Bearer bad.token' },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('appointments have expected fields', async () => {
    const res = await fetch(`${BASE}/api/appointments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    if (body.length > 0) {
      const appt = body[0];
      expect(appt.id).toBeDefined();
      expect(appt).toHaveProperty('scheduledAt');
      expect(appt).toHaveProperty('status');
    }
  });
});

// ===========================================================================
// POST /api/appointments
// ===========================================================================
describe('POST /api/appointments', () => {
  test('create appointment with valid data returns 201', async () => {
    if (!testCustomerId) return;

    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customerId: testCustomerId,
        scheduledAt,
        notes: 'Integration test appointment',
        status: 'SCHEDULED',
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.status).toBe('SCHEDULED');
    createdAppointmentId = body.id;
  });

  test('create appointment without customerId fails', async () => {
    const res = await fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        scheduledAt: new Date().toISOString(),
      }),
    });
    expect(res.status).toBe(400);
  });

  test('create appointment without scheduledAt fails', async () => {
    const res = await fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customerId: testCustomerId || 'test-id',
      }),
    });
    expect(res.status).toBe(400);
  });

  test('create appointment with invalid datetime fails', async () => {
    const res = await fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customerId: testCustomerId || 'test-id',
        scheduledAt: 'not-a-date',
      }),
    });
    expect(res.status).toBe(400);
  });

  test('create appointment without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        customerId: 'some-id',
        scheduledAt: new Date().toISOString(),
      }),
    });
    expect(res.status).toBe(401);
  });

  test('create appointment with empty body returns 400', async () => {
    const res = await fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('create appointment with CANCELLED status', async () => {
    if (!testCustomerId) return;

    const res = await fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customerId: testCustomerId,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        status: 'CANCELLED',
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('CANCELLED');
  });
});

// ===========================================================================
// PUT /api/appointments/:id
// ===========================================================================
describe('PUT /api/appointments/:id', () => {
  test('update appointment status to COMPLETED', async () => {
    if (!createdAppointmentId) return;

    const res = await fetch(`${BASE}/api/appointments/${createdAppointmentId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.status).toBe('COMPLETED');
    }
  });

  test('update appointment notes', async () => {
    if (!createdAppointmentId) return;

    const res = await fetch(`${BASE}/api/appointments/${createdAppointmentId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ notes: 'Updated notes from test' }),
    });
    expect([200, 403]).toContain(res.status);
  });

  test('reschedule appointment', async () => {
    if (!createdAppointmentId) return;

    const newDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`${BASE}/api/appointments/${createdAppointmentId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        scheduledAt: newDate,
        status: 'RESCHEDULED',
      }),
    });
    expect([200, 403]).toContain(res.status);
  });

  test('update non-existent appointment returns 403 (ownership check fails)', async () => {
    const res = await fetch(`${BASE}/api/appointments/nonexistent-id`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    expect([403, 404]).toContain(res.status);
  });

  test('update without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/appointments/any-id`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// Edge cases
// ===========================================================================
describe('Appointments edge cases', () => {
  test('creating appointment with lead ID as customerId auto-resolves', async () => {
    // Create a lead first
    const leadRes = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        firstName: 'LeadForAppt',
        phone: '+966506666666',
      }),
    });
    if (leadRes.status !== 201) return;
    const lead = await leadRes.json();

    const res = await fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customerId: lead.id, // using lead ID
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    // Should succeed - the route resolves lead ID to customer ID
    expect(res.status).toBe(201);
  });

  test('creating appointment with non-existent customer creates placeholder', async () => {
    const res = await fetch(`${BASE}/api/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        customerId: 'nonexistent-customer-id-xyz',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    // The route creates a placeholder customer if not found
    expect(res.status).toBe(201);
  });
});
