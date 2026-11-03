import { defineConfig as ormConfig } from '@prisma/orm-postgres/config'
import { definePrismaConfig } from 'prisma/config'

// Hosted environments inject DATABASE_URL; only local runs read the committed file
if (!process.env.DATABASE_URL) process.loadEnvFile('.env.development')

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/infra/database/contract.prisma',
    db: { connection: process.env.DATABASE_URL },
    migrations: { dir: './src/infra/database/migrations' }
  })
})
