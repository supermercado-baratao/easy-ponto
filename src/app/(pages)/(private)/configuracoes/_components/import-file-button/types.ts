import { TState } from '@/entry/form-action'
import type { Company, DeviceCredentials } from '@/infra/database/types'

export type TImportFileState = TState<File, Company>

export type TBindParams = {
  company: Company
  credentials: DeviceCredentials
}
