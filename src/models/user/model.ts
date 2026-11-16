import type { TInputData, User } from '@/infra/database/types'
import { userRepository } from '@/repositories/user-repository'

import { updateSchema } from './schema'
import type { TUserUpdateData } from './types'

const createMany = async (data: TInputData<User>[]): Promise<void> => {
  await userRepository.createMany(data)
}

const findManyByCompanyId = async (companyId: string): Promise<User[]> =>
  await userRepository.findManyByCompanyId(companyId)

const findManyByNames = async (names: string[]): Promise<User[]> => {
  return names.length === 0 ? [] : await userRepository.findManyByNames(names)
}

const updateMany = async (
  data: (Partial<TInputData<User>> & { id: string })[]
): Promise<void> => {
  await userRepository.updateMany(data)
}

const update = async (data: TUserUpdateData): Promise<User> => {
  const validData = updateSchema.parse(data)
  const user = await userRepository.update(validData)
  if (!user) {
    throw new Error(
      `User ${validData.id} not found in company ${validData.companyId}`
    )
  }
  return user
}

export const userModel = {
  createMany,
  findManyByCompanyId,
  findManyByNames,
  update,
  updateMany
}
