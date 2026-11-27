import { and, eq } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import { users } from '@/infra/database/schema'
import type {
  TInputData,
  TUserInputData,
  User,
  UserJobFunction
} from '@/infra/database/types'

import { jobFunctionRepository } from './job-function-repository'
import { userGroupRepository } from './user-group-repository'

export const userRepository = {
  createMany: async (data: TUserInputData[]): Promise<void> => {
    await database.insert(users).values(data)
  },

  findManyByCompanyId: async (companyId: string): Promise<User[]> =>
    await database.query.users.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    }),

  findUniqueByAuthUserId: async ({
    companyId,
    authUserId
  }: {
    companyId: string
    authUserId: string
  }): Promise<User | null> =>
    (await database.query.users.findFirst({
      where: { companyId, authUserId }
    })) ?? null,

  findUniqueById: async (id: string): Promise<User | null> =>
    (await database.query.users.findFirst({ where: { id } })) ?? null,

  update: async ({
    id,
    companyId,
    groupIds,
    jobFunctions,
    ...data
  }: Pick<
    User,
    | 'id'
    | 'companyId'
    | 'status'
    | 'position'
    | 'payrollPositionActive'
    | 'department'
    | 'payrollNumber'
    | 'admissionDate'
  > & {
    groupIds: string[]
    jobFunctions: Pick<UserJobFunction, 'jobFunctionId' | 'active'>[]
  }): Promise<User | null> =>
    await database.transaction(async (tx) => {
      const [user = null] = await tx
        .update(users)
        .set(data)
        .where(and(eq(users.id, id), eq(users.companyId, companyId)))
        .returning()
      if (!user) return null
      await userGroupRepository.replaceUserGroups({ userId: id, groupIds }, tx)
      await jobFunctionRepository.replaceUserFunctions(
        { userId: id, links: jobFunctions },
        tx
      )
      return user
    }),

  updateMany: async (
    data: (Partial<TInputData<User>> & { id: string })[],
    transaction?: TTransaction
  ): Promise<void> => {
    await runInTransaction(transaction, async (tx) => {
      for (const { id, ...user } of data) {
        const [updated] = await tx
          .update(users)
          .set(user)
          .where(eq(users.id, id))
          .returning({ id: users.id })
        if (!updated) throw new Error(`User ${id} not found`)
      }
    })
  }
}
