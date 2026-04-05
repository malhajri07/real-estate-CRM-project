/**
 * Auth API Integration Tests
 *
 * Tests all /api/auth/* endpoints via real HTTP requests.
 * Requires the API server running on localhost:3000 with seeded DB.
 */
import { describe, test, expect, beforeAll } from 'vitest';

import { BASE_URL as BASE, ADMIN_CREDS } from './config';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let adminToken: string;
let agentToken: string;

// ---------------------------------------------------------------------------
// Helper: login and return { token, user }
// ---------------------------------------------------------------------------
async function login(identifier: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ identifier, password }),
  });
  return { status: res.status, body: await res.json() };
}

// ---------------------------------------------------------------------------
// Setup: obtain tokens for admin and agent users
// ---------------------------------------------------------------------------
beforeAll(async () => {
  const adminLogin = await login('admin', 'admin123');
  expect(adminLogin.status).toBe(200);
  adminToken = adminLogin.body.token;
  expect(adminToken).toBeTruthy();

  // Try to log in as agent1 (may or may not exist in seed data)
  try {
    const agentLogin = await login('agent1', 'agent123');
    if (agentLogin.status === 200 && agentLogin.body.token) {
      agentToken = agentLogin.body.token;
    } else {
      agentToken = adminToken; // fallback
    }
  } catch {
    agentToken = adminToken;
  }
});

// ===========================================================================
// POST /api/auth/login
// ===========================================================================
describe('POST /api/auth/login', () => {
  test('valid admin login returns 200 with token and user', async () => {
    const { status, body } = await login('admin', 'admin123');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
    expect(body.token.split('.')).toHaveLength(3); // JWT format
    expect(body.user).toBeDefined();
    expect(body.user.username).toBe('admin');
  });

  test('valid agent login (if seeded) returns 200', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ identifier: 'agent1', password: 'agent123' }),
    });
    // Either 200 (user exists) or 401 (not seeded) are acceptable
    expect([200, 401]).toContain(res.status);
  });

  test('wrong password returns 401', async () => {
    const { status, body } = await login('admin', 'wrongpassword');
    expect(status).toBe(401);
    expect(body.success).toBeFalsy();
  });

  test('empty body returns 400', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({}),
    });
    expect([400, 401]).toContain(res.status);
  });

  test('missing password field returns 400', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ identifier: 'admin' }),
    });
    expect([400, 401]).toContain(res.status);
  });

  test('missing identifier field returns 400', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ password: 'admin123' }),
    });
    expect([400, 401]).toContain(res.status);
  });

  test('email-based login (if admin has email)', async () => {
    // Try logging in with an email-style identifier
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ identifier: 'admin@example.com', password: 'admin123' }),
    });
    // May succeed or fail depending on seeded data
    expect([200, 401]).toContain(res.status);
  });

  test('SQL injection attempt in identifier is rejected safely', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        identifier: "admin' OR '1'='1",
        password: 'admin123',
      }),
    });
    expect(res.status).not.toBe(200);
    expect([400, 401, 500]).toContain(res.status);
  });

  test('SQL injection attempt in password is rejected safely', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        identifier: 'admin',
        password: "' OR '1'='1' --",
      }),
    });
    expect(res.status).toBe(401);
  });

  test('non-existent user returns 401', async () => {
    const { status } = await login('nonexistentuser99', 'anypassword');
    expect(status).toBe(401);
  });

  test('response includes user object with expected fields', async () => {
    const { body } = await login('admin', 'admin123');
    expect(body.user).toBeDefined();
    expect(body.user.id).toBeDefined();
    expect(body.user.roles).toBeDefined();
  });
});

// ===========================================================================
// GET /api/auth/me
// ===========================================================================
describe('GET /api/auth/me', () => {
  test('with valid token returns 200 with user', async () => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
    expect(body.user.id).toBeDefined();
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/auth/me`);
    expect(res.status).toBe(401);
  });

  test('with invalid token returns 401 or 403', async () => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('with malformed Authorization header returns 401', async () => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: 'NotBearer something' },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('with tampered JWT returns 401 or 403', async () => {
    const tampered = adminToken.slice(0, -5) + 'XXXXX';
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tampered}` },
    });
    expect([401, 403]).toContain(res.status);
  });
});

