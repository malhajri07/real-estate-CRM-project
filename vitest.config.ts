import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'packages/shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/api/src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['apps/api/src/**/*.ts'],
      exclude: ['apps/api/src/**/__tests__/**'],
    },
  },
});
