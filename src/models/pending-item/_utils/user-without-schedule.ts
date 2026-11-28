import type { TPendingItemDetector } from '../types'

export const detectUsersWithoutSchedule: TPendingItemDetector = ({
  today,
  users,
  shiftDays
}) =>
  users
    .filter((user) => {
      const day = shiftDays
        .find(({ userId }) => userId === user.id)
        ?.days.find(({ date }) => date === today)
      return !day || day.kind === 'unassigned'
    })
    .map((user) => ({
      key: `user-without-schedule:${user.id}`,
      type: 'user-without-schedule',
      user
    }))
