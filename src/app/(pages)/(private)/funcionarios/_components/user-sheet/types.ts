import type { TState } from '@/entry/form-action'
import type { TUserUpdateData } from '@/models/user/types'

export type TUserFormValues = Partial<
  Record<
    | 'id'
    | 'status'
    | 'position'
    | 'department'
    | 'payrollNumber'
    | 'admissionDate',
    string
  >
>

export type TUserFormState = Omit<TState<TUserUpdateData, never>, 'data'> & {
  values?: TUserFormValues
}
