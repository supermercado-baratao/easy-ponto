import type {
  Company,
  DeviceCredentials,
  HoursBankClosing,
  JustificationType
} from '@/infra/database/types'
import type { TTimeCardReportFormat } from '@/models/time-card-report/types'

import type { TAfdQuery } from '../device/types'

export type TCompanySynchronizationParams = {
  companyId: string
  credentials: DeviceCredentials | null
}

export type TUserSynchronizationParams = {
  companyId: string
  credentials: DeviceCredentials | null
}

export type TAfdSynchronizationParams = {
  params: TAfdQuery
  credentials: DeviceCredentials | null
  companyId: string
}

export type TParsedAfdRecord = {
  nsr: number
  registrationType: string
  date: string
  time: string
  pis: string
  hexadecimalCheckDigit: string
}

export type TCodeResolutions = Record<string, string>

export type TFileSynchronizationParams = {
  file: File
  format: TTimeCardReportFormat
  company: Company
  credentials: DeviceCredentials | null
  resolutions?: TCodeResolutions
}

export type TUnresolvedImport = {
  status: 'unresolved'
  unknownCodes: string[]
  types: Pick<JustificationType, 'id' | 'name'>[]
}

export type TFileImportResult =
  | TUnresolvedImport
  | {
      status: 'imported'
      company: Company
      skippedJustifications: number
    }

export type TInitialBalanceImportParams = {
  file: File
  format: TTimeCardReportFormat
  companyId: string
  resolutions?: TCodeResolutions
}

export type TInitialBalanceImportResult =
  | TUnresolvedImport
  | {
      status: 'imported'
      closing: HoursBankClosing
      unmatchedNames: string[]
    }
