import type { Company, PunchRecord, User } from '@/infra/database/types'
import type { THoursBankInitialBalanceItem } from '@/models/hours-bank/types'
import type { TScheduleSaveData } from '@/models/schedule/types'

import type { TIME_CARD_REPORT_FORMATS } from './utils'

export type TTimeCardReportFormat = (typeof TIME_CARD_REPORT_FORMATS)[number]

export type TReportPeriod = {
  startDate: string
  endDate: string
}

export type TReportCompany = Pick<Company, 'name' | 'cpfCnpj' | 'registration'>

export type TReportUser = Pick<
  User,
  | 'department'
  | 'position'
  | 'admissionDate'
  | 'payrollNumber'
  | 'cpf'
  | 'name'
  | 'registration'
>

export type TReportPunchRecord = Pick<
  PunchRecord,
  'afdDatetime' | 'datetime'
> & {
  userName: string
}

export type TReportSchedule = Omit<
  TScheduleSaveData,
  'companyId' | 'userId'
> & {
  userName: string
}

export type TReportJustification = {
  userName: string
  code: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export type TReportBalance = Omit<THoursBankInitialBalanceItem, 'userId'> & {
  userName: string
}

// The employees are identified by name because a report has no PIS, the key of the device users
export type TTimeCardReport = {
  period: TReportPeriod
  company: TReportCompany
  users: TReportUser[]
  punchRecords: TReportPunchRecord[]
  schedules: TReportSchedule[]
  justifications: TReportJustification[]
  balances: TReportBalance[]
}

export type TTimeCardReportAdapter = {
  read: (file: File) => Promise<TTimeCardReport>
}
