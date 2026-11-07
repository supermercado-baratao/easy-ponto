import { database } from '@/infra/database/client'
import type {
  Schedule,
  ScheduleDay,
  TInputData,
  TScheduleWithDays
} from '@/infra/database/types'

type TScheduleSaveData = TInputData<Schedule> & {
  days: Omit<TInputData<ScheduleDay>, 'scheduleId'>[]
}

const schedules = database.orm.public.Schedule

export const scheduleRepository = {
  findInEffect: async ({
    userId,
    date
  }: {
    userId: string
    date: string
  }): Promise<TScheduleWithDays | null> =>
    await schedules
      .where({ userId })
      .where((schedule) => schedule.startDate.lte(date))
      .include('days', (days) => days.orderBy((day) => day.weekday.asc()))
      .orderBy((schedule) => schedule.startDate.desc())
      .first(),

  save: async ({
    userId,
    startDate,
    days
  }: TScheduleSaveData): Promise<TScheduleWithDays> =>
    await database.transaction(async (tx) => {
      const txSchedules = tx.orm.public.Schedule
      const { id } =
        (await txSchedules
          .where({ userId, startDate })
          .update({ startDate })) ??
        (await txSchedules.create({ userId, startDate }))
      await tx.orm.public.ScheduleDay.where({ scheduleId: id }).deleteAll()
      await tx.orm.public.ScheduleDay.createAndCount(
        days.map((day) => ({ ...day, scheduleId: id }))
      )
      return await txSchedules
        .where({ id })
        .include('days', (days) => days.orderBy((day) => day.weekday.asc()))
        .firstOrThrow()
    })
}
