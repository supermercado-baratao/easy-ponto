import { Company, User } from '@prisma/client'

import {
  adminUserModel,
  companyModel,
  createDeviceApiInstance,
  deviceModel,
  punchRecordModel,
  userModel
} from '@/models'
import { TInputData } from '@/types'

import {
  TAfdSynchronizationParams,
  TCompanySynchronizationParams,
  TUserSynchronizationParams
} from './types'
import {
  getSession,
  mapDeviceCompanyToCompany,
  mapDeviceUserToUser,
  mapParsedAfdToPunchRecordCreateMany,
  parseAfd
} from './utils'

const company = async ({
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

const users = async ({
  companyId,
  credentials
}: TUserSynchronizationParams): Promise<void> => {
  const api = createDeviceApiInstance(credentials.ip)
  const session = await getSession(api, credentials)
  const deviceUsers = await deviceModel.loadUsers(api, session)
  const users = mapDeviceUserToUser(deviceUsers, companyId)
  const foundUsers = await userModel.findManyByCompanyId(companyId)

  const usersToCreate: TInputData<User>[] = []
  const usersToUpdate: (TInputData<User> & { id: string })[] = []

  users.forEach((user) => {
    const foundUser = foundUsers.find((foundUser) => foundUser.pis === user.pis)
    foundUser
      ? usersToUpdate.push({ ...user, id: foundUser.id })
      : usersToCreate.push(user)
  })

  usersToCreate.length && (await userModel.createMany(usersToCreate))
  usersToUpdate.length && (await userModel.updateMany(usersToUpdate))
}

const afd = async ({
  params,
  credentials
}: TAfdSynchronizationParams): Promise<void> => {
  const api = createDeviceApiInstance(credentials.ip)
  const session = await getSession(api, credentials)
  const afd = await deviceModel.getAfd(api, {
    session,
    ...params
  })
  const parsedAfd = parseAfd(afd)
  const punchRecords = mapParsedAfdToPunchRecordCreateMany(parsedAfd)
  await punchRecordModel.createMany(punchRecords)
}

export const synchronizationModel = {
  receive: {
    company,
    users,
    afd
  }
}
