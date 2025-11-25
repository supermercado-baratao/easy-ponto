import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

dotenv.config()

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    testTimeout: 60000,
    include: process.env.RUN_EXTERNAL_TESTS
      ? ['src/tests/external/**/*.test.ts']
      : ['src/tests/**/*.test.ts', '!src/tests/external/**'],
    exclude: ['node_modules', 'src/tests/e2e/**']
  }
})
