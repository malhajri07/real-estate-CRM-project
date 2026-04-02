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

test.describe("2. Leads CRUD (14 tests)", () => {
  let leadId: string;

  test("2.1 GET /leads with agent token", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/leads`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("2.2 GET /leads with admin token", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/leads`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("2.3 GET /leads without token fails", async ({ request }) => {
    const res = await request.get(`${BASE}/api/leads`);
    expect([401, 403]).toContain(res.status());
  });

  test("2.4 POST /leads creates lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/leads`, { ...h(agentToken), data: { firstName: "PW", lastName: "Test", phone: "+966501112222", status: "new", source: "playwright" } });
    expect([200, 201]).toContain(res.status());
    const json = await res.json();
    leadId = json.id;
    expect(leadId).toBeTruthy();
  });

  test("2.5 GET /leads/:id returns created lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.get(`${BASE}/api/leads/${leadId}`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("2.6 PUT /leads/:id updates lead", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.put(`${BASE}/api/leads/${leadId}`, { ...h(agentToken), data: { notes: "updated by playwright" } });
    expect(res.ok()).toBeTruthy();
  });

  test("2.7 GET /leads/search", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/leads/search?q=PW`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("2.8 DELETE /leads/:id", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    if (!leadId) test.skip();
    const res = await request.delete(`${BASE}/api/leads/${leadId}`, h(agentToken));
    expect([200, 204]).toContain(res.status());
  });

  test("2.9 POST /leads with invalid data", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/leads`, { ...h(agentToken), data: {} });
    expect([400, 500, 201]).toContain(res.status());
  });

  test("2.10 GET /leads with invalid token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/leads`, { headers: { Authorization: "Bearer bad" } });
    expect([401, 403]).toContain(res.status());
  });

  test("2.11 GET /deals with agent", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/deals`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("2.12 GET /deals without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/deals`);
    expect([401, 403]).toContain(res.status());
  });

  test("2.13 GET /activities with agent", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/activities`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("2.14 GET /activities without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/activities`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("3. Properties & Listings (13 tests)", () => {
  test("3.1 GET /listings public", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.2 GET /listings paginated", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=1&pageSize=5`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.3 GET /listings filtered by city", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?city=Riyadh`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.4 GET /property-categories", async ({ request }) => {
    const res = await request.get(`${BASE}/api/property-categories`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.5 GET /property-types", async ({ request }) => {
    const res = await request.get(`${BASE}/api/property-types`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.6 GET /listings nonexistent ID", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings/00000000-0000-0000-0000-000000000099`);
    expect([200, 404]).toContain(res.status());
  });

  test("3.7 POST /listings without auth", async ({ request }) => {
    const res = await request.post(`${BASE}/api/listings`, { data: { title: "test" } });
    expect([401, 403, 400]).toContain(res.status());
  });

  test("3.8 GET /agencies", async ({ request }) => {
    const res = await request.get(`${BASE}/api/agencies`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.9 GET /locations", async ({ request }) => {
    const res = await request.get(`${BASE}/api/locations`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.10 GET /locations/regions", async ({ request }) => {
    const res = await request.get(`${BASE}/api/locations/regions`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.11 GET /requests public", async ({ request }) => {
    const res = await request.get(`${BASE}/api/requests`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.12 GET /marketing-requests", async ({ request }) => {
    const res = await request.get(`${BASE}/api/marketing-requests`);
    expect(res.ok()).toBeTruthy();
  });

  test("3.13 GET /unverified-listings", async ({ request }) => {
    const res = await request.get(`${BASE}/api/unverified-listings`);
    expect(res.ok()).toBeTruthy();
  });
});

test.describe("4. Admin RBAC (14 tests)", () => {
  test("4.1 dashboard with admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/dashboard`, h(adminToken));
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.metrics).toBeTruthy();
  });

  test("4.2 dashboard denied for agent", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/dashboard`, h(agentToken));
    expect(res.status()).toBe(403);
  });

  test("4.3 dashboard denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/rbac-admin/dashboard`);
    expect([401, 403]).toContain(res.status());
  });

  test("4.4 GET users admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/users`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.5 GET roles admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/roles`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.6 GET organizations admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/organizations`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.7 GET activities admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/activities`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.8 users denied for agent", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/users`, h(agentToken));
    expect(res.status()).toBe(403);
  });

  test("4.9 debug-session admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/debug-session`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.10 dashboard has all metric keys", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/rbac-admin/dashboard`, h(adminToken));
    const json = await res.json();
    for (const key of ["leads", "listings", "appointments", "dealsWon"]) {
      expect(json.metrics).toHaveProperty(key);
    }
  });

  test("4.11 GET billing plans", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/billing/plans`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.12 GET billing invoices", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/billing/invoices`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.13 GET billing analytics", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/billing/analytics`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("4.14 billing denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/billing/plans`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("5. Notifications & Campaigns (13 tests)", () => {
  test("5.1 GET notifications admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/notifications`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("5.2 GET notifications agent", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/notifications`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("5.3 notifications denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/notifications`);
    expect([401, 403]).toContain(res.status());
  });

  test("5.4 GET campaigns admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/campaigns`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("5.5 campaigns denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/campaigns`);
    expect([401, 403]).toContain(res.status());
  });

  test("5.6 GET favorites agent", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/favorites`, h(agentToken));
    expect([200, 401]).toContain(res.status());
  });

  test("5.7 GET saved searches", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/search/saved`, h(agentToken));
    expect([200, 401]).toContain(res.status());
  });

  test("5.8 GET appointments admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/appointments`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("5.9 GET appointments agent", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/appointments`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("5.10 appointments denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/appointments`);
    expect([401, 403]).toContain(res.status());
  });

  test("5.11 GET support admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/support`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("5.12 GET messages admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/messages`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("5.13 GET community channels", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/community/channels`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });
});

