import type { Prisma } from '@/infra/database/generated/client'

export type TUserWithPunchRecords = Prisma.UserGetPayload<{
  include: {
    punchRecords: true
  }
}>
