import type {
  TScheduleAlert,
  TScheduleAlertLimits
} from '@/models/journey/types'

const formatHours = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`
}

export const getAlertLabel = (
  alert: TScheduleAlert,
  { maxLunch, maxDailyJourney, maxContinuousWork }: TScheduleAlertLimits
): string => {
  switch (alert) {
    case 'long-lunch': {
      return `Almoço acima de ${formatHours(maxLunch)}`
    }
    case 'long-journey': {
      return `Jornada acima de ${formatHours(maxDailyJourney)}`
    }
    case 'long-continuous-work': {
      return `Mais de ${formatHours(maxContinuousWork)} sem intervalo`
    }
  }
}
