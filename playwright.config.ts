import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke / e2e tests. These catch render & hydration breakage that unit tests
 * cannot see (e.g. a client component crashing on hydration).
 *
 * Runs against `next dev` because dev surfaces hydration mismatches as console
 * errors, which the smoke tests assert against.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // Use the system Google Chrome instead of downloading a browser.
      // For CI without Chrome, run `npx playwright install chromium` and drop `channel`.
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
