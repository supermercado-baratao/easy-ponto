import { prisma } from '@/infra'

import { TStatusCheckData } from './types'

interface IStatusModel {
  check(): Promise<TStatusCheckData>
}

export class StatusModel implements IStatusModel {
  async check(): Promise<TStatusCheckData> {
    const updatedAt = new Date()
    const [version, maxConnections] = await Promise.all([
      this.getDatabaseVersion(),
      this.getMaxConnections()
    ])
    const count = await this.getOpenedConnections()
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

  private async getDatabaseVersion() {
    const result = await prisma.$queryRaw<[{ server_version: string }]>`
    SHOW server_version;
  `
    return result[0].server_version
  }

  private async getMaxConnections(): Promise<string> {
    const result = await prisma.$queryRaw<[{ max_connections: string }]>`
      SHOW max_connections;
    `
    return result[0].max_connections
  }

  private async getOpenedConnections(): Promise<number> {
    const databaseName = process.env.POSTGRES_DB as string
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = ${databaseName};
    `
    return Number(result[0].count)
  }
}
