import type { TState } from '@/entry/form-action'

export type TMemberActionState = Pick<
  TState<never, never>,
  'success' | 'fatalError' | 'message'
> & {
  action?: string
}
