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

export type TTransaction = Parameters<
  Parameters<typeof database.transaction>[0]
>[0]

// Lets a repository write join the transaction of a larger operation, since a transaction can't
// open another one
export const runInTransaction = async <T>(
  tx: TTransaction | undefined,
  run: (tx: TTransaction) => Promise<T>
): Promise<T> => (tx ? await run(tx) : await database.transaction(run))

export { database }
