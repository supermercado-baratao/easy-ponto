import { CPF_LENGTH, PIS_LENGTH } from '@/constants/length'
import type { User } from '@/infra/database/types'
import { TDeviceUser } from '@/models/device-model/types'
import { TInputData } from '@/types/generics'
import { normalizeLeftZeros } from '@/utils/normalize'

type TDeviceUserFields = Omit<
  TInputData<User>,
  'adminUserId' | 'admissionDate' | 'department' | 'payrollNumber' | 'position'
>

export const mapDeviceUserToUserFields = (
  deviceUser: TDeviceUser,
  companyId: string
): TDeviceUserFields => ({
  bars: deviceUser.bars.toString(),
  code: deviceUser.code.toString(),
  cpf: deviceUser.cpf ? normalizeLeftZeros(deviceUser.cpf, CPF_LENGTH) : null,
  name: deviceUser.name,
  password: deviceUser.password,
  pis: normalizeLeftZeros(deviceUser.pis, PIS_LENGTH),
  rfid: deviceUser.rfid.toString(),
  registration: deviceUser.registration.toString(),
  templatesCount: deviceUser.templates_count,
  companyId
})

export const mapDeviceUserToUser = (
  deviceUsers: TDeviceUser[],
  companyId: string
): TInputData<User>[] =>
  deviceUsers.map((deviceUser): TInputData<User> => ({
    ...mapDeviceUserToUserFields(deviceUser, companyId),
    adminUserId: null,
    admissionDate: null,
    department: null,
    payrollNumber: null,
    position: null
  }))
