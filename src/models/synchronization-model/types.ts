import { TDeviceLoginCredentials, TGetAfdParams } from '../device-model'

export type TSynchronizationCredentials = TDeviceLoginCredentials & {
  ip: string
  deviceCredentialsId: string
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
}

export type TParsedAfdRecord = {
  nsr: number
  registrationType: string
  date: string
  time: string
  pis: string
  hexadecimalCheckDigit: string
}
