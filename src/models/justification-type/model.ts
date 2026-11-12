import { z } from 'zod'

import type { JustificationType } from '@/infra/database/types'
import { justificationRepository } from '@/repositories/justification-repository'
import { justificationTypeRepository } from '@/repositories/justification-type-repository'

import { JustificationTypeInUseError } from './errors'
import {
  createSchema,
  findManyByCompanyIdSchema,
  removeSchema,
  updateSchema
} from './schema'
import type {
  TJustificationTypeCreateData,
  TJustificationTypeRemoveParams,
  TJustificationTypeUpdateData
} from './types'

const assertUniqueCode = async ({
  id,
  companyId,
  code
}: Pick<JustificationType, 'companyId' | 'code'> & {
  id?: string
}): Promise<void> => {
  const types = await justificationTypeRepository.findManyByCompanyId(companyId)
  if (types.every((type) => type.code !== code || type.id === id)) return

  throw new z.ZodError([
    {
      code: 'custom',
      path: ['code'],
      message: 'Já existe um tipo com esse código',
      input: code
    }
  ])
}

const findManyByCompanyId = async (
  companyId: string
): Promise<JustificationType[]> =>
  await justificationTypeRepository.findManyByCompanyId(
    findManyByCompanyIdSchema.parse(companyId)
  )

const create = async (
  data: TJustificationTypeCreateData
): Promise<JustificationType> => {
  const validData = createSchema.parse(data)
  await assertUniqueCode(validData)
  return await justificationTypeRepository.create(validData)
}

const update = async (
  data: TJustificationTypeUpdateData
): Promise<JustificationType> => {
  const validData = updateSchema.parse(data)
  await assertUniqueCode(validData)
  const type = await justificationTypeRepository.update(validData)
  if (!type) {
    throw new Error(
      `JustificationType ${validData.id} not found in company ${validData.companyId}`
    )
  }
  return type
}

const remove = async (
  params: TJustificationTypeRemoveParams
): Promise<JustificationType> => {
  const validParams = removeSchema.parse(params)
  const type = await justificationTypeRepository.findUnique(validParams)
  if (!type) {
    throw new Error(
      `JustificationType ${validParams.id} not found in company ${validParams.companyId}`
    )
  }
  if (await justificationRepository.existsByTypeId(type.id)) {
    throw new JustificationTypeInUseError(type.code)
  }
  await justificationTypeRepository.remove(validParams)
  return type
}

export const justificationTypeModel = {
  findManyByCompanyId,
  create,
  update,
  remove
}
