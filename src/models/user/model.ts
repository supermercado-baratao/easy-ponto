import type { TInputData, TUserInputData, User } from '@/infra/database/types'
import { NotFoundError } from '@/infra/errors'
import { JobFunctionNotFoundError } from '@/models/job-function/errors'
import { findPayrollFunction } from '@/models/job-function/utils'
import { UserGroupNotFoundError } from '@/models/user-group/errors'
import { jobFunctionRepository } from '@/repositories/job-function-repository'
import { userGroupRepository } from '@/repositories/user-group-repository'
import { userRepository } from '@/repositories/user-repository'

import { findManyByCompanyIdSchema, updateSchema } from './schema'
import type { TUsersWithOrganization, TUserUpdateData } from './types'

const groupByUserId = <T extends { userId: string }>(
  rows: T[]
): Map<string, T[]> => {
  const byUser = new Map<string, T[]>()
  for (const row of rows) {
    byUser.set(row.userId, [...(byUser.get(row.userId) ?? []), row])
  }
  return byUser
}

const createMany = async (data: TUserInputData[]): Promise<void> => {
  await userRepository.createMany(data)
}

const findManyByCompanyId = async (companyId: string): Promise<User[]> =>
  await userRepository.findManyByCompanyId(companyId)

const findManyWithOrganization = async (
  companyId: string
): Promise<TUsersWithOrganization> => {
  const validCompanyId = findManyByCompanyIdSchema.parse(companyId)
  const [users, groups, members, jobFunctions, links] = await Promise.all([
    userRepository.findManyByCompanyId(validCompanyId),
    userGroupRepository.findManyByCompanyId(validCompanyId),
    userGroupRepository.findMembersByCompanyId(validCompanyId),
    jobFunctionRepository.findManyByCompanyId(validCompanyId),
    jobFunctionRepository.findUserFunctionsByCompanyId(validCompanyId)
  ])
  const membersByUser = groupByUserId(members)
  const linksByUser = groupByUserId(links)
  return {
    users: users.map((user) => ({
      ...user,
      groupIds: (membersByUser.get(user.id) ?? []).map(
        ({ groupId }) => groupId
      ),
      jobFunctions: (linksByUser.get(user.id) ?? []).map(
        ({ jobFunctionId, active }) => ({ jobFunctionId, active })
      )
    })),
    groups,
    jobFunctions
  }
}

const findByAuthUserId = async (params: {
  companyId: string
  authUserId: string
}): Promise<User | null> => await userRepository.findUniqueByAuthUserId(params)

const updateMany = async (
  data: (Partial<TInputData<User>> & { id: string })[]
): Promise<void> => {
  await userRepository.updateMany(data)
}

const update = async (data: TUserUpdateData): Promise<User> => {
  const validData = updateSchema.parse(data)
  const [groups, jobFunctions] = await Promise.all([
    userGroupRepository.findManyByCompanyId(validData.companyId),
    jobFunctionRepository.findManyByCompanyId(validData.companyId)
  ])
  const unknownGroupId = validData.groupIds.find((groupId) =>
    groups.every(({ id }) => id !== groupId)
  )
  if (unknownGroupId) {
    throw new UserGroupNotFoundError(
      `UserGroup ${unknownGroupId} not found in company ${validData.companyId}`
    )
  }
  const unknownFunction = validData.jobFunctions.find(({ jobFunctionId }) =>
    jobFunctions.every(({ id }) => id !== jobFunctionId)
  )
  if (unknownFunction) {
    throw new JobFunctionNotFoundError(
      `JobFunction ${unknownFunction.jobFunctionId} not found in company ${validData.companyId}`
    )
  }
  const payrollFunction = findPayrollFunction(jobFunctions, validData.position)
  const user = await userRepository.update({
    ...validData,
    // The payroll position already stands for its function, with its own active flag
    jobFunctions: validData.jobFunctions.filter(
      ({ jobFunctionId }) => jobFunctionId !== payrollFunction?.id
    )
  })
  if (!user) {
    throw new NotFoundError({
      message: 'O funcionário não foi encontrado.',
      cause: `User ${validData.id} not found in company ${validData.companyId}`
    })
  }
  return user
}

export const userModel = {
  createMany,
  findByAuthUserId,
  findManyByCompanyId,
  findManyWithOrganization,
  update,
  updateMany
}
