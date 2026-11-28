import type { TActionState } from '@/entry/action'
import type { TState } from '@/entry/form-action'
import type {
  TRestGenerateResult,
  TRestPreview,
  TRestRulePeriodParams
} from '@/models/rest-rule/types'

export type TPreviewRestsState = TState<TRestRulePeriodParams, TRestPreview> & {
  month?: string
}

export type TGenerateRestsState = TActionState<TRestGenerateResult>
