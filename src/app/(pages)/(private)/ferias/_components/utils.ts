import { dayjs } from '@/infra/dayjs'
import { MONTHS } from '@/models/vacation-plan/utils'

export const getMonthLabel = (month: number): string => {
  const label = dayjs(`2000-${String(month).padStart(2, '0')}-01`).format(
    'MMMM'
  )
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1)
}

export const MONTH_OPTIONS = [
  { value: null, label: 'Sem planejamento' },
  ...MONTHS.map((month) => ({
    value: String(month),
    label: getMonthLabel(month)
  }))
]

export const formatDate = (date: string): string =>
  dayjs(date).format('DD/MM/YYYY')
