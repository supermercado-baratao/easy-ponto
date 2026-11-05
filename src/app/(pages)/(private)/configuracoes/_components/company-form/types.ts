import type { Company } from '@/infra/database/types'
import { TState } from '@/infra/form-action'
import { TCompanyUpsertData } from '@/models/company-model/types'

export type TCompanyState = TState<TCompanyUpsertData, Company>
