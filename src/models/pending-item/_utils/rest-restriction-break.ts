import { findRestBreaks } from '@/models/rest-restriction/utils'

import type { TPendingItem, TPendingItemDetector } from '../types'

// A limit is broken by the day, not by one employee, so its item gathers everyone off on that date
export const detectRestRestrictionBreaks: TPendingItemDetector = ({
  users,
  restDays,
  restRestrictions
}) => {
  const usersById = new Map(users.map((user) => [user.id, user]))
  const items = new Map<
    string,
    Extract<TPendingItem, { type: 'rest-restriction-break' }>
  >()
  const breaks = findRestBreaks({
    restrictions: restRestrictions,
    users: restDays.filter(({ userId }) => usersById.has(userId))
  })
  for (const { userId, date, restriction } of breaks) {
    const key = `rest-restriction-break:${restriction.id}:${date}`
    const item = items.get(key) ?? {
      key,
      type: 'rest-restriction-break' as const,
      users: [],
      date,
      restriction
    }
    item.users.push(usersById.get(userId)!)
    items.set(key, item)
  }
  return items
    .values()
    .map((item) => ({
      ...item,
      users: item.users.toSorted((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR')
      )
    }))
    .toArray()
    .toSorted((a, b) => a.date.localeCompare(b.date))
}
