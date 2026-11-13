import { TState } from '@/entry/form-action'
import type { Company } from '@/infra/database/types'

export type TImportFileState = TState<File, Company> & {
  action?: string
}
