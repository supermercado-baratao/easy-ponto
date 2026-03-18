import { Prisma } from '@prisma/client'

export type TAdminUserWithRelations = Prisma.AdminUserGetPayload<{
  include: {
    company: true
    deviceCredentials: true
    user: true
  }
}>
