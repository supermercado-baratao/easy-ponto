import { z } from 'zod'

import type { JustificationType } from '@/infra/database/types'
import { NotFoundError } from '@/infra/errors'
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
import { isSameTypeName } from './utils'

const assertUniqueName = async ({
  id,
  companyId,
  name
}: Pick<JustificationType, 'companyId' | 'name'> & {
  id?: string
}): Promise<void> => {
  const types = await justificationTypeRepository.findManyByCompanyId(companyId)
  if (types.every((type) => !isSameTypeName(type.name, name) || type.id === id))
    return

  throw new z.ZodError([
    {
      code: 'custom',
      path: ['name'],
      message: 'Já existe um tipo com esse nome',
      input: name
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
  await assertUniqueName(validData)
  return await justificationTypeRepository.create(validData)
}

const update = async (
  data: TJustificationTypeUpdateData
): Promise<JustificationType> => {
  const validData = updateSchema.parse(data)
  await assertUniqueName(validData)
  const type = await justificationTypeRepository.update(validData)
  if (!type) {
    throw new NotFoundError({
      message: 'O tipo de justificativa não foi encontrado.',
      cause: `JustificationType ${validData.id} not found in company ${validData.companyId}`
    })
  }
  return type
}

const remove = async (
  params: TJustificationTypeRemoveParams
): Promise<JustificationType> => {
  const validParams = removeSchema.parse(params)
  const type = await justificationTypeRepository.findUnique(validParams)
  if (!type) {
    throw new NotFoundError({
      message: 'O tipo de justificativa não foi encontrado.',
      cause: `JustificationType ${validParams.id} not found in company ${validParams.companyId}`
    })
  }
  if (await justificationRepository.existsByTypeId(type.id)) {
    throw new JustificationTypeInUseError(type.name)
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
