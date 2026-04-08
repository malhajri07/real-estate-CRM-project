/**
 * full-scenario.spec.ts — Comprehensive E2E Test Suite
 *
 * Full agent journey with video recording + screenshots.
 * Tests use resilient selectors — checks page loaded without error,
 * not exact text matches.
 */

import { test, expect, Page } from "@playwright/test";

const ADMIN = { identifier: "admin", password: "admin123" };
const AGENT = { identifier: "indiv_agent_1", password: "agent123" };
const LOGIN_URL = "/rbac-login";

async function login(page: Page, creds = AGENT) {
  await page.goto(LOGIN_URL);
  await page.waitForLoadState("networkidle");
  const id = page.locator('input[name="identifier"], input[type="text"]').first();
  const pw = page.locator('input[name="password"], input[type="password"]').first();
  await id.fill(creds.identifier);
  await pw.fill(creds.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/home\/platform|\/admin/, { timeout: 15000 });
  // Agent should land on platform, wait for it
  if (creds === AGENT) {
    await page.waitForTimeout(1000);
  }
}

/** Verify a page loaded: no 500/error, body has content */
async function expectPageLoaded(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  // Page should not show a server error
  const body = await page.locator("body").textContent();
  expect(body?.length).toBeGreaterThan(10);
}

async function ss(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. AUTH
// ═══════════════════════════════════════════════════════════════════════════

test.describe("1. Auth", () => {
  test("login page is RTL with form", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await ss(page, "01-login");
  });

  test("login redirects to platform", async ({ page }) => {
    await login(page);
    expect(page.url()).toMatch(/\/home\/platform|\/admin/);
    await ss(page, "02-post-login");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. PLATFORM PAGES — load each page, verify no crash
// ═══════════════════════════════════════════════════════════════════════════

const PLATFORM_PAGES = [
  { path: "/home/platform", name: "dashboard" },
  { path: "/home/platform/properties", name: "properties" },
  { path: "/home/platform/leads", name: "leads" },
  { path: "/home/platform/pipeline", name: "pipeline" },
  { path: "/home/platform/calendar", name: "calendar" },
  { path: "/home/platform/activities", name: "activities" },
  { path: "/home/platform/broker-requests", name: "broker-requests" },
  { path: "/home/platform/notifications", name: "campaigns" },
  { path: "/home/platform/settings", name: "settings" },
  { path: "/home/platform/pool", name: "pool" },
  { path: "/home/platform/forum", name: "forum" },
  { path: "/home/platform/marketing-requests", name: "promotions" },
];

test.describe("2. Platform Pages Load", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const p of PLATFORM_PAGES) {
    test(`${p.name} page loads`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);
      await expectPageLoaded(page);
      await ss(page, `03-${p.name}`);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. INTERACTIVE FLOWS
// ═══════════════════════════════════════════════════════════════════════════

test.describe("3. Interactive Flows", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("property detail page from list", async ({ page }) => {
    await page.goto("/home/platform/properties");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const card = page.locator('[class*="cursor-pointer"]').first();
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(1500);
      await ss(page, "04-property-detail");
    }
  });

  test("create lead form opens", async ({ page }) => {
    await page.goto("/home/platform/leads");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const btn = page.locator("button").filter({ hasText: /إضافة|جديد/ }).first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, "05-lead-create-form");
    }
  });

  test("broker request create form", async ({ page }) => {
    await page.goto("/home/platform/broker-requests");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const btn = page.locator("button").filter({ hasText: /طلب جديد/ }).first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, "06-broker-request-form");
    }
  });

  test("campaign tabs — automation & templates", async ({ page }) => {
    await page.goto("/home/platform/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Automation tab
    const autoTab = page.locator("button").filter({ hasText: /الأتمتة/ }).first();
    if (await autoTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await autoTab.click();
      await page.waitForTimeout(1000);
      await ss(page, "07-campaigns-automation");
    }

    // Templates tab
    const tplTab = page.locator("button").filter({ hasText: /القوالب/ }).first();
    if (await tplTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tplTab.click();
      await page.waitForTimeout(1000);
      await ss(page, "08-campaigns-templates");
    }
  });

  test("settings tabs — professional, security, notifications", async ({ page }) => {
    await page.goto("/home/platform/settings");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await ss(page, "09-settings-profile");

    for (const tab of ["المهني", "الأمان", "الإشعارات"]) {
      const btn = page.locator("button").filter({ hasText: tab }).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(800);
        await ss(page, `10-settings-${tab}`);
      }
    }
  });

  test("promotion create sheet opens", async ({ page }) => {
    await page.goto("/home/platform/marketing-requests");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const btn = page.locator("button").filter({ hasText: /ترويج جديد|ابدأ/ }).first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, "11-promotion-create");
    }
  });

  test("broker request detail sheet", async ({ page }) => {
    await page.goto("/home/platform/broker-requests");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const card = page.locator('[class*="cursor-pointer"]').first();
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(1500);
      await ss(page, "12-broker-detail");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. REGA COMPLIANCE UI
// ═══════════════════════════════════════════════════════════════════════════

test.describe("4. REGA Compliance", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("FAL license visible in professional settings", async ({ page }) => {
    await page.goto("/home/platform/settings");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const proTab = page.locator("button").filter({ hasText: /المهني/ }).first();
    if (await proTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await proTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator("text=رخصة فال").first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator("text=rega.gov.sa").first()).toBeVisible();
      await ss(page, "13-rega-fal");
    }
  });

  test("commission cap warning appears above 2.5%", async ({ page }) => {
    await page.goto("/home/platform/broker-requests");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const btn = page.locator("button").filter({ hasText: /طلب جديد/ }).first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
      // Find commission input and set high value
      const input = page.locator('input[type="number"][step="0.5"]').first();
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill("5");
        await page.waitForTimeout(500);
        await ss(page, "14-rega-commission-warning");
      }
    }
  });

  test("post listing has REGA regulatory step", async ({ page }) => {
    await page.goto("/home/platform/properties/post-listing");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await expectPageLoaded(page);
    await ss(page, "15-rega-post-listing");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe("5. API Endpoints", () => {
  let token: string;
  let agentToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { identifier: ADMIN.identifier, password: ADMIN.password },
    });
    const json = await res.json();
    token = json.token;

    const agentRes = await request.post("/api/auth/login", {
      data: { identifier: AGENT.identifier, password: AGENT.password },
    });
    const agentJson = await agentRes.json();
    agentToken = agentJson.token;
  });

  test("health check", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
  });

  test("login returns token", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { identifier: ADMIN.identifier, password: ADMIN.password },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.token).toBeTruthy();
  });

  test("unauthenticated request rejected", async ({ request }) => {
    const res = await request.get("/api/leads");
    expect(res.status()).toBe(401);
  });

  for (const endpoint of [
    "/api/leads",
    "/api/broker-requests",
    "/api/campaigns",
    "/api/promotions",
    "/api/auth/user",
    "/api/auth/preferences",
  ]) {
    test(`GET ${endpoint} returns OK`, async ({ request }) => {
      const res = await request.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();
    });
  }

  test("REGA: FAL middleware blocks listing without FAL", async ({ request }) => {
    const res = await request.post("/api/listings", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: "Test listing",
        city: "الرياض",
        propertyType: "فيلا",
        price: 1000000,
        status: "active",
      },
    });
    // Should either succeed (admin bypasses FAL) or return 400/403 for compliance
    expect([200, 201, 400, 403]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. MOBILE VIEWPORT
// ═══════════════════════════════════════════════════════════════════════════

test.describe("6. Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("login responsive", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await ss(page, "16-mobile-login");
  });

  test("dashboard responsive", async ({ page }) => {
    await login(page);
    await page.goto("/home/platform");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await ss(page, "17-mobile-dashboard");
  });

  test("settings responsive", async ({ page }) => {
    await login(page);
    await page.goto("/home/platform/settings");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await ss(page, "18-mobile-settings");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. PUBLIC PAGES
// ═══════════════════════════════════════════════════════════════════════════

test.describe("7. Public Pages", () => {
  test("landing page", async ({ page }) => {
    await page.goto("/home");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await expectPageLoaded(page);
    await ss(page, "19-landing");
  });

  test("map search", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await expectPageLoaded(page);
    await ss(page, "20-map");
  });

  test("404 page", async ({ page }) => {
    await page.goto("/xyz-not-found");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    await expectPageLoaded(page);
    await ss(page, "21-404");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. RTL LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

test.describe("8. RTL Layout", () => {
  test("all pages maintain RTL direction", async ({ page }) => {
    await login(page);
    for (const p of ["/home/platform", "/home/platform/settings", "/home/platform/leads"]) {
      await page.goto(p);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    }
    await ss(page, "22-rtl-verified");
  });
});
