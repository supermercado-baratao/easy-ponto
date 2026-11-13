import type { TState } from '@/entry/form-action'
import type { TPeriodInJson } from '@/models/synchronization/types'

export type TInitialBalanceState = Pick<
  TState<never, TPeriodInJson & { unmatchedNames: string[] }>,
  'success' | 'fatalError' | 'message' | 'data'
> & {
  action?: string
}
