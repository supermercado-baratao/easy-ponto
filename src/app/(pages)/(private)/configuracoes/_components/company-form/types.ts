import { Company } from '@prisma/client'

import { TState } from '@/infra/form-action'
import { TCompanyUpsertData } from '@/models'

export type TCompanyState = TState<TCompanyUpsertData, Company>
