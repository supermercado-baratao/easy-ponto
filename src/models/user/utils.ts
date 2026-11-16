import type { User } from '@/infra/database/types'

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
