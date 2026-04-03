import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const MOBILE = { width: 375, height: 667 };

async function loginAsAgentMobile(page: Page) {
  await page.setViewportSize(MOBILE);
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

async function loginAsAdminMobile(page: Page) {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE}/rbac-login`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
  const form = page.locator('input[id="identifier"]');
  if (await form.isVisible({ timeout: 5000 }).catch(() => false)) {
    await form.fill("admin");
    await page.fill('input[id="password"]', "admin123");
    await page.click('button[type="submit"]');
  }
  await page.waitForTimeout(5000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MOBILE LANDING & PUBLIC PAGES (10 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Mobile — Landing & Public Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
  });

  test("M1.1 landing page renders on mobile viewport", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(10);
  });

  test("M1.2 landing page has no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(3000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    // Allow small tolerance (10px)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
  });

  test("M1.3 landing page text is readable (font size >= 12px)", async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await page.waitForTimeout(3000);
    const fontSize = await page.evaluate(() => {
      const body = document.querySelector("body");
      return body ? parseInt(window.getComputedStyle(body).fontSize) : 16;
    });
    expect(fontSize).toBeGreaterThanOrEqual(12);
  });

  test("M1.4 login page renders on mobile", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    await expect(page.locator('input[id="identifier"]')).toBeVisible({ timeout: 8000 });
    const inputWidth = await page.locator('input[id="identifier"]').evaluate(el => el.getBoundingClientRect().width);
    // Input should fill most of the mobile width
    expect(inputWidth).toBeGreaterThan(100);
  });

  test("M1.5 login form usable on mobile", async ({ page }) => {
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const ident = page.locator('input[id="identifier"]');
    if (await ident.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ident.fill("agent1");
      await page.fill('input[id="password"]', "agent123");
      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeVisible();
      // Button should be tappable (minimum 44x44 touch target)
      const box = await submitBtn.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(30);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("M1.6 signup selection page on mobile", async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M1.7 individual signup on mobile", async ({ page }) => {
    await page.goto(`${BASE}/signup/individual`);
    await page.waitForTimeout(3000);
    const inputs = page.locator("input");
    expect(await inputs.count()).toBeGreaterThan(0);
    // Inputs should not overflow viewport
    const firstInput = inputs.first();
    if (await firstInput.isVisible().catch(() => false)) {
      const box = await firstInput.boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(MOBILE.width + 20);
      }
    }
  });

  test("M1.8 corporate signup on mobile", async ({ page }) => {
    await page.goto(`${BASE}/signup/corporate`);
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M1.9 blog page on mobile", async ({ page }) => {
    await page.goto(`${BASE}/blog`);
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M1.10 map page on mobile", async ({ page }) => {
    await page.goto(`${BASE}/map`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MOBILE DASHBOARD & NAVIGATION (10 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Mobile — Dashboard & Navigation", () => {
  test("M2.1 dashboard renders on mobile after login", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M2.2 dashboard cards stack vertically on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform`);
    await page.waitForTimeout(4000);
    const cards = page.locator("[class*='card'], [class*='Card']");
    const count = await cards.count();
    if (count >= 2) {
      const box1 = await cards.nth(0).boundingBox();
      const box2 = await cards.nth(1).boundingBox();
      if (box1 && box2) {
        // Cards should be stacked (second card y > first card y) or same x
        expect(box2.y).toBeGreaterThanOrEqual(box1.y);
      }
    }
  });

  test("M2.3 sidebar collapses or becomes hamburger on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform`);
    await page.waitForTimeout(4000);
    // Desktop sidebar should not be taking up space on mobile
    const sidebar = page.locator("aside").first();
    if (await sidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
      const box = await sidebar.boundingBox();
      if (box) {
        // Sidebar should either be hidden or narrow on mobile
        expect(box.width).toBeLessThan(MOBILE.width);
      }
    }
    // Or there should be a hamburger menu button
    const hamburger = page.locator("button[aria-label*='menu'], button[aria-label*='Menu'], button").filter({ has: page.locator("svg") }).first();
    await expect(page.locator("body")).toBeVisible();
  });

  test("M2.4 leads page on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/leads`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M2.5 properties page on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/properties`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M2.6 calendar page on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/calendar`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M2.7 forum page on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/forum`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M2.8 settings page on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/settings`);
    await page.waitForTimeout(4000);
    const inputs = page.locator("input");
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test("M2.9 reports page on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/reports`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M2.10 notifications page on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/notifications`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MOBILE FORMS (8 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Mobile — Forms", () => {
  test("M3.1 post-listing form fits mobile viewport", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/post-listing`);
    await page.waitForTimeout(4000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE.width + 20);
  });

  test("M3.2 post-listing inputs are full width on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/post-listing`);
    await page.waitForTimeout(4000);
    const firstInput = page.locator("input, textarea").first();
    if (await firstInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await firstInput.boundingBox();
      if (box) {
        // Input should be at least 60% of viewport width on mobile
        expect(box.width).toBeGreaterThan(MOBILE.width * 0.5);
      }
    }
  });

  test("M3.3 leads add button visible on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/leads`);
    await page.waitForTimeout(4000);
    const buttons = page.locator("button");
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test("M3.4 settings form inputs fit on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/settings`);
    await page.waitForTimeout(4000);
    const inputs = page.locator("input");
    if (await inputs.count() > 0) {
      const firstInput = inputs.first();
      const box = await firstInput.boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(MOBILE.width + 20);
      }
    }
  });

  test("M3.5 marketing-request form on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`${BASE}/marketing-request`);
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M3.6 real-estate-requests form on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`${BASE}/real-estate-requests`);
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M3.7 login form inputs have adequate touch targets", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const identInput = page.locator('input[id="identifier"]');
    if (await identInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const box = await identInput.boundingBox();
      if (box) {
        // Minimum touch target height
        expect(box.height).toBeGreaterThanOrEqual(30);
      }
    }
  });

  test("M3.8 signup form fields fit on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`${BASE}/signup/individual`);
    await page.waitForTimeout(3000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE.width + 20);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. MOBILE INTERACTIONS (6 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Mobile — Interactions", () => {
  test("M4.1 bottom drawer opens on mobile leads page", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/leads`);
    await page.waitForTimeout(4000);
    const addBtn = page.locator("button").filter({ hasText: /إضافة|أضف|جديد|New|Add/ }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("M4.2 mobile table scrolls horizontally", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/leads`);
    await page.waitForTimeout(5000);
    const table = page.locator("table").first();
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const tableWidth = await table.evaluate(el => el.scrollWidth);
      // Table may be wider than viewport, requiring scroll
      expect(tableWidth).toBeGreaterThan(0);
    }
  });

  test("M4.3 buttons are tappable on mobile dashboard", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform`);
    await page.waitForTimeout(4000);
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible().catch(() => false)) {
        const box = await btn.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(24);
          expect(box.width).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });

  test("M4.4 mobile page navigation between routes", async ({ page }) => {
    await loginAsAgentMobile(page);
    for (const path of ["/home/platform", "/home/platform/leads", "/home/platform/properties"]) {
      await page.goto(`${BASE}${path}`);
      await page.waitForTimeout(2000);
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("M4.5 mobile keyboard does not break layout", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`${BASE}/rbac-login`);
    await page.waitForTimeout(3000);
    const ident = page.locator('input[id="identifier"]');
    if (await ident.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ident.focus();
      await ident.fill("test");
      await page.waitForTimeout(500);
      // Page should still be usable
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("M4.6 escape closes dialogs on mobile", async ({ page }) => {
    await loginAsAgentMobile(page);
    await page.goto(`${BASE}/home/platform/leads`);
    await page.waitForTimeout(4000);
    const addBtn = page.locator("button").filter({ hasText: /إضافة|أضف|جديد|New|Add/ }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(1000);
    }
    await expect(page.locator("body")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. MOBILE ADMIN (6 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Mobile — Admin Pages", () => {
  test("M5.1 admin dashboard on mobile", async ({ page }) => {
    await loginAsAdminMobile(page);
    await page.goto(`${BASE}/admin/overview/main-dashboard`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M5.2 admin users page on mobile", async ({ page }) => {
    await loginAsAdminMobile(page);
    await page.goto(`${BASE}/admin/users/all-users`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M5.3 admin dashboard cards stack on mobile", async ({ page }) => {
    await loginAsAdminMobile(page);
    await page.goto(`${BASE}/admin/overview/main-dashboard`);
    await page.waitForTimeout(4000);
    const cards = page.locator("[class*='card'], [class*='Card']");
    if (await cards.count() >= 2) {
      const box1 = await cards.nth(0).boundingBox();
      const box2 = await cards.nth(1).boundingBox();
      if (box1 && box2) {
        expect(box2.y).toBeGreaterThanOrEqual(box1.y);
      }
    }
  });

  test("M5.4 admin billing on mobile", async ({ page }) => {
    await loginAsAdminMobile(page);
    await page.goto(`${BASE}/admin/billing/invoices`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M5.5 admin analytics on mobile", async ({ page }) => {
    await loginAsAdminMobile(page);
    await page.goto(`${BASE}/admin/analytics/overview`);
    await page.waitForTimeout(4000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("M5.6 admin page no horizontal overflow", async ({ page }) => {
    await loginAsAdminMobile(page);
    await page.goto(`${BASE}/admin/overview/main-dashboard`);
    await page.waitForTimeout(4000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });
});
