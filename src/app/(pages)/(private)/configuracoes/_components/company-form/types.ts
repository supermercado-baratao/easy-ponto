import { TState } from '@/entry/form-action'
import type { Company } from '@/infra/database/types'
import { TCompanyUpsertData } from '@/models/company/types'

export type TCompanyState = TState<TCompanyUpsertData, Company>
