import type { ShiftAssignment } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { toPairs } from '@/models/shift-assignment/utils'
import {
  formatCycleTime,
  isDayOff,
  type TCycleDayTimes
} from '@/models/shift-pattern/utils'

const formatDate = (date: string): string => dayjs(date).format('DD/MM/YYYY')

export const formatAssignmentPeriod = ({
  startDate,
  endDate
}: Pick<ShiftAssignment, 'startDate' | 'endDate'>): string =>
  endDate
    ? `De ${formatDate(startDate)} a ${formatDate(endDate)}`
    : `Desde ${formatDate(startDate)}`

export const formatDayTimes = (day: TCycleDayTimes): string =>
  isDayOff(day)
    ? 'folga'
    : toPairs(day)
        .map(
          ({ entry, exit }) =>
            `${formatCycleTime(entry)} às ${formatCycleTime(exit)}`
        )
        .join(', ')
