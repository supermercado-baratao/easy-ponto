import type { TState } from '@/entry/form-action'
import type { TUserJobFunctionLink } from '@/models/job-function/utils'
import type { TUserUpdateData } from '@/models/user/types'

export type TUserFormValues = Partial<
  Record<
    | 'id'
    | 'status'
    | 'position'
    | 'payrollPositionActive'
    | 'department'
    | 'payrollNumber'
    | 'admissionDate',
    string
  >
> & {
  groupIds?: string[]
  jobFunctions?: TUserJobFunctionLink[]
}

export type TUserFormState = Omit<TState<TUserUpdateData, never>, 'data'> & {
  values?: TUserFormValues
}
