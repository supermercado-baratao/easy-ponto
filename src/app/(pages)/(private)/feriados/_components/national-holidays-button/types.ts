import type { TState } from '@/entry/form-action'

export type TNationalHolidaysState = Pick<
  TState<never, number>,
  'data' | 'success' | 'fatalError'
>
