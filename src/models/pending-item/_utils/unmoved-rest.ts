import { findUnmovedRests } from '@/models/rest-rule/utils'

import type { TPendingItem, TPendingItemDetector } from '../types'

export const detectUnmovedRests: TPendingItemDetector = ({
  users,
  restRules,
  restDays,
  isHoliday
}) => {
  const usersById = new Map(users.map((user) => [user.id, user]))
  return findUnmovedRests({
    rules: restRules,
    users: restDays.filter(({ userId }) => usersById.has(userId)),
    isHoliday
  })
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .map(
      ({ userId, date, ruleName }) =>
        ({
          key: `unmoved-rest:${userId}:${date}`,
          type: 'unmoved-rest',
          user: usersById.get(userId)!,
          date,
          ruleName
        }) satisfies TPendingItem
    )
}
