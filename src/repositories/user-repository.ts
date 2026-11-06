import { database } from '@/infra/database/client'
import type { TInputData, User } from '@/infra/database/types'

const users = database.orm.public.User

export const userRepository = {
  createMany: async (data: TInputData<User>[]): Promise<void> => {
    await users.createAndCount(data)
  },

  findManyByCompanyId: async (companyId: string): Promise<User[]> =>
    await users
      .where({ companyId })
      .orderBy((user) => user.name.asc())
      .all(),

  findManyByNames: async (names: string[]): Promise<User[]> =>
    await users.where((user) => user.name.in(names)).all(),

  updateMany: async (
    data: (Partial<TInputData<User>> & { id: string })[]
  ): Promise<void> => {
    await database.transaction(async (tx) => {
      for (const { id, ...user } of data) {
        const updated = await tx.orm.public.User.where({ id }).update(user)
        if (!updated) throw new Error(`User ${id} not found`)
      }
    })
  }
}
