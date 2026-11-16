import { database } from '@/infra/database/client'
import type {
  TInputData,
  TVacationPlanWithJustification,
  VacationPlan
} from '@/infra/database/types'

const vacationPlans = database.orm.public.VacationPlan

export const vacationPlanRepository = {
  findManyByYear: async ({
    userIds,
    year
  }: {
    userIds: string[]
    year: number
  }): Promise<TVacationPlanWithJustification[]> =>
    await vacationPlans
      .where((plan) => plan.userId.in(userIds))
      .where({ year })
      .include('justification', (justification) =>
        justification.include('type')
      )
      .all(),

  findUnique: async ({
    userId,
    year
  }: {
    userId: string
    year: number
  }): Promise<VacationPlan | null> =>
    await vacationPlans.first({ userId, year }),

  create: async (data: TInputData<VacationPlan>): Promise<VacationPlan> =>
    await vacationPlans.create(data),

  update: async ({
    id,
    ...data
  }: Partial<TInputData<VacationPlan>> & {
    id: string
  }): Promise<VacationPlan | null> =>
    await vacationPlans.where({ id }).update(data),

  remove: async (id: string): Promise<VacationPlan | null> =>
    await vacationPlans.where({ id }).delete()
}
