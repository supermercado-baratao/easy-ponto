import { z } from 'zod'

import type { Justification, VacationPlan } from '@/infra/database/types'
import { wallClockNow } from '@/infra/dayjs'
import { yearSchema } from '@/models/holiday/schema'
import { justificationModel } from '@/models/justification/model'
import { INACTIVE_USER_STATUSES, type TUserStatus } from '@/models/user/utils'
import { userRepository } from '@/repositories/user-repository'
import { vacationPlanRepository } from '@/repositories/vacation-plan-repository'

import {
  findManyByYearSchema,
  registerJustificationSchema,
  saveSchema
} from './schema'
import type {
  TVacationPlanFindManyByYearParams,
  TVacationPlanRegisterJustificationData,
  TVacationPlanRow,
  TVacationPlanSaveData
} from './types'
import { canChangeMonth } from './utils'

const assertUserInCompany = async (
  userId: string,
  companyId: string
): Promise<void> => {
  const user = await userRepository.findUniqueById(userId)
  if (user?.companyId !== companyId) {
    throw new Error(`User ${userId} not found in company ${companyId}`)
  }
}

const resolveYear = (year?: string): number =>
  yearSchema.safeParse(year).data ?? wallClockNow().year()

const findManyByYear = async (
  params: TVacationPlanFindManyByYearParams
): Promise<TVacationPlanRow[]> => {
  const { companyId, year } = findManyByYearSchema.parse(params)
  const users = await userRepository.findManyByCompanyId(companyId)
  const plans = await vacationPlanRepository.findManyByYear({
    userIds: users.map(({ id }) => id),
    year
  })
  return users
    .map((user) => ({
      user,
      plan: plans.find(({ userId }) => userId === user.id) ?? null
    }))
    .filter(
      ({ user, plan }) =>
        plan || !INACTIVE_USER_STATUSES.includes(user.status as TUserStatus)
    )
}

const save = async (
  data: TVacationPlanSaveData
): Promise<VacationPlan | null> => {
  const { companyId, userId, year, month } = saveSchema.parse(data)
  await assertUserInCompany(userId, companyId)
  const plan = await vacationPlanRepository.findUnique({ userId, year })
  if (!canChangeMonth(plan, month)) {
    throw new z.ZodError([
      {
        code: 'custom',
        path: ['month'],
        message:
          'As férias desse ano já foram registradas. Remova a justificativa nos registros de ponto para mudar o mês',
        input: month
      }
    ])
  }

  if (month === null) {
    if (plan) await vacationPlanRepository.remove(plan.id)
    return null
  }
  if (!plan) {
    return await vacationPlanRepository.create({
      userId,
      year,
      month,
      justificationId: null
    })
  }
  return await vacationPlanRepository.update({ id: plan.id, month })
}

const registerJustification = async ({
  typeId,
  startDate,
  endDate,
  note,
  ...params
}: TVacationPlanRegisterJustificationData): Promise<Justification> => {
  const { companyId, userId, year } = registerJustificationSchema.parse(params)
  const plan = await vacationPlanRepository.findUnique({ userId, year })
  if (!plan) {
    throw new Error(`User ${userId} has no vacation planned in ${year}`)
  }
  if (plan.justificationId) {
    throw new Error(
      `The vacation of user ${userId} in ${year} is already registered`
    )
  }

  const justification = await justificationModel.create({
    companyId,
    userId,
    typeId,
    startDate,
    endDate,
    startTime: '',
    endTime: '',
    note
  })
  await vacationPlanRepository.update({
    id: plan.id,
    justificationId: justification.id
  })
  return justification
}

export const vacationPlanModel = {
  resolveYear,
  findManyByYear,
  save,
  registerJustification
}
