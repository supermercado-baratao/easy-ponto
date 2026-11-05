import { db } from '@/infra/database/client'
import type {
  TInputData,
  TUserWithPunchRecords,
  User
} from '@/infra/database/types'

const users = db.orm.public.User

export const userRepo = {
  createMany: async (data: TInputData<User>[]): Promise<void> => {
    await users.createAndCount(data)
  },

  findManyByCompanyId: async (companyId: string): Promise<User[]> =>
    await users.where({ companyId }).all(),

  findManyByNames: async (names: string[]): Promise<User[]> =>
    await users.where((user) => user.name.in(names)).all(),

  findUniqueByPisWithPunchRecords: async (
    pis: string
  ): Promise<TUserWithPunchRecords> =>
    await users.whereUnique({ pis }).include('punchRecords').firstOrThrow(),

  updateMany: async (
    data: (Partial<TInputData<User>> & { id: string })[]
  ): Promise<void> => {
    await db.transaction(async (tx) => {
      for (const { id, ...user } of data) {
        const updated = await tx.orm.public.User.where({ id }).update(user)
        if (!updated) throw new Error(`User ${id} not found`)
      }
    })
  }
}
