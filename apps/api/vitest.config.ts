/**
 * vitest.config.ts — Vitest test-runner configuration for the API package.
 *
 * Configures path aliases (matching tsconfig paths) so unit tests can
 * import `@shared/*` and `@api/*` without bundling the full application.
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ['__tests__/**/*.test.ts'],
  },
});
