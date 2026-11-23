import type { TInputData, User } from '@/infra/database/types'
import type { TDeviceUser } from '@/models/device/types'
import { DEFAULT_USER_STATUS } from '@/models/user/utils'

type TDeviceUserFields = Omit<
  TInputData<User>,
  | 'authUserId'
  | 'admissionDate'
  | 'department'
  | 'payrollNumber'
  | 'position'
  | 'status'
>

export const mapDeviceUserToUserFields = (
  deviceUser: TDeviceUser,
  companyId: string
): TDeviceUserFields => ({ ...deviceUser, companyId })

export const mapDeviceUserToUser = (
  deviceUsers: TDeviceUser[],
  companyId: string
): TInputData<User>[] =>
  deviceUsers.map((deviceUser): TInputData<User> => ({
    ...mapDeviceUserToUserFields(deviceUser, companyId),
    authUserId: null,
    admissionDate: null,
    department: null,
    payrollNumber: null,
    position: null,
    status: DEFAULT_USER_STATUS
  }))
