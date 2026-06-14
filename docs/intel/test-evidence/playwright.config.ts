import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'on',
    video: 'off',
    actionTimeout: 10000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
