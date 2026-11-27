import { dayjs } from '@/infra/dayjs'
import type { THolidayInYear } from '@/models/holiday/types'
import type {
  THolidayRecurrence,
  THolidayRule,
  THolidayScope
} from '@/models/holiday/utils'

export const SCOPE_LABELS: Record<THolidayScope, string> = {
  national: 'Nacional',
  state: 'Estadual',
  municipal: 'Municipal'
}

export const RECURRENCE_LABELS: Record<THolidayRecurrence, string> = {
  once: 'Só nesta data',
  yearly: 'Todo ano no mesmo dia',
  easter: 'Móvel (a partir da Páscoa)'
}

export const getHolidayLabel = ({
  name,
  dateInYear
}: Pick<THolidayInYear, 'name' | 'dateInYear'>): string =>
  `${name} (${dayjs(dateInYear).format('DD/MM/YYYY')})`

export const getScopeLabel = (scope: string): string =>
  SCOPE_LABELS[scope as THolidayScope] ?? scope

const getEasterOffsetLabel = (easterOffset: number): string => {
  if (easterOffset === 0) return 'No domingo de Páscoa'
  const days = Math.abs(easterOffset)
  const side = easterOffset < 0 ? 'antes' : 'depois'
  return `${days} ${days === 1 ? 'dia' : 'dias'} ${side} da Páscoa`
}

const getValidityLabel = ({
  firstYear,
  lastYear
}: Pick<THolidayRule, 'firstYear' | 'lastYear'>): string | null => {
  if (firstYear !== null && lastYear !== null)
    return firstYear === lastYear
      ? `só em ${firstYear}`
      : `de ${firstYear} a ${lastYear}`
  if (firstYear !== null) return `desde ${firstYear}`
  if (lastYear !== null) return `até ${lastYear}`
  return null
}

export const getRecurrenceLabel = (holiday: THolidayRule): string => {
  if (holiday.recurrence === 'once') return RECURRENCE_LABELS.once
  const label =
    holiday.recurrence === 'easter'
      ? `Móvel · ${getEasterOffsetLabel(holiday.easterOffset!)}`
      : 'Todo ano'
  const validity = getValidityLabel(holiday)
  return validity ? `${label} · ${validity}` : label
}
