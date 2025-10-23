// These visual tests rely on Playwright, so make sure to install it locally:
//   npm install --save-dev @playwright/test
import { expect, test } from '@playwright/test';

const LANGUAGE_STORAGE_KEY = 'crm-language';

const cases = [
  { code: 'en', label: 'Latin', dir: 'ltr', screenshot: 'layout-latin.png' },
  { code: 'ar', label: 'Arabic', dir: 'rtl', screenshot: 'layout-arabic.png' },
];

cases.forEach(({ code, label, dir, screenshot }) => {
  test(`${label} layout renders correctly`, async ({ page }) => {
    await page.addInitScript(
      ([storageKey, language]) => {
        window.localStorage.setItem(storageKey, language);
      },
      [LANGUAGE_STORAGE_KEY, code]
    );

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toHaveAttribute('dir', dir);
    await expect(page).toHaveScreenshot(screenshot, { fullPage: true });
  });
});

