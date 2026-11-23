import type { z } from 'zod'

import type {
  Company,
  DeviceCredentials,
  HoursBankClosing,
  JustificationType
} from '@/infra/database/types'
import type { TTimeCardReportFormat } from '@/models/time-card-report/types'

import type { TAfdQuery } from '../device/types'
import type { codeResolutionSchema } from './schema'

export type TCompanySynchronizationParams = {
  companyId: string
  credentials: DeviceCredentials
}

export type TUserSynchronizationParams = {
  companyId: string
  credentials: DeviceCredentials
}

export type TAfdSynchronizationParams = {
  params: TAfdQuery
  credentials: DeviceCredentials
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

export type TCodeResolution = z.input<typeof codeResolutionSchema>

export type TFileSynchronizationParams = {
  file: File
  format: TTimeCardReportFormat
  company: Company
  credentials: DeviceCredentials
  resolutions?: Record<string, TCodeResolution>
}

export type TFileImportResult =
  | {
      status: 'unresolved'
      unknownCodes: string[]
      types: Pick<JustificationType, 'id' | 'code' | 'description'>[]
    }
  | {
      status: 'imported'
      company: Company
      skippedJustifications: number
    }

export type TInitialBalanceImportParams = {
  file: File
  format: TTimeCardReportFormat
  companyId: string
}

export type TInitialBalanceImportResult = {
  closing: HoursBankClosing
  unmatchedNames: string[]
}
