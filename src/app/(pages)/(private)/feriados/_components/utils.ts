import { dayjs } from '@/infra/dayjs'
import type { THolidayInYear } from '@/models/holiday/types'
import type { THolidayScope } from '@/models/holiday/utils'

export const SCOPE_LABELS: Record<THolidayScope, string> = {
  national: 'Nacional',
  state: 'Estadual',
  municipal: 'Municipal'
}

export const getHolidayLabel = ({
  name,
  dateInYear
}: Pick<THolidayInYear, 'name' | 'dateInYear'>): string =>
  `${name} (${dayjs(dateInYear).format('DD/MM/YYYY')})`

export const getScopeLabel = (scope: string): string =>
  SCOPE_LABELS[scope as THolidayScope] ?? scope
