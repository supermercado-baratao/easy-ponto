import { db } from '@/infra/database/client'
import type { TInputData, User } from '@/infra/database/types'

import { TUserWithPunchRecords } from './types'

const users = db.orm.public.User

const createMany = async (data: TInputData<User>[]): Promise<void> => {
  await users.createAndCount(data)
}

const findManyByCompanyId = async (companyId: string): Promise<User[]> => {
  const result = await users.where({ companyId }).all()
  return result
}

const findManyByNames = async (names: string[]): Promise<User[]> => {
  if (names.length === 0) return []
  const result = await users.where((user) => user.name.in(names)).all()
  return result
}

const findUniqueByPisWithPunchRecords = async (
  pis: string
): Promise<TUserWithPunchRecords> => {
  const result = await users
    .whereUnique({ pis })
    .include('punchRecords')
    .firstOrThrow()
  return result
}

const updateMany = async (
  data: (Partial<TInputData<User>> & { id: string })[]
): Promise<void> => {
  await db.transaction(async (tx) => {
    for (const { id, ...user } of data) {
      const updated = await tx.orm.public.User.where({ id }).update(user)
      if (!updated) throw new Error(`User ${id} not found`)
    }
  })
}

export const userModel = {
  createMany,
  findManyByCompanyId,
  findManyByNames,
  findUniqueByPisWithPunchRecords,
  updateMany
}
