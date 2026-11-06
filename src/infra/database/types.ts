import type { Scalars } from '@prisma/orm-postgres/family-contract/types'

import type { Models } from './contract.d'

export type AdminUser = Scalars<Models.public_AdminUser>
export type Company = Scalars<Models.public_Company>
export type DeviceCredentials = Scalars<Models.public_DeviceCredentials>
export type DeviceSession = Scalars<Models.public_DeviceSession>
export type PunchRecord = Scalars<Models.public_PunchRecord>
export type User = Scalars<Models.public_User>

type TAutomaticFields = 'id' | 'createdAt' | 'updatedAt'

export type TInputData<T> = T extends readonly (infer U)[]
  ? Omit<U, TAutomaticFields>[]
  : Omit<T, TAutomaticFields>

export type TAdminUserWithRelations = AdminUser & {
  company: Company | null
  deviceCredentials: DeviceCredentials | null
  user: User | null
}
