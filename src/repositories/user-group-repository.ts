import { and, eq, type SQL } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import { userGroupMembers, userGroups } from '@/infra/database/schema'
import type {
  TInputData,
  UserGroup,
  UserGroupMember
} from '@/infra/database/types'

type TCompanyScopedId = { id: string; companyId: string }

const whereCompanyScopedId = ({
  id,
  companyId
}: TCompanyScopedId): SQL | undefined =>
  and(eq(userGroups.id, id), eq(userGroups.companyId, companyId))

export const userGroupRepository = {
  findManyByCompanyId: async (companyId: string): Promise<UserGroup[]> =>
    await database.query.userGroups.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    }),

  findMembersByCompanyId: async (
    companyId: string
  ): Promise<Pick<UserGroupMember, 'groupId' | 'userId'>[]> =>
    await database
      .select({
        groupId: userGroupMembers.groupId,
        userId: userGroupMembers.userId
      })
      .from(userGroupMembers)
      .innerJoin(userGroups, eq(userGroupMembers.groupId, userGroups.id))
      .where(eq(userGroups.companyId, companyId)),

  create: async (data: TInputData<UserGroup>): Promise<UserGroup> => {
    const [group] = await database.insert(userGroups).values(data).returning()
    return group
  },

  update: async ({
    id,
    companyId,
    ...data
  }: TInputData<UserGroup> & { id: string }): Promise<UserGroup | null> => {
    const [group = null] = await database
      .update(userGroups)
      .set(data)
      .where(whereCompanyScopedId({ id, companyId }))
      .returning()
    return group
  },

  remove: async (scopedId: TCompanyScopedId): Promise<UserGroup | null> => {
    const [group = null] = await database
      .delete(userGroups)
      .where(whereCompanyScopedId(scopedId))
      .returning()
    return group
  },

  replaceUserGroups: async (
    { userId, groupIds }: { userId: string; groupIds: string[] },
    transaction?: TTransaction
  ): Promise<void> => {
    await runInTransaction(transaction, async (tx) => {
      await tx
        .delete(userGroupMembers)
        .where(eq(userGroupMembers.userId, userId))
      if (groupIds.length === 0) return
      await tx
        .insert(userGroupMembers)
        .values(groupIds.map((groupId) => ({ groupId, userId })))
    })
  }
}
