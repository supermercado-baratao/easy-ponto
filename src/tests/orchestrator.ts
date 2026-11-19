import { faker } from '@faker-js/faker'
import retry from 'async-retry'
import { sql } from 'drizzle-orm'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'

import { database } from '@/infra/database/client'
import { accountModel } from '@/models/account/model'
import { companyModel } from '@/models/company/model'
import { deviceCredentialsModel } from '@/models/device-credentials/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { statusModel } from '@/models/status/model'
import { mapParsedAfdToPunchRecordCreateMany } from '@/models/synchronization/_utils/afd'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { synchronizationModel } from '@/models/synchronization/model'
import { userModel } from '@/models/user/model'

import { deviceUsers } from './_mocks/device-users'
import { parsedAfd } from './_mocks/parsed-afd'

// The E2E tests sign in with this account, created by `populateDatabaseWithMockedData`
export const MOCKED_ADMIN = {
  companyName: 'Supermercado de Teste',
  name: 'Admin de Teste',
  email: 'admin@easy-ponto.test',
  password: 'senha-do-admin'
}

const waitForAllServices = async () => {
  await retry(async () => await statusModel.check(), {
    retries: 60,
    maxTimeout: 1000,
    minTimeout: 100
  })
}

const clearDatabase = async () => {
  const databaseName = new URL(process.env.DATABASE_URL!).pathname.slice(1)
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to clear the database ${databaseName}`)
  }

  await database.execute(sql`
    TRUNCATE auth_users, companies, devices_credentials, devices_sessions, punch_records, users CASCADE
  `)
}

const createCompanyData = () => ({
  name: faker.company.name(),
  address: faker.location.streetAddress(),
  cpf: CPF.fake().value,
  tipoDoc: 1,
  cpfCnpj: CNPJ.fake().value,
  cei: faker.string.numeric(12),
  registration: faker.string.numeric(12)
})

const populateDatabaseWithRealData = async () => {
  const { company } = await accountModel.setup({
    ...MOCKED_ADMIN,
    passwordConfirmation: MOCKED_ADMIN.password
  })
  const credentials = await deviceCredentialsModel.upsert({
    companyId: company.id,
    ip: process.env.DEVICE_IP!,
    login: process.env.DEVICE_LOGIN!,
    password: process.env.DEVICE_PASSWORD!
  })
  await synchronizationModel.synchronizeCompany({
    companyId: company.id,
    credentials
  })
}

const populateDatabaseWithMockedData = async () => {
  const { company: createdCompany } = await accountModel.setup({
    ...MOCKED_ADMIN,
    passwordConfirmation: MOCKED_ADMIN.password
  })
  const deviceCredentials = await deviceCredentialsModel.upsert({
    companyId: createdCompany.id,
    ip: faker.internet.ipv4(),
    login: faker.internet.username(),
    password: faker.internet.password()
  })
  const company = await companyModel.save({
    ...createCompanyData(),
    name: MOCKED_ADMIN.companyName,
    id: createdCompany.id
  })
  await userModel.createMany(mapDeviceUserToUser(deviceUsers, company.id))
  await punchRecordModel.createManyExistentsInAfd(
    mapParsedAfdToPunchRecordCreateMany(parsedAfd, company.id)
  )

  return {
    deviceCredentials,
    company
  }
}

const findMockedCompanyId = async (): Promise<string> => {
  const [{ companyId }] = await database.execute<{ companyId: string }>(
    sql`
      SELECT members.company_id AS "companyId"
      FROM members
      JOIN auth_users ON auth_users.id = members.auth_user_id
      WHERE auth_users.email = ${MOCKED_ADMIN.email}
    `,
    'objects'
  )
  return companyId
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  createCompanyData,
  populateDatabaseWithRealData,
  populateDatabaseWithMockedData,
  findMockedCompanyId
}

export default orchestrator
