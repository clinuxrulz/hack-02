import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'test-debug.spec.ts',
  use: {
    headless: true,
  },
  webServer: {
    command: 'pnpm run start',
    port: 3000,
    reuseExistingServer: true,
  },
});