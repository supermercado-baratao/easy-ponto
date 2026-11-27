import { z } from 'zod'

import type { JobFunction, UserJobFunction } from '@/infra/database/types'
import { jobFunctionRepository } from '@/repositories/job-function-repository'
import { userRepository } from '@/repositories/user-repository'

import { JobFunctionInUseError, JobFunctionNotFoundError } from './errors'
import {
  companyIdSchema,
  createSchema,
  removeSchema,
  updateSchema
} from './schema'
import type {
  TJobFunctionCreateData,
  TJobFunctionRemoveParams,
  TJobFunctionUpdateData
} from './types'
import {
  getMissingPayrollPositions,
  isSameFunctionName,
  MIN_JOB_FUNCTION_LEVEL
} from './utils'

const assertUniqueName = async ({
  id,
  companyId,
  name
}: Pick<JobFunction, 'companyId' | 'name'> & {
  id?: string
}): Promise<void> => {
  const functions = await jobFunctionRepository.findManyByCompanyId(companyId)
  if (
    functions.every(
      (jobFunction) =>
        !isSameFunctionName(jobFunction.name, name) || jobFunction.id === id
    )
  )
    return

  throw new z.ZodError([
    {
      code: 'custom',
      path: ['name'],
      message: 'Já existe uma função com esse nome',
      input: name
    }
  ])
}

const findManyByCompanyId = async (companyId: string): Promise<JobFunction[]> =>
  await jobFunctionRepository.findManyByCompanyId(
    companyIdSchema.parse(companyId)
  )

const findUserFunctionsByCompanyId = async (
  companyId: string
): Promise<Pick<UserJobFunction, 'userId' | 'jobFunctionId' | 'active'>[]> =>
  await jobFunctionRepository.findUserFunctionsByCompanyId(
    companyIdSchema.parse(companyId)
  )

const create = async (data: TJobFunctionCreateData): Promise<JobFunction> => {
  const validData = createSchema.parse(data)
  await assertUniqueName(validData)
  return await jobFunctionRepository.create(validData)
}

const update = async (data: TJobFunctionUpdateData): Promise<JobFunction> => {
  const validData = updateSchema.parse(data)
  await assertUniqueName(validData)
  const jobFunction = await jobFunctionRepository.update(validData)
  if (!jobFunction) {
    throw new JobFunctionNotFoundError(
      `JobFunction ${validData.id} not found in company ${validData.companyId}`
    )
  }
  return jobFunction
}

const remove = async (
  params: TJobFunctionRemoveParams
): Promise<JobFunction> => {
  const validParams = removeSchema.parse(params)
  const jobFunction = await jobFunctionRepository.findUnique(validParams)
  if (!jobFunction) {
    throw new JobFunctionNotFoundError(
      `JobFunction ${validParams.id} not found in company ${validParams.companyId}`
    )
  }
  const users = await jobFunctionRepository.countUsers(jobFunction.id)
  if (users > 0) throw new JobFunctionInUseError(jobFunction.name, users)
  await jobFunctionRepository.remove(validParams)
  return jobFunction
}

const createFromPayrollPositions = async (
  companyId: string
): Promise<JobFunction[]> => {
  const validCompanyId = companyIdSchema.parse(companyId)
  const [users, functions] = await Promise.all([
    userRepository.findManyByCompanyId(validCompanyId),
    jobFunctionRepository.findManyByCompanyId(validCompanyId)
  ])
  return await jobFunctionRepository.createMany(
    getMissingPayrollPositions(
      users.map(({ position }) => position),
      functions
    ).map((name) => ({
      name,
      description: null,
      level: MIN_JOB_FUNCTION_LEVEL,
      companyId: validCompanyId
    }))
  )
}

export const jobFunctionModel = {
  findManyByCompanyId,
  findUserFunctionsByCompanyId,
  create,
  update,
  remove,
  createFromPayrollPositions
}
