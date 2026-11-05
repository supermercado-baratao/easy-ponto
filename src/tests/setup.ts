import { existsSync } from 'node:fs'

// Loaded first because a loaded variable is never overwritten: tests must not touch the development database
process.loadEnvFile('.env.test')

// The git-ignored .env.local holds the credentials of the real device for the external tests
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
