import { z } from 'zod'

import type {
  HoursBankAdjustment,
  HoursBankClosing
} from '@/infra/database/types'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'

import {
  closeSchema,
  createAdjustmentSchema,
  generateSchema,
  initialBalanceSchema,
  removeAdjustmentSchema,
  reopenSchema,
  updateAdjustmentSchema
} from './schema'
import { HOURS_BANK_ORDERS } from './utils'

export type THoursBankOrder = (typeof HOURS_BANK_ORDERS)[number]

export type THoursBankTotals = {
  absence: number
  lateness: number
  dayOff: number
  overtime60: number
  overtime100: number
  adjustment: number
}

export type THoursBankRow = THoursBankTotals & {
  userId: string
  name: string
  pis: string
  previousBalance: number
  balance: number
}

export type THoursBankReport = {
  period: TPunchRecordPeriod
  order: THoursBankOrder
  closing: HoursBankClosing | null
  lastClosing: HoursBankClosing | null
  closeIssue: string | null
  rows: THoursBankRow[]
  adjustments: HoursBankAdjustment[]
}

export type THoursBankGenerateParams = z.input<typeof generateSchema>

export type THoursBankCloseParams = z.input<typeof closeSchema>

export type THoursBankReopenParams = z.infer<typeof reopenSchema>

export type THoursBankAdjustmentCreateData = z.input<
  typeof createAdjustmentSchema
>

export type THoursBankAdjustmentUpdateData = z.input<
  typeof updateAdjustmentSchema
>

export type THoursBankAdjustmentRemoveParams = z.infer<
  typeof removeAdjustmentSchema
>

export type THoursBankInitialBalanceData = z.input<typeof initialBalanceSchema>

export type THoursBankInitialBalanceItem =
  THoursBankInitialBalanceData['balances'][number]
