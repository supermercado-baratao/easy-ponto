import type { TState } from '@/entry/form-action'

export type TClosingState = Pick<
  TState<never, never>,
  'success' | 'fatalError' | 'message'
> & {
  action?: string
}
