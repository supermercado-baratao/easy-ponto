import type { TScheduleWithDays } from '@/infra/database/types'

export const WEEKDAYS = [
  { key: 'monday', weekday: 1 },
  { key: 'tuesday', weekday: 2 },
  { key: 'wednesday', weekday: 3 },
  { key: 'thursday', weekday: 4 },
  { key: 'friday', weekday: 5 },
  { key: 'saturday', weekday: 6 },
  { key: 'sunday', weekday: 0 }
] as const

export const TIME_PAIRS = [
  { entry: 'entry1', exit: 'exit1' },
  { entry: 'entry2', exit: 'exit2' },
  { entry: 'entry3', exit: 'exit3' }
] as const

export type TWeekdayKey = (typeof WEEKDAYS)[number]['key']

export type TScheduleTimeField = (typeof TIME_PAIRS)[number]['entry' | 'exit']

export type TScheduleTimeFieldName =
  `${TWeekdayKey}${Capitalize<TScheduleTimeField>}`

export const TIME_FIELDS: TScheduleTimeField[] = TIME_PAIRS.flatMap(
  ({ entry, exit }) => [entry, exit]
)

export const getTimeFieldName = (
  weekdayKey: TWeekdayKey,
  field: TScheduleTimeField
): TScheduleTimeFieldName =>
  `${weekdayKey}${field.charAt(0).toUpperCase()}${field.slice(1)}` as TScheduleTimeFieldName

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const minutesToTime = (minutes: number): string => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`
}

export const selectInEffectSince = (
  schedulesByStartDateDesc: TScheduleWithDays[],
  date: string
): TScheduleWithDays[] => {
  const firstInEffectIndex = schedulesByStartDateDesc.findIndex(
    ({ startDate }) => startDate <= date
  )
  return firstInEffectIndex === -1
    ? schedulesByStartDateDesc
    : schedulesByStartDateDesc.slice(0, firstInEffectIndex + 1)
}
