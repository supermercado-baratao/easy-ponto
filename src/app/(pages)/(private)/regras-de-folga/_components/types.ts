import type {
  ShiftPattern,
  TRestRestrictionWithRelations,
  TRestRuleWithRelations,
  User
} from '@/infra/database/types'

export type TShiftPatternOption = Pick<ShiftPattern, 'id' | 'name'>

export type TUserOption = Pick<User, 'id' | 'name'>

export type TGroupOption = { id: string; label: string }

export type TRestRulesPageData = {
  rules: TRestRuleWithRelations[]
  shiftPatterns: TShiftPatternOption[]
  restrictions: TRestRestrictionWithRelations[]
  users: TUserOption[]
  groups: TGroupOption[]
  nextMonth: string
  canEdit: boolean
}