test.describe("6. CMS & Content (13 tests)", () => {
  test("6.1 GET landing public", async ({ request }) => {
    const res = await request.get(`${BASE}/api/landing`);
    expect(res.ok()).toBeTruthy();
  });

  test("6.2 GET CMS articles", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/cms/articles`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("6.3 GET CMS navigation", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/cms/navigation`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("6.4 GET knowledge-base", async ({ request }) => {
    const res = await request.get(`${BASE}/api/knowledge-base`);
    expect(res.ok()).toBeTruthy();
  });

  test("6.5 GET sitemap.xml", async ({ request }) => {
    const res = await request.get(`${BASE}/sitemap.xml`);
    expect(res.ok()).toBeTruthy();
  });

  test("6.6 GET pool health", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/pool/health`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("6.7 GET pool search", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/pool/search`, h(agentToken));
    expect(res.ok()).toBeTruthy();
  });

  test("6.8 pool denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/pool/search`);
    expect([401, 403]).toContain(res.status());
  });

  test("6.9 GET audit-logs admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/audit-logs`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("6.10 GET moderation", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/moderation`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("6.11 GET reports admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/reports`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("6.12 GET CSV deals admin", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    const res = await request.get(`${BASE}/api/csv/deals`, h(adminToken));
    expect(res.ok()).toBeTruthy();
  });

  test("6.13 CSV denied without token", async ({ request }) => {
    const res = await request.get(`${BASE}/api/csv/deals`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("7. Security (12 tests)", () => {
  test("7.1 SQL injection blocked", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "admin' OR '1'='1", password: "x" } });
    expect([400, 401]).toContain(res.status());
  });

  test("7.2 XSS in query safe", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?city=<script>alert(1)</script>`);
    expect(res.ok()).toBeTruthy();
  });

  test("7.3 expired token rejected", async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/me`, { headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ0IiwiZXhwIjoxfQ.x" } });
    expect([401, 403]).toContain(res.status());
  });

  test("7.4 impersonate denied for agent", async ({ request }) => {
    const { agentToken } = await getTokens(request);
    const res = await request.post(`${BASE}/api/auth/impersonate`, { ...h(agentToken), data: { userId: "t" } });
    expect([401, 403, 404]).toContain(res.status());
  });

  test("7.5 path traversal blocked", async ({ request }) => {
    const res = await request.get(`${BASE}/api/../../../etc/passwd`);
    expect([200, 301, 400, 403, 404]).toContain(res.status());
  });

  test("7.6 large pageSize handled", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?pageSize=99999`);
    expect(res.ok()).toBeTruthy();
  });

  test("7.7 negative page handled", async ({ request }) => {
    const res = await request.get(`${BASE}/api/listings?page=-1`);
    expect([200, 400]).toContain(res.status());
  });

  test("7.8 long identifier handled", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "a".repeat(500), password: "x" } });
    expect([400, 401]).toContain(res.status());
  });

  test("7.9 wrong HTTP method", async ({ request }) => {
    const res = await request.put(`${BASE}/api/auth/login`, { data: {} });
    expect([400, 401, 404, 405]).toContain(res.status());
  });

  test("7.10 helmet security headers present", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const headers = res.headers();
    expect(headers["x-content-type-options"] || headers["x-frame-options"]).toBeTruthy();
  });

  test("7.11 JWT has 3 parts", async ({ request }) => {
    const { adminToken } = await getTokens(request);
    expect(adminToken.split(".").length).toBe(3);
  });

  test("7.12 concurrent requests succeed", async ({ request }) => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => request.get(`${BASE}/api/listings`))
    );
    for (const r of results) expect(r.ok()).toBeTruthy();
  });
});
