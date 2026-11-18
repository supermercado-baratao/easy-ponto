import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { vacationPlans } from '@/infra/database/schema'
import type {
  TInputData,
  TVacationPlanWithJustification,
  VacationPlan
} from '@/infra/database/types'

export const vacationPlanRepository = {
  findManyByYear: async ({
    userIds,
    year
  }: {
    userIds: string[]
    year: number
  }): Promise<TVacationPlanWithJustification[]> =>
    await database.query.vacationPlans.findMany({
      where: { userId: { in: userIds }, year },
      with: { justification: { with: { type: true } } }
    }),

  findUnique: async ({
    userId,
    year
  }: {
    userId: string
    year: number
  }): Promise<VacationPlan | null> =>
    (await database.query.vacationPlans.findFirst({
      where: { userId, year }
    })) ?? null,

  create: async (data: TInputData<VacationPlan>): Promise<VacationPlan> => {
    const [plan] = await database.insert(vacationPlans).values(data).returning()
    return plan
  },

  update: async ({
    id,
    ...data
  }: Partial<TInputData<VacationPlan>> & {
    id: string
  }): Promise<VacationPlan | null> => {
    const [plan = null] = await database
      .update(vacationPlans)
      .set(data)
      .where(eq(vacationPlans.id, id))
      .returning()
    return plan
  },

  remove: async (id: string): Promise<VacationPlan | null> => {
    const [plan = null] = await database
      .delete(vacationPlans)
      .where(eq(vacationPlans.id, id))
      .returning()
    return plan
  }
}
