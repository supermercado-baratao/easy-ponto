import type { User } from '@/infra/database/types'
import type { TScheduleAlertLimits } from '@/models/journey/types'
import { summarizeScheduleDay } from '@/models/journey/utils'
import type { TUserShiftDays } from '@/models/shift-assignment/types'
import { MINUTES_PER_DAY } from '@/models/shift-pattern/utils'

import type { TAgendaDay, TAgendaRow } from './types'

export const buildAgendaRow = ({
  user,
  shiftDays,
  limits
}: {
  user: User
  shiftDays: Pick<TUserShiftDays, 'assignments' | 'days'> | undefined
  limits: TScheduleAlertLimits
}): TAgendaRow => {
  const days = shiftDays?.days ?? []
  const firstDate = days[0]?.date ?? ''
  const lastDate = days.at(-1)?.date ?? ''
  return {
    user,
    shiftPatternNames: [
      ...new Set(
        (shiftDays?.assignments ?? [])
          .filter(
            ({ startDate, endDate }) =>
              startDate <= lastDate &&
              (endDate === null || endDate >= firstDate)
          )
          .map(({ shiftPattern }) => shiftPattern.name)
      )
    ],
    days: days.every(({ kind }) => kind === 'unassigned')
      ? null
      : days.map(({ date, kind, adjusted, pairs }) => ({
          date,
          kind,
          adjusted,
          ...summarizeScheduleDay(pairs, limits)
        }))
  }
}

const isSameTime = (first: number, second: number): boolean =>
  first % MINUTES_PER_DAY === second % MINUTES_PER_DAY

export const hasEntryOrExitAt = (
  days: Pick<TAgendaDay, 'pairs'>[] | null,
  minutes: number
): boolean =>
  !!days?.some(({ pairs }) => {
    const first = pairs[0]?.entry
    const last = pairs.at(-1)?.exit
    return (
      (first !== undefined && isSameTime(first, minutes)) ||
      (last !== undefined && isSameTime(last, minutes))
    )
  })
