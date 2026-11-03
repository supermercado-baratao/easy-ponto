import { defineConfig, env } from 'prisma/config'

// Hosted environments inject DATABASE_URL; only local runs read the committed file
if (!process.env.DATABASE_URL) process.loadEnvFile('.env.development')

export default defineConfig({
  schema: 'src/infra/database/schema.prisma',
  migrations: {
    path: 'src/infra/database/migrations'
  },
  datasource: {
    url: env('DATABASE_URL')
  }
})
