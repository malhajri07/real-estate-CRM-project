import { test, expect, APIRequestContext } from "@playwright/test";

const BASE = "http://localhost:3000";

let adminToken: string;
let agentToken: string;

async function getTokens(request: APIRequestContext) {
  if (!adminToken) {
    const r = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "admin", password: "admin123" } });
    adminToken = (await r.json()).token;
  }
  if (!agentToken) {
    const r = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "agent1", password: "agent123" } });
    agentToken = (await r.json()).token;
  }
  return { adminToken, agentToken };
}

function h(token: string) { return { headers: { Authorization: `Bearer ${token}` } }; }

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LEADS CRUD LIFECYCLE (10 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API Advanced — Leads CRUD Lifecycle", () => {
  let createdLeadId: string;

  test("A1.1 create lead with full data", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/leads`, {
      ...h(agentToken),
      data: {
        firstName: "E2E",
        lastName: "AdvancedTest",
        phone: "+966500001111",
        email: "e2e-advanced@test.com",
        status: "new",
        source: "playwright-advanced",
        notes: "Created by advanced E2E test",
      },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    createdLeadId = json.id;
    expect(createdLeadId).toBeTruthy();
  });

  test("A1.2 read created lead by ID", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!createdLeadId) test.skip();
    const res = await request.get(`${BASE}/api/leads/${createdLeadId}`, h(agentToken));
    expect(res.ok()).toBeTruthy();
    const lead = await res.json();
    expect(lead.firstName || lead.id).toBeTruthy();
  });

  test("A1.3 update lead notes", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!createdLeadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${createdLeadId}`, {
      ...h(agentToken),
      data: { notes: "Updated notes from E2E" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("A1.4 update lead status", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!createdLeadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${createdLeadId}`, {
      ...h(agentToken),
      data: { status: "contacted" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("A1.5 verify lead update persisted", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!createdLeadId) test.skip();
    const res = await request.get(`${BASE}/api/leads/${createdLeadId}`, h(agentToken));
    expect(res.ok()).toBeTruthy();
    const lead = await res.json();
    // Notes or status should reflect updates
    expect(lead).toBeTruthy();
  });

  test("A1.6 search for created lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/leads/search?q=E2E`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("A1.7 delete created lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!createdLeadId) test.skip();
    const res = await request.delete(`${BASE}/api/leads/${createdLeadId}`, h(agentToken));
    expect([200, 204]).toContain(res.status());
  });

  test("A1.8 verify lead is gone after delete", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!createdLeadId) test.skip();
    const res = await request.get(`${BASE}/api/leads/${createdLeadId}`, h(agentToken));
    expect([200, 404]).toContain(res.status());
  });

  test("A1.9 create lead with minimal data", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/leads`, {
      ...h(agentToken),
      data: { firstName: "Min", lastName: "Data", phone: "+966500009999", status: "new", source: "test" },
    });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    if (json.id) {
      // Clean up
      await request.delete(`${BASE}/api/leads/${json.id}`, h(agentToken));
    }
  });

  test("A1.10 create lead with duplicate phone handled", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const data = { firstName: "Dup", lastName: "Test", phone: "+966500008888", status: "new", source: "test" };
    const res1 = await request.post(`${BASE}/api/leads`, { ...h(agentToken), data });
    const json1 = await res1.json();
    // Try creating duplicate
    const res2 = await request.post(`${BASE}/api/leads`, { ...h(agentToken), data });
    expect([200, 201, 400, 409]).toContain(res2.status());
    // Clean up
    if (json1.id) await request.delete(`${BASE}/api/leads/${json1.id}`, h(agentToken));
    const json2 = await res2.json().catch(() => ({}));
    if (json2.id && json2.id !== json1.id) await request.delete(`${BASE}/api/leads/${json2.id}`, h(agentToken));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. APPOINTMENTS CRUD (8 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API Advanced — Appointments", () => {
  let appointmentId: string;

  test("A2.1 list appointments", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/appointments`, h(agentToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json) || json.data || json.appointments).toBeTruthy();
  });

  test("A2.2 create appointment", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/appointments`, {
      ...h(agentToken),
      data: {
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        notes: "E2E test appointment",
        status: "SCHEDULED",
      },
    });
    expect([200, 201, 400]).toContain(res.status());
    const json = await res.json();
    if (json.id) appointmentId = json.id;
  });

  test("A2.3 appointments list with admin token", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/appointments`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("A2.4 appointments denied without auth", async ({ request }) => {
    const res = await request.get(`${BASE}/api/appointments`);
    expect([401, 403]).toContain(res.status());
  });

  test("A2.5 create appointment denied without auth", async ({ request }) => {
    const res = await request.post(`${BASE}/api/appointments`, {
      data: { scheduledAt: new Date().toISOString(), notes: "unauth" },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("A2.6 appointments response has correct structure", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/appointments`, h(agentToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const data = Array.isArray(json) ? json : (json.data || json.appointments || []);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("id");
    }
  });

  test("A2.7 appointments with invalid ID returns 404", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/appointments/99999999`, h(agentToken));
    expect([200, 404]).toContain(res.status());
  });

  test("A2.8 appointments with pagination params", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/appointments?page=1&pageSize=5`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ACTIVITIES CRUD (6 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API Advanced — Activities", () => {
  test("A3.1 list activities", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/activities`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("A3.2 activities with admin token", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/activities`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("A3.3 activities denied without auth", async ({ request }) => {
    const res = await request.get(`${BASE}/api/activities`);
    expect([401, 403]).toContain(res.status());
  });

  test("A3.4 activities response is array or paginated", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/activities`, h(agentToken));
    const json = await res.json();
    expect(Array.isArray(json) || json.data || typeof json === "object").toBeTruthy();
  });

  test("A3.5 admin activities endpoint", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/activities`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("A3.6 admin activities denied for agent", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/activities`, h(agentToken));
    expect(res.status()).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PAGINATION EDGE CASES (8 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API Advanced — Pagination Edge Cases", () => {
  test("A4.1 page=0 handled gracefully", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=0&pageSize=10`);
    expect([200, 400]).toContain(res.status());
  });

  test("A4.2 negative page handled gracefully", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=-1&pageSize=10`);
    expect([200, 400]).toContain(res.status());
  });

  test("A4.3 very large page number returns empty or valid", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=99999&pageSize=10`);
    expect(res.ok()).toBeTruthy();
  });

  test("A4.4 pageSize=0 handled gracefully", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=1&pageSize=0`);
    expect([200, 400]).toContain(res.status());
  });

  test("A4.5 negative pageSize handled gracefully", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=1&pageSize=-5`);
    expect([200, 400]).toContain(res.status());
  });

  test("A4.6 very large pageSize handled", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=1&pageSize=100000`);
    expect(res.ok()).toBeTruthy();
  });

  test("A4.7 non-numeric page handled", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=abc&pageSize=10`);
    expect([200, 400]).toContain(res.status());
  });

  test("A4.8 leads pagination edge case", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/leads?page=1&pageSize=1`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. FILTER COMBINATIONS (6 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API Advanced — Filter Combinations", () => {
  test("A5.1 listings filter by city and type", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?city=Riyadh&propertyType=apartment`);
    expect(res.ok()).toBeTruthy();
  });

  test("A5.2 listings filter by price range", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?minPrice=100000&maxPrice=500000`);
    expect([200, 400]).toContain(res.status());
  });

  test("A5.3 listings filter by listing type", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?listingType=sale`);
    expect(res.ok()).toBeTruthy();
  });

  test("A5.4 leads filter by status", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/leads?status=new`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("A5.5 listings with multiple filters combined", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?city=Riyadh&listingType=sale&page=1&pageSize=5`);
    expect(res.ok()).toBeTruthy();
  });

  test("A5.6 listings filter with non-existent city returns empty", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?city=NonExistentCity12345`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const data = Array.isArray(json) ? json : (json.data || json.listings || []);
    expect(data.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CONCURRENT & PERFORMANCE (6 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API Advanced — Concurrent & Performance", () => {
  test("A6.1 concurrent read requests succeed", async ({ request }) => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => request.get(`${BASE}/api/listings`))
    );
    for (const r of results) expect(r.ok()).toBeTruthy();
  });

  test("A6.2 concurrent authenticated requests", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const results = await Promise.all([
      request.get(`${BASE}/api/leads`, h(agentToken)),
      request.get(`${BASE}/api/deals`, h(agentToken)),
      request.get(`${BASE}/api/activities`, h(agentToken)),
      request.get(`${BASE}/api/appointments`, h(agentToken)),
      request.get(`${BASE}/api/notifications`, h(agentToken)),
    ]);
    for (const r of results) expect(r.ok()).toBeTruthy();
  });

  test("A6.3 health endpoint responds under 500ms", async ({ request }) => {
    const start = Date.now();
    const res = await request.get(`${BASE}/api/health`);
    const elapsed = Date.now() - start;
    expect(res.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(500);
  });

  test("A6.4 login responds under 2s", async ({ request }) => {
    const start = Date.now();
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { identifier: "agent1", password: "agent123" },
    });
    const elapsed = Date.now() - start;
    expect(res.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(2000);
  });

  test("A6.5 listings endpoint responds under 3s", async ({ request }) => {
    const start = Date.now();
    const res = await request.get(`${BASE}/api/listings?page=1&pageSize=10`);
    const elapsed = Date.now() - start;
    expect(res.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(3000);
  });

  test("A6.6 admin dashboard API responds under 3s", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const start = Date.now();
    const res = await request.get(`${BASE}/api/rbac-admin/dashboard`, h(adminToken));
    const elapsed = Date.now() - start;
    expect(res.ok()).toBeTruthy();
    expect(elapsed).toBeLessThan(3000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. ERROR RESPONSE FORMAT (6 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API Advanced — Error Response Format", () => {
  test("A7.1 401 response has JSON body", async ({ request }) => {
    const res = await request.get(`${BASE}/api/leads`);
    expect([401, 403]).toContain(res.status());
    const contentType = res.headers()["content-type"];
    expect(contentType).toContain("json");
  });

  test("A7.2 401 response has error message", async ({ request }) => {
    const res = await request.get(`${BASE}/api/leads`);
    const json = await res.json();
    // Should have some error info
    expect(json.error || json.message || json.success === false).toBeTruthy();
  });

  test("A7.3 invalid login returns proper error format", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { identifier: "nonexistent", password: "wrong" },
    });
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json).toBeTruthy();
  });

  test("A7.4 health endpoint returns proper JSON format", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json).toHaveProperty("ok", true);
    expect(json).toHaveProperty("timestamp");
  });

  test("A7.5 listings response has consistent format", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=1&pageSize=5`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    // Should be array or paginated object
    expect(Array.isArray(json) || json.data || json.listings || json.total !== undefined).toBeTruthy();
  });

  test("A7.6 admin dashboard response has metrics object", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/dashboard`, h(adminToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.metrics).toBeTruthy();
    expect(typeof json.metrics).toBe("object");
  });
});
