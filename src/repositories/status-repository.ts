import { sql } from 'drizzle-orm'

import { database } from '@/infra/database/client'

export const statusRepository = {
  getDatabaseVersion: async (): Promise<string> => {
    const [row] = await database.execute<{ server_version: string }>(
      sql`SHOW server_version`,
      'objects'
    )
    return row.server_version
  },

  getMaxConnections: async (): Promise<string> => {
    const [row] = await database.execute<{ max_connections: string }>(
      sql`SHOW max_connections`,
      'objects'
    )
    return row.max_connections
  },

  getOpenedConnections: async (): Promise<number> => {
    const databaseName = process.env.POSTGRES_DB as string
    const [row] = await database.execute<{ count: number }>(
      sql`SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = ${databaseName}`,
      'objects'
    )
    return row.count
  }
}
