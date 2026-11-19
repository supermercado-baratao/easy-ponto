import { defineConfig, devices } from '@playwright/test'

import { ADMIN_STORAGE_STATE } from './src/tests/_utils/e2e-auth'

// Loaded first because a loaded variable is never overwritten: the E2E server and the setup must not
// touch the development database. The server inherits these variables
process.loadEnvFile('.env.test')

const PORT = 3001
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  globalSetup: './src/tests/e2e/global-setup.ts',
  // `next dev` compiles each route on its first request, which on a cold CI runner can outlast the
  // default 5s of an assertion that waits for a navigation
  expect: { timeout: 15_000 },
  // The CRUD flows chain several Server Actions, each compiled on its first call, and already took
  // close to the default 30s with the machine idle
  timeout: 60_000,
  webServer: {
    command: `pnpm test:services && pnpm exec next dev --port ${PORT}`,
    url: BASE_URL,
    env: { NEXT_DIST_DIR: '.next/e2e' },
    // Only an E2E server listens on this port, so reusing it never points the tests at the
    // development database
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: BASE_URL
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_STORAGE_STATE },
      dependencies: ['setup']
    }
  ]
})
