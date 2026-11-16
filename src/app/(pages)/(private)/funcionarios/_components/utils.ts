import type { TUserFilters, TUserStatus } from '@/models/user/utils'

export const STATUS_LABELS: Record<TUserStatus, string> = {
  registered: 'Registrado',
  probation: 'Experiência',
  'on-leave': 'Afastado',
  dismissed: 'Desligado'
}

export const STATUS_PARAMS: Record<
  NonNullable<TUserFilters['status']>,
  string
> = {
  all: 'todos',
  registered: 'registrado',
  probation: 'experiencia',
  'on-leave': 'afastado',
  dismissed: 'desligado'
}

export const getStatusLabel = (status: string): string =>
  STATUS_LABELS[status as TUserStatus] ?? status
