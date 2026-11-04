import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from './generated/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const createClient = (): PrismaClient =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      // `pg` waits forever by default, while Prisma 6 gave up after 5s:
      // https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
      connectionTimeoutMillis: 5000
    })
  })

const prisma = globalForPrisma.prisma || createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }
