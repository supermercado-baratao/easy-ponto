import { summarizeScheduleDay } from '@/models/journey/utils'

import type { TPendingItem, TPendingItemDetector } from '../types'

export const detectScheduleAlerts: TPendingItemDetector = ({
  users,
  shiftDays,
  limits
}) =>
  users
    .flatMap((user) =>
      (shiftDays.find(({ userId }) => userId === user.id)?.days ?? []).flatMap(
        ({ date, pairs }) =>
          summarizeScheduleDay(pairs, limits).alerts.map((alert) => ({
            date,
            item: {
              key: `schedule-alert:${alert}:${user.id}:${date}`,
              type: 'schedule-alert',
              user,
              date,
              alert
            } satisfies TPendingItem
          }))
      )
    )
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .map(({ item }) => item)
