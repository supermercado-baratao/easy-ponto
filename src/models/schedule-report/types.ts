import type { z } from 'zod'

import type { findReportSchema } from './schema'

export type TScheduleReportFindParams = z.input<typeof findReportSchema>

export type TScheduleReportPeriod = {
  initialMonth: string
  finalMonth: string
  limit: number | null
}
