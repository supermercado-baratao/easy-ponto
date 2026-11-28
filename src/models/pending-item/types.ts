import { z } from 'zod'

import type { Company, OvertimeBand, User } from '@/infra/database/types'
import type { TCompanySetupStep } from '@/models/company/utils'
import type {
  TScheduleAlert,
  TScheduleAlertLimits
} from '@/models/journey/types'
import type {
  TRestRestrictionInput,
  TRestRestrictionSummary
} from '@/models/rest-restriction/utils'
import type { TRestRuleInput, TRestUserDays } from '@/models/rest-rule/utils'
import type { TUserShiftDays } from '@/models/shift-assignment/types'

import { dismissSchema, findManyByCompanyIdSchema, keySchema } from './schema'

export type TPendingItemUser = Pick<User, 'id' | 'name'>

export type TPendingItem = { key: string } & (
  | { type: 'company-setup'; step: TCompanySetupStep }
  | { type: 'user-without-schedule'; user: TPendingItemUser }
  | {
      type: 'schedule-alert'
      user: TPendingItemUser
      date: string
      alert: TScheduleAlert
    }
  | {
      type: 'unmoved-rest'
      user: TPendingItemUser
      date: string
      ruleName: string
    }
  | {
      type: 'rest-restriction-break'
      users: TPendingItemUser[]
      date: string
      restriction: TRestRestrictionSummary
    }
)

export type TPendingItemType = TPendingItem['type']

export type TDismissedPendingItem = TPendingItem & {
  dismissedAt: Date
  dismissedByName: string | null
}

export type TPendingItems = {
  open: TPendingItem[]
  dismissed: TDismissedPendingItem[]
  limits: TScheduleAlertLimits
}

export type TPendingItemContext = {
  today: string
  company: Pick<Company, 'deviceCredentialsId' | 'cpfCnpj'>
  overtimeBands: Pick<OvertimeBand, 'dayKind'>[]
  users: TPendingItemUser[]
  shiftDays: Pick<TUserShiftDays, 'userId' | 'days'>[]
  limits: TScheduleAlertLimits
  restRules: TRestRuleInput[]
  restDays: TRestUserDays[]
  restRestrictions: TRestRestrictionInput[]
  isHoliday: (date: string) => boolean
}

export type TPendingItemDetector = (
  context: TPendingItemContext
) => TPendingItem[]

export type TPendingItemDismissData = z.infer<typeof dismissSchema>

export type TPendingItemKey = z.infer<typeof keySchema>

export type TPendingItemFindManyParams = z.infer<
  typeof findManyByCompanyIdSchema
>
