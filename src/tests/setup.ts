import { existsSync } from 'node:fs'

// The git-ignored .env.local holds the credentials of the real device for the external tests
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
if (!process.env.DATABASE_URL) process.loadEnvFile('.env.development')
