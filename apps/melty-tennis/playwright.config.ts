import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'test-debug.spec.ts',
  use: {
    headless: true,
  },
  webServer: {
    command: 'pnpm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
});