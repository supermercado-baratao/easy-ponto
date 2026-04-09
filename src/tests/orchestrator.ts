import { faker } from '@faker-js/faker'
import retry from 'async-retry'
import * as cnpj from 'validation-br/dist/cnpj.js'
import * as cpf from 'validation-br/dist/cpf.js'

import {
  adminUserModel,
  companyModel,
  deviceCredentialsModel,
  punchRecordModel,
  statusModel,
  synchronizationModel,
  userModel
} from '@/models'
import {
  mapDeviceUserToUser,
  mapParsedAfdToPunchRecordCreateMany
} from '@/models/synchronization-model/_utils'

import { deviceUsers, parsedAfd } from './_mocks'
import { execAsync } from './_utils'

const waitForAllServices = async () => {
  await retry(async () => await statusModel.check(), {
    retries: 60,
    maxTimeout: 1000,
    minTimeout: 100
  })
}

const clearDatabase = async () => await execAsync('pnpm db:reset --force')

const populateDatabaseWithRealData = async () => {
  const { id: adminUserId } = await adminUserModel.create()
  const credentials = await deviceCredentialsModel.upsert({
    adminUserId,
    ip: process.env.DEVICE_IP!,
    login: process.env.DEVICE_LOGIN!,
    password: process.env.DEVICE_PASSWORD!
  })
  await synchronizationModel.synchronizeCompany({
    adminUserId,
    credentials: {
      ...credentials,
      id: credentials.id
    }
  })
}

const populateDatabaseWithMockedData = async () => {
  let adminUser = await adminUserModel.create()
  const deviceCredentials = await deviceCredentialsModel.upsert({
    adminUserId: adminUser.id,
    ip: faker.internet.ipv4(),
    login: faker.internet.username(),
    password: faker.internet.password()
  })
  const company = await companyModel.upsert({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: cpf.fake(),
    tipoDoc: 1,
    cpfCnpj: cnpj.fake(),
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  adminUser = await adminUserModel.update({
    id: adminUser.id,
    companyId: company.id,
    deviceCredentialsId: deviceCredentials.id
  })
  await userModel.createMany(mapDeviceUserToUser(deviceUsers, company.id))
  await punchRecordModel.createManyExistentsInAfd(
    mapParsedAfdToPunchRecordCreateMany(parsedAfd)
  )

  return {
    adminUser,
    deviceCredentials,
    company
  }
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  populateDatabaseWithRealData,
  populateDatabaseWithMockedData
}

export default orchestrator
