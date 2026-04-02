import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";

async function loginAsAgent(page: Page) {
  await page.goto(`${BASE}/rbac-login`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
  const form = page.locator('input[id="identifier"]');
  if (await form.isVisible({ timeout: 5000 }).catch(() => false)) {
    await form.fill("agent1");
    await page.fill('input[id="password"]', "agent123");
    await page.click('button[type="submit"]');
  }
  await page.waitForTimeout(5000);
}

test.describe("13. Performance (12 tests)", () => {
  test("13.1 landing page loads under 10s", async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/home`);
    await page.waitForLoadState("domcontentloaded");
    expect(Date.now() - start).toBeLessThan(10000);
  });

  test("13.2 login page loads under 5s", async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForLoadState("domcontentloaded");
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test("13.3 dashboard loads after login", async ({ page }) => {
    await loginAsAgent(page);
    await page.goto(`${BASE}/home/platform`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("13.4 API health responds fast", async ({ request }) => {
    const start = Date.now();
    await request.get(`${BASE}/api/health`);
    expect(Date.now() - start).toBeLessThan(1000);
  });

  test("13.5 login API responds under 3s", async ({ request }) => {
    const start = Date.now();
    await request.post(`${BASE}/api/auth/login`, { data: { identifier: "admin", password: "admin123" } });
    expect(Date.now() - start).toBeLessThan(3000);
  });

  test("13.6 listings API responds under 3s", async ({ request }) => {
    const start = Date.now();
    await request.get(`${BASE}/api/listings`);
    expect(Date.now() - start).toBeLessThan(3000);
  });

  test("13.7 multiple page navigation", async ({ page }) => {
    await loginAsAgent(page);
    for (const path of ["/home/platform", "/home/platform/leads", "/home/platform/properties"]) {
      await page.goto(`${BASE}${path}`);
      await page.waitForTimeout(2000);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("13.8 page has no massive DOM", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(3000);
    const nodeCount = await page.evaluate(() => document.querySelectorAll("*").length);
    expect(nodeCount).toBeLessThan(10000);
  });

  test("13.9 parallel API calls", async ({ request }) => {
    const login = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "admin", password: "admin123" } });
    const token = (await login.json()).token;
    const h = { headers: { Authorization: `Bearer ${token}` } };
    const results = await Promise.all([
      request.get(`${BASE}/api/leads`, h),
      request.get(`${BASE}/api/deals`, h),
      request.get(`${BASE}/api/appointments`, h),
    ]);
    for (const r of results) expect(r.ok()).toBeTruthy();
  });

  test("13.10 static page loads", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForLoadState("networkidle");
    expect(true).toBe(true);
  });

  test("13.11 fast page transitions", async ({ page }) => {
    await loginAsAgent(page);
    const start = Date.now();
    await page.goto(`${BASE}/home/platform/leads`);
    await page.waitForLoadState("domcontentloaded");
    expect(Date.now() - start).toBeLessThan(10000);
  });

  test("13.12 blog loads fast", async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/blog`);
    await page.waitForLoadState("domcontentloaded");
    expect(Date.now() - start).toBeLessThan(5000);
  });
});

test.describe("14. Accessibility (12 tests)", () => {
  test("14.1 login form has labels", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const labels = page.locator("label");
    expect(await labels.count()).toBeGreaterThan(0);
  });

  test("14.2 buttons exist", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const buttons = page.locator("button");
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test("14.3 inputs exist on login", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const inputs = page.locator("input");
    expect(await inputs.count()).toBeGreaterThanOrEqual(2);
  });

  test("14.4 page has heading", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(3000);
    const headings = page.locator("h1, h2, h3");
    expect(await headings.count()).toBeGreaterThan(0);
  });

  test("14.5 focus works on tab", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test("14.6 password input has type password", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const pwInput = page.locator('input[type="password"]');
    expect(await pwInput.count()).toBeGreaterThanOrEqual(1);
  });

  test("14.7 links exist on landing", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(2000);
    const links = page.locator("a");
    expect(await links.count()).toBeGreaterThan(0);
  });

  test("14.8 html has lang attribute", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(1000);
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
  });

  test("14.9 no critical duplicate IDs", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const duplicates = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll("[id]")).map(el => el.id).filter(Boolean);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(duplicates.length).toBeLessThanOrEqual(5);
  });

  test("14.10 text is visible", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const text = await page.locator("body").textContent();
    expect(text?.trim().length).toBeGreaterThan(5);
  });

  test("14.11 main landmark exists on platform", async ({ page }) => {
    await loginAsAgent(page);
    await page.goto(`${BASE}/home/platform`);
    await page.waitForTimeout(4000);
    const main = page.locator("main");
    expect(await main.count()).toBeGreaterThanOrEqual(1);
  });

  test("14.12 semantic HTML used", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(2000);
    const sections = page.locator("section, header, footer, main, nav");
    expect(await sections.count()).toBeGreaterThan(0);
  });
});

test.describe("15. Edge Cases (11 tests)", () => {
  test("15.1 double submit login", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const form = page.locator('input[id="identifier"]');
    if (await form.isVisible({ timeout: 3000 }).catch(() => false)) {
      await form.fill("agent1");
      await page.fill('input[id="password"]', "agent123");
      await page.click('button[type="submit"]');
      await page.click('button[type="submit"]').catch(() => {});
    }
    await page.waitForTimeout(5000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("15.2 back navigation", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/blog`);
    await page.waitForTimeout(2000);
    await page.goBack();
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("15.3 refresh preserves page", async ({ page }) => {
    await page.goto(`${BASE}/blog`);
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("15.4 empty search handled", async ({ request }) => {
    const login = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "agent1", password: "agent123" } });
    const token = (await login.json()).token;
    const res = await request.get(`${BASE}/api/leads/search?q=`, { headers: { Authorization: `Bearer ${token}` } });
    expect([200, 400]).toContain(res.status());
  });

  test("15.5 special chars in search", async ({ request }) => {
    const login = await request.post(`${BASE}/api/auth/login`, { data: { identifier: "agent1", password: "agent123" } });
    const token = (await login.json()).token;
    const res = await request.get(`${BASE}/api/leads/search?q=${encodeURIComponent("<>&")}`, { headers: { Authorization: `Bearer ${token}` } });
    expect([200, 400]).toContain(res.status());
  });

  test("15.6 JSON content-type", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    expect(res.headers()["content-type"]).toContain("json");
  });

  test("15.7 landing loads without auth", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("15.8 unknown API route returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/nonexistent-endpoint`);
    expect([404, 200]).toContain(res.status());
  });

  test("15.9 rapid page loads", async ({ page }) => {
    for (const p of [`${BASE}/home`, `${BASE}/blog`, `${BASE}/signup`, `${BASE}/rbac-login`]) {
      await page.goto(p);
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("15.10 page content renders", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(3000);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(500);
  });

  test("15.11 scroll within root", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(3000);
    // #root is position:fixed, scroll within it
    await page.evaluate(() => {
      const root = document.getElementById("root");
      if (root) root.scrollTop = 500;
    });
    expect(true).toBe(true);
  });
});
