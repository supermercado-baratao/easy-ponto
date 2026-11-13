import type { z } from 'zod'

import type {
  Company,
  HoursBankClosing,
  JustificationType,
  PunchRecord,
  User
} from '@/infra/database/types'
import type { THoursBankInitialBalanceItem } from '@/models/hours-bank/types'

import { TDeviceLoginCredentials, TGetAfdParams } from '../device/types'
import type { TScheduleSaveData } from '../schedule/types'
import type { codeResolutionSchema } from './schema'

export type TSynchronizationCredentials = TDeviceLoginCredentials & {
  ip: string
  id: string
}

export type TCompanySynchronizationParams = {
  adminUserId: string
  credentials: TSynchronizationCredentials
}

export type TUserSynchronizationParams = {
  companyId: string
  credentials: TSynchronizationCredentials
}

export type TAfdSynchronizationParams = {
  params: Omit<TGetAfdParams, 'session'>
  credentials: TSynchronizationCredentials
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
  company: Company
  credentials: TSynchronizationCredentials
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

export type TCompanyInJson = Pick<Company, 'name' | 'cpfCnpj' | 'registration'>

export type TUserInJson = Pick<
  User,
  | 'department'
  | 'position'
  | 'admissionDate'
  | 'payrollNumber'
  | 'cpf'
  | 'name'
  | 'registration'
>

export type TPunchRecordInJson = Pick<
  PunchRecord,
  'afdDatetime' | 'datetime'
> & {
  userName: string
}

export type TScheduleInJson = Omit<
  TScheduleSaveData,
  'companyId' | 'userId'
> & {
  userName: string
}

export type TJustificationInJson = {
  userName: string
  code: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export type TDataInJson = {
  company: TCompanyInJson
  users: TUserInJson[]
  punchRecords: TPunchRecordInJson[]
  schedules: TScheduleInJson[]
}

export type TPeriodInJson = {
  startDate: string
  endDate: string
}

export type THoursBankBalanceInJson = Omit<
  THoursBankInitialBalanceItem,
  'userId'
> & {
  userName: string
}

export type THoursBankInJson = TPeriodInJson & {
  balances: THoursBankBalanceInJson[]
}

export type TInitialBalanceImportParams = {
  file: File
  companyId: string
}

export type TInitialBalanceImportResult = {
  closing: HoursBankClosing
  unmatchedNames: string[]
}
