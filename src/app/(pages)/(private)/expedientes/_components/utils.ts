import type { TScheduleAlert } from '@/models/journey/types'
import {
  MAX_CONTINUOUS_WORK,
  MAX_DAILY_JOURNEY,
  MAX_LUNCH,
  summarizeScheduleDay
} from '@/models/journey/utils'
import type { TUserSchedule } from '@/models/schedule/types'
import { WEEKDAYS } from '@/models/schedule/utils'

import type { TAgendaRow } from './types'

export const ALERT_LABELS: Record<TScheduleAlert, string> = {
  'long-lunch': `Almoço acima de ${MAX_LUNCH / 60}h`,
  'long-journey': `Jornada acima de ${MAX_DAILY_JOURNEY / 60}h`,
  'long-continuous-work': `Mais de ${MAX_CONTINUOUS_WORK / 60}h sem intervalo`
}

export const buildAgendaRow = ({
  user,
  schedule
}: TUserSchedule): TAgendaRow => ({
  user,
  days: schedule
    ? WEEKDAYS.map(({ key, weekday }) => ({
        key,
        ...summarizeScheduleDay(
          schedule.days.find((day) => day.weekday === weekday)
        )
      }))
    : null
})
