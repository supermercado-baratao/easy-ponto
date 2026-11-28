import type {
  TRestRestrictionWithRelations,
  UserGroup,
  UserGroupMember
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import type { TRestConstraintLevel } from '@/models/rest-rule/utils'
import type { TResolvedDay } from '@/models/shift-assignment/utils'
import { getDescendantIds, getGroupLabel } from '@/models/user-group/utils'

export const REST_RESTRICTION_KINDS = ['together', 'group', 'weekdays'] as const

export type TRestRestrictionKind = (typeof REST_RESTRICTION_KINDS)[number]

export type TRestRestrictionSummary = {
  id: string
  kind: TRestRestrictionKind
  level: TRestConstraintLevel
  maxOff: number | null
  weekdays: number[]
  userNames: string[]
  groupName: string | null
}

export type TRestRestrictionInput = TRestRestrictionSummary & {
  userIds: string[]
}

export type TRestOffDays = Map<string, Set<string>>

export type TRestDaysOfUser = { userId: string; days: TResolvedDay[] }

export type TRestRestrictionBreak = {
  userId: string
  date: string
  adjusted: boolean
  restriction: TRestRestrictionSummary
}

// The members of the groups inside it also count, as in the employee filter by group
const getGroupUserIds = (
  groupId: string,
  {
    groups,
    members
  }: {
    groups: Pick<UserGroup, 'id' | 'name' | 'parentId'>[]
    members: Pick<UserGroupMember, 'groupId' | 'userId'>[]
  }
): string[] => {
  const groupIds = getDescendantIds(groups, groupId).add(groupId)
  return [
    ...new Set(
      members
        .filter((member) => groupIds.has(member.groupId))
        .map(({ userId }) => userId)
    )
  ]
}

const sortNames = (names: string[]): string[] =>
  names.toSorted((a, b) => a.localeCompare(b, 'pt-BR'))

export const toRestRestrictionInput = (
  restriction: TRestRestrictionWithRelations,
  organization: {
    groups: Pick<UserGroup, 'id' | 'name' | 'parentId'>[]
    members: Pick<UserGroupMember, 'groupId' | 'userId'>[]
  }
): TRestRestrictionInput => {
  const base = {
    id: restriction.id,
    kind: restriction.kind as TRestRestrictionKind,
    level: restriction.level as TRestConstraintLevel,
    maxOff: restriction.maxOff,
    weekdays: restriction.weekdays
  }
  if (restriction.userGroupId) {
    return {
      ...base,
      userIds: getGroupUserIds(restriction.userGroupId, organization),
      userNames: [],
      groupName: getGroupLabel(organization.groups, restriction.userGroupId)
    }
  }
  if (restriction.user) {
    return {
      ...base,
      userIds: [restriction.user.id],
      userNames: [restriction.user.name],
      groupName: null
    }
  }
  return {
    ...base,
    userIds: restriction.users.map(({ userId }) => userId),
    userNames: sortNames(restriction.users.map(({ user }) => user.name)),
    groupName: null
  }
}

export const toRestRestrictionSummary = ({
  id,
  kind,
  level,
  maxOff,
  weekdays,
  userNames,
  groupName
}: TRestRestrictionInput): TRestRestrictionSummary => ({
  id,
  kind,
  level,
  maxOff,
  weekdays,
  userNames,
  groupName
})

export const getOffDays = (users: TRestDaysOfUser[]): TRestOffDays => {
  const offDays: TRestOffDays = new Map()
  for (const { userId, days } of users) {
    for (const day of days) {
      if (day.kind !== 'off') continue
      const userIds = offDays.get(day.date) ?? new Set<string>()
      userIds.add(userId)
      offDays.set(day.date, userIds)
    }
  }
  return offDays
}

const countOthersOff = (
  { userIds }: Pick<TRestRestrictionInput, 'userIds'>,
  offDays: TRestOffDays,
  userId: string,
  date: string
): number => {
  const off = offDays.get(date)
  return off ? userIds.filter((id) => id !== userId && off.has(id)).length : 0
}

// The employee is counted apart, so the same check answers both a day off already in the schedule and a
// day off still to be moved there
export const findRestrictionBreaks = ({
  restrictions,
  offDays,
  userId,
  date
}: {
  restrictions: TRestRestrictionInput[]
  offDays: TRestOffDays
  userId: string
  date: string
}): TRestRestrictionInput[] =>
  restrictions.filter((restriction) => {
    if (!restriction.userIds.includes(userId)) return false
    if (restriction.kind === 'weekdays') {
      return restriction.weekdays.includes(dayjs(date).day())
    }
    return (
      countOthersOff(restriction, offDays, userId, date) >=
      (restriction.maxOff ?? 0)
    )
  })

export const findRestBreaks = ({
  restrictions,
  users
}: {
  restrictions: TRestRestrictionInput[]
  users: TRestDaysOfUser[]
}): TRestRestrictionBreak[] => {
  if (restrictions.length === 0) return []
  const offDays = getOffDays(users)
  return users.flatMap(({ userId, days }) =>
    days
      .filter(({ kind }) => kind === 'off')
      .flatMap((day) =>
        findRestrictionBreaks({
          restrictions,
          offDays,
          userId,
          date: day.date
        }).map((restriction) => ({
          userId,
          date: day.date,
          adjusted: day.adjusted,
          restriction: toRestRestrictionSummary(restriction)
        }))
      )
  )
}
