import { type TWeekdayKey, WEEKDAYS } from '@/constants/time'

export const WEEKDAY_LABELS: Record<TWeekdayKey, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

export const getWeekdayLabel = (weekday: number): string => {
  const entry = WEEKDAYS.find((day) => day.weekday === weekday)
  return entry ? WEEKDAY_LABELS[entry.key] : String(weekday)
}
