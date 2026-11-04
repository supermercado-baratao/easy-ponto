import type { Company, User } from '@/infra/database/types'
import {
  adminUserModel,
  companyModel,
  createDeviceApiInstance,
  deviceModel,
  punchRecordModel,
  TDeviceUser,
  TUserWithPunchRecords,
  userModel
} from '@/models'
import { TInputData } from '@/types'

import {
  extractDataFromJson,
  filterExistingDeviceUsersInTheParsedAfd,
  getPunchRecordsToCreate,
  getSession,
  getUsersToUpdate,
  mapDeviceCompanyToCompany,
  mapDeviceUserToUser,
  mapDeviceUserToUserFields,
  mapParsedAfdToPunchRecordCreateMany,
  parseAfd,
  parseXlsToJson
} from './_utils'
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

  deviceUsers.forEach((deviceUser) => {
    const fields = mapDeviceUserToUserFields(deviceUser, companyId)
    const foundUser = foundUsers.find(
      (foundUser) => foundUser.pis === fields.pis
    )
    if (!foundUser) {
      deviceUsersToCreate.push(deviceUser)
      return
    }
    usersToUpdate.push({
      ...fields,
      id: foundUser.id,
      cpf: fields.cpf ?? foundUser.cpf
    })
  })

  const usersToCreate = mapDeviceUserToUser(deviceUsersToCreate, companyId)

  await Promise.all([
    usersToCreate.length && (await userModel.createMany(usersToCreate)),
    usersToUpdate.length && (await userModel.updateMany(usersToUpdate))
  ])

  const allUsers = await userModel.findManyByCompanyId(companyId)

  return allUsers
}

const synchronizeAfd = async ({
  params,
  credentials,
  userPis,
  companyId
}: TAfdSynchronizationParams): Promise<{
  users: User[]
  user: TUserWithPunchRecords | null
}> => {
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
  if (punchRecords.length) {
    await punchRecordModel.createManyExistentsInAfd(punchRecords)
  }

  const pis = userPis || users[0]?.pis || null
  const user = pis ? await userModel.findUniqueByPisWithPunchRecords(pis) : null

  return {
    users,
    user
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

  const [, , updatedCompany] = await Promise.all([
    usersToUpdate.length && (await userModel.updateMany(usersToUpdate)),
    punchRecordsToCreate.length &&
      (await punchRecordModel.createManyNonExistentInAfd(punchRecordsToCreate)),
    company.registration !== dataInJson.company.registration &&
      (await companyModel.update({
        id: company.id,
        registration: dataInJson.company.registration
      }))
  ])

  return updatedCompany || company
}

export const synchronizationModel = {
  synchronizeCompany,
  synchronizeUsers,
  synchronizeAfd,
  importFile
}
