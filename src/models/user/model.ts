import type {
  TInputData,
  TUserWithPunchRecords,
  User
} from '@/infra/database/types'
import { userRepo } from '@/repositories/user-repo'

const createMany = async (data: TInputData<User>[]): Promise<void> => {
  await userRepo.createMany(data)
}

const findManyByCompanyId = async (companyId: string): Promise<User[]> =>
  await userRepo.findManyByCompanyId(companyId)

const findManyByNames = async (names: string[]): Promise<User[]> => {
  if (names.length === 0) return []
  return await userRepo.findManyByNames(names)
}

const findUniqueByPisWithPunchRecords = async (
  pis: string
): Promise<TUserWithPunchRecords> =>
  await userRepo.findUniqueByPisWithPunchRecords(pis)

const updateMany = async (
  data: (Partial<TInputData<User>> & { id: string })[]
): Promise<void> => {
  await userRepo.updateMany(data)
}

export const userModel = {
  createMany,
  findManyByCompanyId,
  findManyByNames,
  findUniqueByPisWithPunchRecords,
  updateMany
}
