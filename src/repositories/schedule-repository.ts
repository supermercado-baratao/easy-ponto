import { eq } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import { schedules, schedulesDays } from '@/infra/database/schema'
import type {
  Schedule,
  ScheduleDay,
  TInputData,
  TScheduleWithDays
} from '@/infra/database/types'

type TScheduleSaveData = TInputData<Schedule> & {
  days: Omit<TInputData<ScheduleDay>, 'scheduleId'>[]
}

const withDays = { days: { orderBy: { weekday: 'asc' } } } as const

export const scheduleRepository = {
  findInEffect: async ({
    userId,
    date
  }: {
    userId: string
    date: string
  }): Promise<TScheduleWithDays | null> =>
    (await database.query.schedules.findFirst({
      where: { userId, startDate: { lte: date } },
      with: withDays,
      orderBy: { startDate: 'desc' }
    })) ?? null,

  findManyStartedUntil: async ({
    userId,
    date
  }: {
    userId: string
    date: string
  }): Promise<TScheduleWithDays[]> =>
    await database.query.schedules.findMany({
      where: { userId, startDate: { lte: date } },
      with: withDays,
      orderBy: { startDate: 'desc' }
    }),

  findManyStartedUntilByUserIds: async ({
    userIds,
    date
  }: {
    userIds: string[]
    date: string
  }): Promise<TScheduleWithDays[]> =>
    await database.query.schedules.findMany({
      where: { userId: { in: userIds }, startDate: { lte: date } },
      with: withDays,
      orderBy: { startDate: 'desc' }
    }),

  save: async (
    { userId, startDate, days }: TScheduleSaveData,
    transaction?: TTransaction
  ): Promise<TScheduleWithDays> =>
    await runInTransaction(transaction, async (tx) => {
      const [{ id }] = await tx
        .insert(schedules)
        .values({ userId, startDate })
        .onConflictDoUpdate({
          target: [schedules.userId, schedules.startDate],
          set: { startDate }
        })
        .returning({ id: schedules.id })

      await tx.delete(schedulesDays).where(eq(schedulesDays.scheduleId, id))
      if (days.length > 0) {
        await tx
          .insert(schedulesDays)
          .values(days.map((day) => ({ ...day, scheduleId: id })))
      }

      const schedule = await tx.query.schedules.findFirst({
        where: { id },
        with: withDays
      })
      if (!schedule) throw new Error(`Schedule ${id} not found`)
      return schedule
    })
}
