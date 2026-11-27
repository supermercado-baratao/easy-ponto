import type { TCalendarFilters } from './types'

export const CALENDAR_PATH = '/calendario'

export const getFilterQuery = ({
  name,
  position,
  status
}: TCalendarFilters): Record<string, string | null> => ({
  nome: name.length > 0 ? name : null,
  cargo: position,
  situacao: status
})

export const getCalendarHref = ({
  month,
  userId,
  filters
}: {
  month: string
  userId: string | null
  filters: TCalendarFilters
}): string => {
  const parameters = new URLSearchParams()
  const query = { ...getFilterQuery(filters), funcionario: userId, mes: month }
  for (const [key, value] of Object.entries(query)) {
    if (value) parameters.set(key, value)
  }
  return `${CALENDAR_PATH}?${parameters}`
}
