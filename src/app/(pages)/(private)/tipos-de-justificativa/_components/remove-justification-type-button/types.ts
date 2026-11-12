import type { TState } from '@/entry/form-action'

export type TRemoveJustificationTypeState = Pick<
  TState<never, never>,
  'success' | 'fatalError' | 'message'
> & {
  action?: string
}
