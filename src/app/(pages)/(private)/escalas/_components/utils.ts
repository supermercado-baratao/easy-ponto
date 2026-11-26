import type { TShiftPatternVersionWithDays } from '@/infra/database/types'
import { isDayOff } from '@/models/shift-pattern/utils'

export const CREATE_SHIFT_PATTERN_BUTTON_ID = 'create-shift-pattern'

export const getCycleSummary = ({
  cycleLength,
  days
}: TShiftPatternVersionWithDays): string => {
  const offDays = days.filter(isDayOff).length
  return `Ciclo de ${cycleLength} ${cycleLength === 1 ? 'dia' : 'dias'}: ${cycleLength - offDays} de trabalho e ${offDays} de folga`
}
