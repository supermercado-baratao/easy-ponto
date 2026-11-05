import postgres from '@prisma/orm-postgres/runtime'
import { contractFromJson } from '@prisma/orm-postgres/static'

import type { Contract } from './contract.d'
import contractJson from './contract.json' with { type: 'json' }

const createClient = () =>
  postgres({
    contract: contractFromJson<Contract>(contractJson),
    url: process.env.DATABASE_URL!,
    // `pg` waits forever by default when the database is unreachable
    poolOptions: { connectionTimeoutMillis: 5000 }
  })

const globalForDatabase = globalThis as unknown as {
  database?: ReturnType<typeof createClient>
}

const database = globalForDatabase.database ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForDatabase.database = database

export { database }
