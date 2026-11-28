import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { restRestrictions, restRestrictionUsers } from '@/infra/database/schema'
import type {
  RestRestriction,
  TInputData,
  TRestRestrictionWithRelations
} from '@/infra/database/types'

type TRestRestrictionData = TInputData<RestRestriction> & { userIds: string[] }

const withRelations = {
  users: { with: { user: true } },
  group: true,
  user: true
} as const

export const restRestrictionRepository = {
  findManyByCompanyId: async (
    companyId: string
  ): Promise<TRestRestrictionWithRelations[]> =>
    await database.query.restRestrictions.findMany({
      where: { companyId },
      with: withRelations,
      orderBy: { createdAt: 'asc' }
    }),

  findUnique: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<TRestRestrictionWithRelations | null> =>
    (await database.query.restRestrictions.findFirst({
      where: { id, companyId },
      with: withRelations
    })) ?? null,

  existsByUserGroupId: async (userGroupId: string): Promise<boolean> =>
    !!(await database.query.restRestrictions.findFirst({
      where: { userGroupId },
      columns: { id: true }
    })),

  save: async ({
    id,
    userIds,
    ...data
  }: TRestRestrictionData & { id?: string }): Promise<RestRestriction> =>
    await database.transaction(async (tx) => {
      const [restriction] = id
        ? await tx
            .update(restRestrictions)
            .set(data)
            .where(eq(restRestrictions.id, id))
            .returning()
        : await tx.insert(restRestrictions).values(data).returning()
      await tx
        .delete(restRestrictionUsers)
        .where(eq(restRestrictionUsers.restrictionId, restriction.id))
      if (userIds.length > 0) {
        await tx.insert(restRestrictionUsers).values(
          userIds.map((userId) => ({
            restrictionId: restriction.id,
            userId
          }))
        )
      }
      return restriction
    }),

  remove: async (id: string): Promise<void> => {
    await database.delete(restRestrictions).where(eq(restRestrictions.id, id))
  }
}
