import type { Dayjs } from 'dayjs'

import type { PunchRecord } from '@/infra/database/types'
import { dayjs, wallClockNow } from '@/infra/dayjs'

import type { TPunchRecordDay, TPunchRecordPeriod } from './types'

const DATE_FORMAT = 'YYYY-MM-DD'

const isDate = (value: string | null | undefined): value is string =>
  !!value &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  dayjs(value).format(DATE_FORMAT) === value

export const resolvePeriod = (
  { initialDate, finalDate }: Partial<TPunchRecordPeriod>,
  now: Dayjs = wallClockNow()
): TPunchRecordPeriod => {
  const dates = [
    isDate(initialDate)
      ? initialDate
      : now.startOf('month').format(DATE_FORMAT),
    isDate(finalDate) ? finalDate : now.format(DATE_FORMAT)
  ].toSorted((first, second) => first.localeCompare(second))
  return { initialDate: dates[0], finalDate: dates[1] }
}

export const groupByDay = (
  punchRecords: PunchRecord[],
  { initialDate, finalDate }: TPunchRecordPeriod
): TPunchRecordDay[] => {
  const recordsByDay = Map.groupBy(
    punchRecords.toSorted(
      (first, second) => first.datetime.getTime() - second.datetime.getTime()
    ),
    (record) => dayjs(record.datetime).format(DATE_FORMAT)
  )

  const days: TPunchRecordDay[] = []
  const lastDay = dayjs(finalDate)
  for (let day = dayjs(initialDate); !day.isAfter(lastDay);) {
    const date = day.format(DATE_FORMAT)
    days.push({ date, punchRecords: recordsByDay.get(date) ?? [] })
    day = day.add(1, 'day')
  }
  return days
}
