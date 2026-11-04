import { defineConfig, devices } from '@playwright/test'

if (!process.env.DATABASE_URL) process.loadEnvFile('.env.development')

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  // `pnpm dev` compiles each route on its first request, which on a cold CI runner can outlast the
  // default 5s of an assertion that waits for a navigation
  expect: { timeout: 15_000 },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:3000'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
