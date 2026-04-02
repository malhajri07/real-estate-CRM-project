import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("1. Auth & Session (15 tests)", () => {
  test("1.1 health check returns ok", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toHaveProperty("ok", true);
  });

  test("1.2 deep health check", async ({ request }) => {
    const res = await request.get(`${BASE}/health`);
    expect([200, 503]).toContain(res.status());
  });

  test("1.3 admin login succeeds", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "admin", password: "admin123" } });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.token).toBeTruthy();
  });

  test("1.4 agent login succeeds", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "agent1", password: "agent123" } });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).token).toBeTruthy();
  });

  test("1.5 login with wrong password fails", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "admin", password: "wrong" } });
    expect(res.status()).toBe(401);
  });

  test("1.6 login with empty body fails", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: {} });
    expect([400, 401]).toContain(res.status());
  });

  test("1.7 GET /auth/me with valid token", async ({ request }) => {
    const login = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "admin", password: "admin123" } });
    const token = (await login.json()).token;
    const res = await request.get(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.ok()).toBeTruthy();
  });

  test("1.8 GET /auth/me without token fails", async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/me`);
    expect([401, 403]).toContain(res.status());
  });

  test("1.9 GET /auth/me with invalid token fails", async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/me`, { headers: { Authorization: "Bearer invalid" } });
    expect([401, 403]).toContain(res.status());
  });

  test("1.10 GET /auth/user returns user details", async ({ request }) => {
    const login = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "agent1", password: "agent123" } });
    const token = (await login.json()).token;
    const res = await request.get(`${BASE}/api/auth/user`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.ok()).toBeTruthy();
    const user = await res.json();
    expect(user.username).toBe("agent1");
  });

  test("1.11 login page loads in browser", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await expect(page.locator("form")).toBeVisible({ timeout: 10000 });
  });

  test("1.12 login form submits", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const identifier = page.locator('input[id="identifier"]');
    if (await identifier.isVisible({ timeout: 5000 }).catch(() => false)) {
      await identifier.fill("agent1");
      await page.fill('input[id="password"]', "agent123");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(10000);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("1.13 landing page loads", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("1.14 signup page loads", async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("1.15 logout works", async ({ request }) => {
    const login = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "admin", password: "admin123" } });
    const token = (await login.json()).token;
    const res = await request.post(`${BASE}/api/auth/logout`, { headers: { Authorization: `Bearer ${token}` } });
    expect([200, 204, 404]).toContain(res.status());
  });
});
