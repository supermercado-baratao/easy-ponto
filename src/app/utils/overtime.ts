import { UNBANDED_PERCENTAGE } from '@/models/journey/utils'

export const getOvertimeLabel = (
  percentage: number,
  { plural = false }: { plural?: boolean } = {}
): string => {
  const noun = plural ? 'Extras' : 'Extra'
  return percentage === UNBANDED_PERCENTAGE
    ? `${noun} sem adicional`
    : `${noun} ${percentage}%`
}
