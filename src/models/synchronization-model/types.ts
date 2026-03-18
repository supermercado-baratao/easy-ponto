import { TDeviceLoginCredentials } from '../device-model'

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
