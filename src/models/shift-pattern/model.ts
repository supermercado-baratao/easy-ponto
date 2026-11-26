import { z } from 'zod'

import type {
  ShiftPattern,
  TShiftPatternWithVersions
} from '@/infra/database/types'
import { shiftPatternRepository } from '@/repositories/shift-pattern-repository'

import {
  LastShiftPatternVersionError,
  ShiftPatternNotFoundError,
  ShiftPatternVersionNotFoundError
} from './errors'
import {
  createSchema,
  findManyByCompanyIdSchema,
  removeSchema,
  updateSchema
} from './schema'
import type {
  TShiftPatternCreateData,
  TShiftPatternRemoveParams,
  TShiftPatternUpdateData
} from './types'
import { isSameShiftPatternName } from './utils'

const throwFieldError = (
  path: 'name' | 'startDate',
  message: string,
  input: string
): never => {
  throw new z.ZodError([{ code: 'custom', path: [path], message, input }])
}

const assertUniqueName = async ({
  id,
  companyId,
  name
}: Pick<ShiftPattern, 'companyId' | 'name'> & {
  id?: string
}): Promise<void> => {
  const shiftPatterns =
    await shiftPatternRepository.findManyByCompanyId(companyId)
  if (
    shiftPatterns.some(
      (shiftPattern) =>
        isSameShiftPatternName(shiftPattern.name, name) &&
        shiftPattern.id !== id
    )
  )
    throwFieldError('name', 'Já existe uma escala com esse nome', name)
}

const findManyByCompanyId = async (
  companyId: string
): Promise<TShiftPatternWithVersions[]> =>
  await shiftPatternRepository.findManyByCompanyId(
    findManyByCompanyIdSchema.parse(companyId)
  )

const create = async (
  data: TShiftPatternCreateData
): Promise<TShiftPatternWithVersions> => {
  const validData = createSchema.parse(data)
  await assertUniqueName(validData)
  return await shiftPatternRepository.create(validData)
}

const update = async (
  data: TShiftPatternUpdateData
): Promise<TShiftPatternWithVersions> => {
  const validData = updateSchema.parse(data)
  const { id, companyId, version } = validData
  const shiftPattern = await shiftPatternRepository.findUnique({
    id,
    companyId
  })
  if (!shiftPattern) {
    throw new ShiftPatternNotFoundError(
      `ShiftPattern ${id} not found in company ${companyId}`
    )
  }
  if (
    version.id &&
    shiftPattern.versions.every(({ id }) => id !== version.id)
  ) {
    throw new ShiftPatternVersionNotFoundError(
      `ShiftPatternVersion ${version.id} not found in ShiftPattern ${id}`
    )
  }
  await assertUniqueName(validData)
  if (
    shiftPattern.versions.some(
      ({ id, startDate }) =>
        startDate === version.startDate && id !== version.id
    )
  ) {
    throwFieldError(
      'startDate',
      'Já existe uma versão com essa data',
      version.startDate
    )
  }
  return await shiftPatternRepository.update(validData)
}

const removeVersion = async (
  params: TShiftPatternRemoveParams
): Promise<TShiftPatternWithVersions> => {
  const { id, companyId } = removeSchema.parse(params)
  const shiftPattern = await shiftPatternRepository.findUniqueByVersionId({
    versionId: id,
    companyId
  })
  if (!shiftPattern) {
    throw new ShiftPatternVersionNotFoundError(
      `ShiftPatternVersion ${id} not found in company ${companyId}`
    )
  }
  if (shiftPattern.versions.length === 1) {
    throw new LastShiftPatternVersionError(shiftPattern.name)
  }
  await shiftPatternRepository.removeVersion(id)
  return {
    ...shiftPattern,
    versions: shiftPattern.versions.filter((version) => version.id !== id)
  }
}

const remove = async (
  params: TShiftPatternRemoveParams
): Promise<ShiftPattern> => {
  const validParams = removeSchema.parse(params)
  const shiftPattern = await shiftPatternRepository.remove(validParams)
  if (!shiftPattern) {
    throw new ShiftPatternNotFoundError(
      `ShiftPattern ${validParams.id} not found in company ${validParams.companyId}`
    )
  }
  return shiftPattern
}

export const shiftPatternModel = {
  findManyByCompanyId,
  create,
  update,
  removeVersion,
  remove
}
