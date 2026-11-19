import type { TState } from '@/entry/form-action'

export type TResetPasswordState = Pick<
  TState<never, never>,
  'success' | 'fatalError'
>
