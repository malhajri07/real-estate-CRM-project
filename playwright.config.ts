// Install `@playwright/test` locally before running these visual tests:
//   npm install --save-dev @playwright/test
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/tests',
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1280, height: 720 },
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm run dev:client',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
});

