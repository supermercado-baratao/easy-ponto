import type { TScheduleWithDays } from '@/infra/database/types'
import { scheduleRepository } from '@/repositories/schedule-repository'
import { userRepository } from '@/repositories/user-repository'

import {
  findInEffectParamsSchema,
  findManyInPeriodParamsSchema,
  saveSchema
} from './schema'
import type {
  TScheduleFindInEffectParams,
  TScheduleFindManyInPeriodParams,
  TScheduleSaveData
} from './types'

const findInEffect = async (
  params: TScheduleFindInEffectParams
): Promise<TScheduleWithDays | null> =>
  await scheduleRepository.findInEffect(findInEffectParamsSchema.parse(params))

const findManyInPeriod = async (
  params: TScheduleFindManyInPeriodParams
): Promise<TScheduleWithDays[]> => {
  const { userId, initialDate, finalDate } =
    findManyInPeriodParamsSchema.parse(params)
  const schedules = await scheduleRepository.findManyStartedUntil({
    userId,
    date: finalDate
  })
  const firstInEffectIndex = schedules.findIndex(
    ({ startDate }) => startDate <= initialDate
  )
  return firstInEffectIndex === -1
    ? schedules
    : schedules.slice(0, firstInEffectIndex + 1)
}

const save = async (data: TScheduleSaveData): Promise<TScheduleWithDays> => {
  const { companyId, ...validData } = saveSchema.parse(data)
  const user = await userRepository.findUniqueById(validData.userId)
  if (user?.companyId !== companyId) {
    throw new Error(
      `User ${validData.userId} not found in company ${companyId}`
    )
  }
  return await scheduleRepository.save(validData)
}

export const scheduleModel = { findInEffect, findManyInPeriod, save }
