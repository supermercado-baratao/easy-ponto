import type { TState } from '@/entry/form-action'

export type TRemoveHolidayState = Pick<
  TState<never, never>,
  'success' | 'fatalError'
>
