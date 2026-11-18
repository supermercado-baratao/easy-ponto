import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { hoursBankAdjustments } from '@/infra/database/schema'
import type { HoursBankAdjustment, TInputData } from '@/infra/database/types'

export const hoursBankAdjustmentRepository = {
  findUniqueById: async (id: string): Promise<HoursBankAdjustment | null> =>
    (await database.query.hoursBankAdjustments.findFirst({ where: { id } })) ??
    null,

  findManyInPeriod: async ({
    userIds,
    initialDate,
    finalDate
  }: {
    userIds: string[]
    initialDate: string
    finalDate: string
  }): Promise<HoursBankAdjustment[]> =>
    await database.query.hoursBankAdjustments.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: initialDate, lte: finalDate }
      },
      orderBy: { date: 'asc' }
    }),

  create: async (
    data: TInputData<HoursBankAdjustment>
  ): Promise<HoursBankAdjustment> => {
    const [adjustment] = await database
      .insert(hoursBankAdjustments)
      .values(data)
      .returning()
    return adjustment
  },

  update: async ({
    id,
    ...data
  }: TInputData<HoursBankAdjustment> & {
    id: string
  }): Promise<HoursBankAdjustment | null> => {
    const [adjustment = null] = await database
      .update(hoursBankAdjustments)
      .set(data)
      .where(eq(hoursBankAdjustments.id, id))
      .returning()
    return adjustment
  },

  remove: async (id: string): Promise<HoursBankAdjustment | null> => {
    const [adjustment = null] = await database
      .delete(hoursBankAdjustments)
      .where(eq(hoursBankAdjustments.id, id))
      .returning()
    return adjustment
  }
}
