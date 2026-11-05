import type { Company } from '@/infra/database/types'
import { TState } from '@/infra/form-action'
import { TCompanyUpsertData } from '@/models/company/types'

export type TCompanyState = TState<TCompanyUpsertData, Company>
