import { Company, User } from '@prisma/client'
import { AxiosInstance } from 'axios'

import {
  deviceModel,
  deviceSessionModel,
  TDeviceCompany,
  TDeviceUser,
  TSynchronizationCredentials
} from '@/models'
import { TInputData } from '@/types'

export const getSession = async (
  api: AxiosInstance,
  credentials: TSynchronizationCredentials
): Promise<string> => {
  let session: string | undefined

  const deviceSession =
    await deviceSessionModel.findUniqueByDeviceCredentialsId(
      credentials.deviceCredentialsId
    )
  session = deviceSession?.token

  if (session) {
    const sessionIsValid = await deviceModel.sessionIsValid(api, session)
    if (sessionIsValid) {
      return session
    }
  }

  session = await deviceModel.login(api, credentials)
  await deviceSessionModel.upsert(session, credentials.deviceCredentialsId)

  return session
}

export const mapDeviceCompanyToCompany = (
  deviceCompany: TDeviceCompany
): TInputData<Company> => ({
  address: deviceCompany.address,
  cei: deviceCompany.cei.toString(),
  cpf: deviceCompany.cpf.toString(),
  cpfCnpj: deviceCompany.cpf_cnpj.toString(),
  name: deviceCompany.name,
  tipoDoc: deviceCompany.tipo_doc
})

export const mapDeviceUserToUser = (
  deviceUsers: TDeviceUser[],
  companyId: string
): TInputData<User>[] =>
  deviceUsers.map((deviceUser) => ({
    adminUserId: null,
    bars: deviceUser.bars.toString(),
    code: deviceUser.code,
    cpf: deviceUser.cpf?.toString() || null,
    name: deviceUser.name,
    password: deviceUser.password,
    pis: deviceUser.pis.toString(),
    rfid: deviceUser.rfid,
    registration: deviceUser.registration,
    templatesCount: deviceUser.templates_count,
    companyId: companyId
  }))
