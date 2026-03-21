import { Prisma } from '@prisma/client'

export type TUserWithPunchRecords = Prisma.UserGetPayload<{
  include: {
    punchRecords: true
  }
}>
