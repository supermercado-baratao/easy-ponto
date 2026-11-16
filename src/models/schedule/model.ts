import type { TScheduleWithDays } from '@/infra/database/types'
import { scheduleRepository } from '@/repositories/schedule-repository'
import { userRepository } from '@/repositories/user-repository'

import {
  findInEffectParamsSchema,
  findManyInEffectByCompanyIdParamsSchema,
  findManyInPeriodParamsSchema,
  saveSchema
} from './schema'
import type {
  TScheduleFindInEffectParams,
  TScheduleFindManyInEffectByCompanyIdParams,
  TScheduleFindManyInPeriodParams,
  TScheduleSaveData,
  TUserSchedule
} from './types'
import { selectInEffectSince } from './utils'

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
  return selectInEffectSince(schedules, initialDate)
}

const findManyInEffectByCompanyId = async (
  params: TScheduleFindManyInEffectByCompanyIdParams
): Promise<TUserSchedule[]> => {
  const { companyId, date } =
    findManyInEffectByCompanyIdParamsSchema.parse(params)
  const users = await userRepository.findManyByCompanyId(companyId)
  const schedules = await scheduleRepository.findManyStartedUntilByUserIds({
    userIds: users.map(({ id }) => id),
    date
  })
  return users.map((user) => ({
    user,
    schedule: schedules.find(({ userId }) => userId === user.id) ?? null
  }))
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

export const scheduleModel = {
  findInEffect,
  findManyInEffectByCompanyId,
  findManyInPeriod,
  save
}
