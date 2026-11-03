import type { Prisma } from '@/infra/database/generated/client'

export type TAdminUserWithRelations = Prisma.AdminUserGetPayload<{
  include: {
    company: true
    deviceCredentials: true
    user: true
  }
}>
