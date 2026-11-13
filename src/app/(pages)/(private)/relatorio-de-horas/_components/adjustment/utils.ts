import type { HoursBankAdjustment } from '@/infra/database/types'

import { formatDate, formatSignedMinutes } from '../utils'
import type { TAdjustmentFormValues } from './types'

export const getAdjustmentFormValues = (
  adjustment: HoursBankAdjustment
): TAdjustmentFormValues => ({
  id: adjustment.id,
  date: adjustment.date,
  minutes: formatSignedMinutes(adjustment.minutes),
  reason: adjustment.reason
})

export const getAdjustmentShortLabel = (
  adjustment: HoursBankAdjustment
): string =>
  `${formatDate(adjustment.date)} (${adjustment.minutes > 0 ? '+' : ''}${formatSignedMinutes(adjustment.minutes)})`

export const getAdjustmentLabel = (adjustment: HoursBankAdjustment): string =>
  `Ajuste de ${getAdjustmentShortLabel(adjustment)}: ${adjustment.reason}`
