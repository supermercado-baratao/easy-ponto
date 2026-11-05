import { database } from '@/infra/database/client'

export const statusRepository = {
  getDatabaseVersion: async (): Promise<string> => {
    const plan = database.raw.sql`SHOW server_version`
      .returnsRow({ server_version: 'pg/text@1' })
      .build()
    const [row] = await database.query(plan)
    return row.server_version
  },

  getMaxConnections: async (): Promise<string> => {
    const plan = database.raw.sql`SHOW max_connections`
      .returnsRow({ max_connections: 'pg/text@1' })
      .build()
    const [row] = await database.query(plan)
    return row.max_connections
  },

  getOpenedConnections: async (): Promise<number> => {
    const databaseName = process.env.POSTGRES_DB as string
    const plan = database.raw.sql`
      SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = ${databaseName}
    `
      .returnsRow({ count: 'pg/int4@1' })
      .build()
    const [row] = await database.query(plan)
    return row.count
  }
}
