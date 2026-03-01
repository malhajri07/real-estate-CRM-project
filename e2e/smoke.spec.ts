import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveTitle(/عقاركم|Aqarkom/i);
  });

  test("api health check returns 200", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json).toHaveProperty("ok", true);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/rbac-login");
    await expect(page.getByRole("img", { name: /Aqarkom/i })).toBeVisible({ timeout: 10000 });
  });
});
