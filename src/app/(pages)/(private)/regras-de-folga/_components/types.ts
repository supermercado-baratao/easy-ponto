import type {
  ShiftPattern,
  TRestRuleWithRelations
} from '@/infra/database/types'

export type TShiftPatternOption = Pick<ShiftPattern, 'id' | 'name'>

export type TRestRulesPageData = {
  rules: TRestRuleWithRelations[]
  shiftPatterns: TShiftPatternOption[]
  nextMonth: string
  canEdit: boolean
}
