import type {
  Company,
  DeviceCredentials
} from '@/infra/database/generated/client'
import { TState } from '@/infra/form-action'

export type TImportFileState = TState<File, Company>

export type TBindParams = {
  company: Company
  credentials: DeviceCredentials
}
