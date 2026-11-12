import { z } from 'zod'

import type {
  Justification,
  TJustificationWithType
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { justificationRepository } from '@/repositories/justification-repository'
import { justificationTypeRepository } from '@/repositories/justification-type-repository'
import { userRepository } from '@/repositories/user-repository'

import {
  createSchema,
  findManyInPeriodSchema,
  removeSchema,
  updateSchema
} from './schema'
import type {
  TJustificationCreateData,
  TJustificationFindManyInPeriodParams,
  TJustificationRemoveParams,
  TJustificationUpdateData
} from './types'
import { findOverlappingJustification } from './utils'

type TValidData = z.infer<typeof createSchema> & { id?: string }

const assertUserInCompany = async (
  userId: string,
  companyId: string
): Promise<void> => {
  const user = await userRepository.findUniqueById(userId)
  if (user?.companyId !== companyId) {
    throw new Error(`User ${userId} not found in company ${companyId}`)
  }
}

const assertSavable = async ({
  id,
  companyId,
  ...justification
}: TValidData): Promise<void> => {
  await assertUserInCompany(justification.userId, companyId)
  const type = await justificationTypeRepository.findUnique({
    id: justification.typeId,
    companyId
  })
  if (!type) {
    throw new Error(
      `JustificationType ${justification.typeId} not found in company ${companyId}`
    )
  }

  const justifications = await justificationRepository.findManyInPeriod({
    userId: justification.userId,
    initialDate: justification.startDate,
    finalDate: justification.endDate
  })
  const overlapping = findOverlappingJustification(
    justification,
    justifications.filter((other) => other.id !== id)
  )
  if (!overlapping) return

  throw new z.ZodError([
    {
      code: 'custom',
      path: ['startDate'],
      message: `Já existe uma justificativa nesse período: ${overlapping.type.code} (${dayjs(overlapping.startDate).format('DD/MM/YYYY')})`,
      input: justification.startDate
    }
  ])
}

const findOwned = async ({
  id,
  companyId
}: {
  id: string
  companyId: string
}): Promise<Justification> => {
  const justification = await justificationRepository.findUniqueById(id)
  if (justification) {
    const user = await userRepository.findUniqueById(justification.userId)
    if (user?.companyId === companyId) return justification
  }
  throw new Error(`Justification ${id} not found in company ${companyId}`)
}

const findManyInPeriod = async (
  params: TJustificationFindManyInPeriodParams
): Promise<TJustificationWithType[]> =>
  await justificationRepository.findManyInPeriod(
    findManyInPeriodSchema.parse(params)
  )

const create = async (
  data: TJustificationCreateData
): Promise<Justification> => {
  const { companyId, ...validData } = createSchema.parse(data)
  await assertSavable({ companyId, ...validData })
  return await justificationRepository.create(validData)
}

const update = async (
  data: TJustificationUpdateData
): Promise<Justification> => {
  const { companyId, ...validData } = updateSchema.parse(data)
  await findOwned({ id: validData.id, companyId })
  await assertSavable({ companyId, ...validData })
  const justification = await justificationRepository.update(validData)
  if (!justification) {
    throw new Error(`Justification ${validData.id} not found`)
  }
  return justification
}

const remove = async (
  params: TJustificationRemoveParams
): Promise<Justification> => {
  const justification = await findOwned(removeSchema.parse(params))
  await justificationRepository.remove(justification.id)
  return justification
}

export const justificationModel = { findManyInPeriod, create, update, remove }
