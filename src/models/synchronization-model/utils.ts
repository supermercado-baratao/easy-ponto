import { Company, User } from '@prisma/client'
import { AxiosInstance } from 'axios'

import { CNPJ_LENGTH, CPF_LENGTH, PIS_LENGTH } from '@/constants'
import { dayjs } from '@/lib'
import {
  deviceModel,
  deviceSessionModel,
  TDeviceCompany,
  TDeviceUser,
  TParsedAfdRecord,
  TPunchRecordCreateManyData,
  TSynchronizationCredentials
} from '@/models'
import { TInputData } from '@/types'
import { normalizeLeftZeros } from '@/utils'

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
  cpf: normalizeLeftZeros(deviceCompany.cpf, CPF_LENGTH),
  cpfCnpj: normalizeLeftZeros(
    deviceCompany.cpf_cnpj,
    deviceCompany.tipo_doc === 1 ? CNPJ_LENGTH : CPF_LENGTH
  ),
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
    cpf: deviceUser.cpf ? normalizeLeftZeros(deviceUser.cpf, CPF_LENGTH) : null,
    name: deviceUser.name,
    password: deviceUser.password,
    pis: normalizeLeftZeros(deviceUser.pis, PIS_LENGTH),
    rfid: deviceUser.rfid,
    registration: deviceUser.registration,
    templatesCount: deviceUser.templates_count,
    companyId: companyId
  }))

const toDatetime = (date: string, time: string): Date => {
  const day = date.slice(0, 2)
  const month = date.slice(2, 4)
  const year = date.slice(4, 8)
  const hour = time.slice(0, 2)
  const minute = time.slice(2, 4)
  return dayjs(`${year}-${month}-${day} ${hour}:${minute}:00`).toDate()
}

export const mapParsedAfdToPunchRecordCreateMany = (
  parsedAfd: TParsedAfdRecord[]
): TPunchRecordCreateManyData =>
  parsedAfd.map((record) => ({
    pis: record.pis,
    datetime: toDatetime(record.date, record.time),
    afdDatetime: toDatetime(record.date, record.time),
    nsr: record.nsr,
    registrationType: record.registrationType,
    hexadecimalCheckDigit: record.hexadecimalCheckDigit
  }))

const getNsr = (line: string): number => Number(line.slice(0, 9))

const getRegistrationType = (line: string): string => line.slice(9, 10)

const getDate = (line: string): string => line.slice(10, 18)

const getTime = (line: string): string => line.slice(18, 22)

const getPis = (line: string): string => line.slice(22, 34)

const getHexadecimalCheckDigit = (line: string): string => line.slice(34, 38)

export const parseAfd = (afd: string): TParsedAfdRecord[] => {
  const lines = afd.split('\n')
  const records: TParsedAfdRecord[] = lines
    .map((line) => {
      if (line.length !== 39) {
        return undefined
      }
      return {
        nsr: getNsr(line),
        registrationType: getRegistrationType(line),
        date: getDate(line),
        time: getTime(line),
        pis: getPis(line),
        hexadecimalCheckDigit: getHexadecimalCheckDigit(line)
      }
    })
    .filter((line) => line !== undefined)
  return records
}
