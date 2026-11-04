import { db } from '@/infra/database/client'

import { TStatusCheckData } from './types'

const getDatabaseVersion = async (): Promise<string> => {
  const plan = db.raw.sql`SHOW server_version`
    .returnsRow({ server_version: 'pg/text@1' })
    .build()
  const [row] = await db.query(plan)
  return row.server_version
}

const getMaxConnections = async (): Promise<string> => {
  const plan = db.raw.sql`SHOW max_connections`
    .returnsRow({ max_connections: 'pg/text@1' })
    .build()
  const [row] = await db.query(plan)
  return row.max_connections
}

const getOpenedConnections = async (): Promise<number> => {
  const databaseName = process.env.POSTGRES_DB as string
  const plan = db.raw.sql`
    SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = ${databaseName}
  `
    .returnsRow({ count: 'pg/int4@1' })
    .build()
  const [row] = await db.query(plan)
  return row.count
}

const check = async (): Promise<TStatusCheckData> => {
  const updatedAt = new Date()
  const [version, maxConnections] = await Promise.all([
    getDatabaseVersion(),
    getMaxConnections()
  ])
  const count = await getOpenedConnections()
  return {
    updatedAt,
    dependencies: {
      database: {
        version,
        maxConnections,
        openedConnections: count
      }
    }
  }
}

export const statusModel = {
  check
}
