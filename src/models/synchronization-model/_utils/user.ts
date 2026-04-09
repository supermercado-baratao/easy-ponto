import { User } from '@prisma/client'

import { CPF_LENGTH, PIS_LENGTH } from '@/constants'
import { TDeviceUser } from '@/models'
import { TInputData } from '@/types'
import { normalizeLeftZeros } from '@/utils'

export const mapDeviceUserToUser = (
  deviceUsers: TDeviceUser[],
  companyId: string
): TInputData<User>[] =>
  deviceUsers.map((deviceUser) => ({
    adminUserId: null,
    bars: deviceUser.bars.toString(),
    code: deviceUser.code.toString(),
    cpf: deviceUser.cpf ? normalizeLeftZeros(deviceUser.cpf, CPF_LENGTH) : null,
    name: deviceUser.name,
    password: deviceUser.password,
    pis: normalizeLeftZeros(deviceUser.pis, PIS_LENGTH),
    rfid: deviceUser.rfid.toString(),
    registration: deviceUser.registration.toString(),
    templatesCount: deviceUser.templates_count,
    companyId: companyId,
    admissionDate: null,
    department: null,
    payrollNumber: null,
    position: null,
    scheduleId: null
  }))
