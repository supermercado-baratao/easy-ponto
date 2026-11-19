import { TState } from '@/entry/form-action'
import type { Company } from '@/infra/database/types'
import { TCompanySaveData } from '@/models/company/types'

export type TCompanyFormValues = Partial<
  Record<keyof TCompanySaveData | 'updatedAt', string>
>

export type TCompanyState = TState<TCompanySaveData, Company> & {
  values?: TCompanyFormValues
}
