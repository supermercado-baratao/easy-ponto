import { and, eq } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import { users } from '@/infra/database/schema'
import type { TInputData, User } from '@/infra/database/types'

export const userRepository = {
  createMany: async (data: TInputData<User>[]): Promise<void> => {
    await database.insert(users).values(data)
  },

  findManyByCompanyId: async (companyId: string): Promise<User[]> =>
    await database.query.users.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    }),

  findUniqueById: async (id: string): Promise<User | null> =>
    (await database.query.users.findFirst({ where: { id } })) ?? null,

  update: async ({
    id,
    companyId,
    ...data
  }: Pick<
    User,
    | 'id'
    | 'companyId'
    | 'status'
    | 'position'
    | 'department'
    | 'payrollNumber'
    | 'admissionDate'
  >): Promise<User | null> => {
    const [user = null] = await database
      .update(users)
      .set(data)
      .where(and(eq(users.id, id), eq(users.companyId, companyId)))
      .returning()
    return user
  },

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