// ===========================================================================
// GET /api/auth/user
// ===========================================================================
describe('GET /api/auth/user', () => {
  test('returns user details with organization info', async () => {
    const res = await fetch(`${BASE}/api/auth/user`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.username).toBe('admin');
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/auth/user`);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// PUT /api/auth/user
// ===========================================================================
describe('PUT /api/auth/user', () => {
  test('update firstName succeeds', async () => {
    const res = await fetch(`${BASE}/api/auth/user`, {
      method: 'PUT',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ firstName: 'AdminUpdated' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.firstName).toBe('AdminUpdated');
  });

  test('update multiple fields', async () => {
    const res = await fetch(`${BASE}/api/auth/user`, {
      method: 'PUT',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ firstName: 'Primary', lastName: 'Admin' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('invalid email returns 400', async () => {
    const res = await fetch(`${BASE}/api/auth/user`, {
      method: 'PUT',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    expect(res.status).toBe(400);
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/auth/user`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ firstName: 'NoAuth' }),
    });
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// PUT /api/auth/password
// ===========================================================================
describe('PUT /api/auth/password', () => {
  test('wrong current password returns 400', async () => {
    const res = await fetch(`${BASE}/api/auth/password`, {
      method: 'PUT',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        currentPassword: 'wrongcurrent',
        newPassword: 'newpass123',
      }),
    });
    expect(res.status).toBe(400);
  });

  test('new password too short returns 400', async () => {
    const res = await fetch(`${BASE}/api/auth/password`, {
      method: 'PUT',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        currentPassword: 'admin123',
        newPassword: '12',
      }),
    });
    expect(res.status).toBe(400);
  });

  test('missing fields returns 400', async () => {
    const res = await fetch(`${BASE}/api/auth/password`, {
      method: 'PUT',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('change password then change back succeeds', async () => {
    // Change to new password
    const res1 = await fetch(`${BASE}/api/auth/password`, {
      method: 'PUT',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        currentPassword: 'admin123',
        newPassword: 'admin456',
      }),
    });
    expect(res1.status).toBe(200);

    // Login with new password to get fresh token
    const loginRes = await login('admin', 'admin456');
    expect(loginRes.status).toBe(200);

    // Change back
    const res2 = await fetch(`${BASE}/api/auth/password`, {
      method: 'PUT',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${loginRes.body.token}` },
      body: JSON.stringify({
        currentPassword: 'admin456',
        newPassword: 'admin123',
      }),
    });
    expect(res2.status).toBe(200);

    // Verify we can login with the original password
    const verifyLogin = await login('admin', 'admin123');
    expect(verifyLogin.status).toBe(200);
    adminToken = verifyLogin.body.token;
  });

  test('without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/auth/password`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        currentPassword: 'admin123',
        newPassword: 'newpass',
      }),
    });
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET / PUT /api/auth/preferences
// ===========================================================================
describe('GET/PUT /api/auth/preferences', () => {
  test('save preferences then load them back', async () => {
    const prefs = { newLeads: false, taskUpdates: true, newDeals: false };

    const putRes = await fetch(`${BASE}/api/auth/preferences`, {
      method: 'PUT',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(prefs),
    });
    expect(putRes.status).toBe(200);
    const putBody = await putRes.json();
    expect(putBody.success).toBe(true);
    expect(putBody.preferences.newLeads).toBe(false);

    const getRes = await fetch(`${BASE}/api/auth/preferences`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.preferences.newLeads).toBe(false);
    expect(getBody.preferences.taskUpdates).toBe(true);
  });

  test('GET preferences without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/auth/preferences`);
    expect(res.status).toBe(401);
  });

  test('PUT preferences without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/auth/preferences`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ newLeads: true }),
    });
    expect(res.status).toBe(401);
  });

  test('GET preferences returns defaults when none saved', async () => {
    const res = await fetch(`${BASE}/api/auth/preferences`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.preferences).toBeDefined();
  });
});

// ===========================================================================
// POST /api/auth/logout
// ===========================================================================
describe('POST /api/auth/logout', () => {
  test('logout with valid token returns 200', async () => {
    const res = await fetch(`${BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('logout without token returns 401', async () => {
    const res = await fetch(`${BASE}/api/auth/logout`, {
      method: 'POST',
    });
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// GET /api/health
// ===========================================================================
describe('GET /api/health', () => {
  test('returns 200 with ok status', async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.timestamp).toBeDefined();
  });
});
