import type { Company, TInputData, User } from '@/infra/database/types'
import { adminUserModel } from '@/models/admin-user/model'
import { companyModel } from '@/models/company/model'
import { createDeviceApiInstance } from '@/models/device/device-api'
import { deviceModel } from '@/models/device/model'
import { TDeviceUser } from '@/models/device/types'
import { punchRecordModel } from '@/models/punch-record/model'
import { userModel } from '@/models/user/model'

import {
  filterExistingDeviceUsersInTheParsedAfd,
  mapParsedAfdToPunchRecordCreateMany,
  parseAfd
} from './_utils/afd'
import { mapDeviceCompanyToCompany } from './_utils/company'
import {
  extractDataFromJson,
  getPunchRecordsToCreate,
  getUsersToUpdate,
  parseXlsToJson
} from './_utils/file'
import { getSession } from './_utils/session'
import { mapDeviceUserToUser, mapDeviceUserToUserFields } from './_utils/user'
import {
  TAfdSynchronizationParams,
  TCompanySynchronizationParams,
  TFileSynchronizationParams,
  TUserSynchronizationParams
} from './types'

const synchronizeCompany = async ({
  adminUserId,
  credentials
}: TCompanySynchronizationParams): Promise<Company> => {
  const api = createDeviceApiInstance(credentials.ip)
  const session = await getSession(api, credentials)
  const deviceCompany = await deviceModel.loadCompany(api, session)
  const company = mapDeviceCompanyToCompany(deviceCompany)
  const upsertedCompany = await companyModel.upsert(company)
  await adminUserModel.update({
    id: adminUserId,
    companyId: upsertedCompany.id
  })
  return upsertedCompany
}

const synchronizeUsers = async ({
  companyId,
  credentials
}: TUserSynchronizationParams): Promise<User[]> => {
  const api = createDeviceApiInstance(credentials.ip)
  const session = await getSession(api, credentials)
  const deviceUsers = await deviceModel.loadUsers(api, session)
  const foundUsers = await userModel.findManyByCompanyId(companyId)

  const deviceUsersToCreate: TDeviceUser[] = []
  const usersToUpdate: (Partial<TInputData<User>> & { id: string })[] = []

  for (const deviceUser of deviceUsers) {
    const fields = mapDeviceUserToUserFields(deviceUser, companyId)
    const foundUser = foundUsers.find((user) => user.pis === fields.pis)
    if (!foundUser) {
      deviceUsersToCreate.push(deviceUser)
      continue
    }
    usersToUpdate.push({
      ...fields,
      id: foundUser.id,
      cpf: fields.cpf ?? foundUser.cpf
    })
  }

  const usersToCreate = mapDeviceUserToUser(deviceUsersToCreate, companyId)

  await Promise.all([
    usersToCreate.length > 0 && userModel.createMany(usersToCreate),
    usersToUpdate.length > 0 && userModel.updateMany(usersToUpdate)
  ])

  const allUsers = await userModel.findManyByCompanyId(companyId)

  return allUsers
}

const synchronizeAfd = async ({
  params,
  credentials,
  companyId
}: TAfdSynchronizationParams): Promise<void> => {
  const api = createDeviceApiInstance(credentials.ip)
  const session = await getSession(api, credentials)
  const [users, afd] = await Promise.all([
    synchronizeUsers({ companyId, credentials }),
    deviceModel.getAfd(api, {
      session,
      ...params
    })
  ])
  const parsedAfd = filterExistingDeviceUsersInTheParsedAfd(
    parseAfd(afd),
    users
  )
  const punchRecords = mapParsedAfdToPunchRecordCreateMany(parsedAfd)
  if (punchRecords.length > 0) {
    await punchRecordModel.createManyExistentsInAfd(punchRecords)
  }
}

const importFile = async ({
  file,
  company,
  credentials
}: TFileSynchronizationParams): Promise<Company> => {
  const [json, users] = await Promise.all([
    parseXlsToJson(file),
    synchronizeUsers({ companyId: company.id, credentials })
  ])
  const dataInJson = extractDataFromJson(json)
  const usersToUpdate = getUsersToUpdate(users, dataInJson.users)
  const punchRecordsToCreate = getPunchRecordsToCreate(
    dataInJson.punchRecords,
    users
  )

  const [updatedCompany] = await Promise.all([
    company.registration !== dataInJson.company.registration &&
      companyModel.update({
        id: company.id,
        registration: dataInJson.company.registration
      }),
    usersToUpdate.length > 0 && userModel.updateMany(usersToUpdate),
    punchRecordsToCreate.length > 0 &&
      punchRecordModel.createManyNonExistentInAfd(punchRecordsToCreate)
  ])

  return updatedCompany || company
}

export const synchronizationModel = {
  synchronizeCompany,
  synchronizeUsers,
  synchronizeAfd,
  importFile
}
