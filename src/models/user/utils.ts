import type { JobFunction, User, UserGroup } from '@/infra/database/types'
import {
  findFunctionByName,
  getActiveFunctionIds,
  type TUserFunctionsSource
} from '@/models/job-function/utils'
import { findGroupByName, getDescendantIds } from '@/models/user-group/utils'

export const USER_STATUSES = [
  'registered',
  'probation',
  'on-leave',
  'dismissed'
] as const

export type TUserStatus = (typeof USER_STATUSES)[number]

export const DEFAULT_USER_STATUS: TUserStatus = 'registered'

export const INACTIVE_USER_STATUSES: readonly TUserStatus[] = ['dismissed']

export type TUserFilters = {
  name?: string
  position?: string
  status?: TUserStatus | 'all'
}

const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()

export const filterUsers = <
  T extends Pick<User, 'name' | 'position' | 'status'>
>(
  users: T[],
  { name, position, status }: TUserFilters
): T[] => {
  const normalizedName = name ? normalize(name) : ''
  return users.filter(
    (user) =>
      normalize(user.name).includes(normalizedName) &&
      (!position || user.position === position) &&
      (status === 'all' ||
        (status
          ? user.status === status
          : !INACTIVE_USER_STATUSES.includes(user.status as TUserStatus)))
  )
}

export const getPositions = (users: Pick<User, 'position'>[]): string[] =>
  [
    ...new Set(
      users.flatMap(({ position }) => (position?.trim() ? [position] : []))
    )
  ].toSorted((a, b) => a.localeCompare(b, 'pt-BR'))

export type TOrganizationFilters = {
  groupId?: string
  jobFunctionId?: string
}

type TOrganization = {
  groups: Pick<UserGroup, 'id' | 'name' | 'parentId'>[]
  jobFunctions: Pick<JobFunction, 'id' | 'name' | 'level'>[]
}

// The URL names the group and the function, so a link stays readable; both names are unique per company
export const resolveOrganizationFilters = (
  { groups, jobFunctions }: TOrganization,
  { group, jobFunction }: { group?: string; jobFunction?: string }
): TOrganizationFilters & {
  group: string | null
  jobFunction: string | null
} => {
  const matchedGroup = group?.trim()
    ? findGroupByName(groups, group.trim())
    : undefined
  const matchedFunction = jobFunction?.trim()
    ? findFunctionByName(jobFunctions, jobFunction.trim())
    : undefined
  return {
    groupId: matchedGroup?.id,
    jobFunctionId: matchedFunction?.id,
    group: matchedGroup?.name ?? null,
    jobFunction: matchedFunction?.name ?? null
  }
}

// Filtering by a group includes the employees of the groups inside it (a sector and its sections)
export const filterUsersByOrganization = <
  T extends TUserFunctionsSource & { groupIds: string[] }
>(
  users: T[],
  { groupId, jobFunctionId }: TOrganizationFilters,
  { groups, jobFunctions }: TOrganization
): T[] => {
  const groupIds = groupId
    ? new Set([groupId, ...getDescendantIds(groups, groupId)])
    : null
  return users.filter(
    (user) =>
      (!groupIds || user.groupIds.some((id) => groupIds.has(id))) &&
      (!jobFunctionId ||
        getActiveFunctionIds(user, jobFunctions).has(jobFunctionId))
  )
}
