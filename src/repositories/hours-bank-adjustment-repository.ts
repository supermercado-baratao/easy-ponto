import { database } from '@/infra/database/client'
import type { HoursBankAdjustment, TInputData } from '@/infra/database/types'

const adjustments = database.orm.public.HoursBankAdjustment

export const hoursBankAdjustmentRepository = {
  findUniqueById: async (id: string): Promise<HoursBankAdjustment | null> =>
    await adjustments.first({ id }),

  findManyInPeriod: async ({
    userIds,
    initialDate,
    finalDate
  }: {
    userIds: string[]
    initialDate: string
    finalDate: string
  }): Promise<HoursBankAdjustment[]> =>
    await adjustments
      .where((adjustment) => adjustment.userId.in(userIds))
      .where((adjustment) => adjustment.date.gte(initialDate))
      .where((adjustment) => adjustment.date.lte(finalDate))
      .orderBy((adjustment) => adjustment.date.asc())
      .all(),

  create: async (
    data: TInputData<HoursBankAdjustment>
  ): Promise<HoursBankAdjustment> => await adjustments.create(data),

  update: async ({
    id,
    ...data
  }: TInputData<HoursBankAdjustment> & {
    id: string
  }): Promise<HoursBankAdjustment | null> =>
    await adjustments.where({ id }).update(data),

  remove: async (id: string): Promise<HoursBankAdjustment | null> =>
    await adjustments.where({ id }).delete()
}
