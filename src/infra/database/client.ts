import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { relations } from './relations'

const createClient = () =>
  drizzle({
    client: new Pool({
      connectionString: process.env.DATABASE_URL!,
      // `pg` waits forever by default when the database is unreachable
      connectionTimeoutMillis: 5000
    }),
    relations
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
