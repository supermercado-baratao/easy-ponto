import { faker } from '@faker-js/faker'
import retry from 'async-retry'
import { hashPassword } from 'better-auth/crypto'
import { sql } from 'drizzle-orm'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'

import { TIME_FIELDS } from '@/constants/time'
import { database } from '@/infra/database/client'
import { authAccounts, authUsers, members } from '@/infra/database/schema'
import { accountModel } from '@/models/account/model'
import { companyModel } from '@/models/company/model'
import { DEFAULT_DEVICE_MODEL } from '@/models/device/utils'
import { deviceCredentialsModel } from '@/models/device-credentials/model'
import { journeyRulesModel } from '@/models/journey-rules/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { getDayTimeFieldName } from '@/models/shift-pattern/utils'
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
    model: DEFAULT_DEVICE_MODEL,
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

// Any percentages: the mocked company only needs them to count as configured
const createOvertimeBands = async (companyId: string) =>
  await journeyRulesModel.saveOvertimeBands({
    companyId,
    'workday-1-percentage': '50',
    'day-off-1-percentage': '100',
    'holiday-1-percentage': '100'
  })

const populateDatabaseWithMockedData = async () => {
  const { company: createdCompany } = await accountModel.setup({
    ...MOCKED_ADMIN,
    passwordConfirmation: MOCKED_ADMIN.password
  })
  const deviceCredentials = await deviceCredentialsModel.upsert({
    model: DEFAULT_DEVICE_MODEL,
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
  await createOvertimeBands(company.id)
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

// A pattern of its own per call, so a test never shares one with another (an empty list in `days` is a day off)
const assignShift = async ({
  companyId,
  userId,
  startDate,
  days
}: {
  companyId: string
  userId: string
  startDate: string
  days: string[][]
}): Promise<void> => {
  const { id: shiftPatternId } = await shiftPatternModel.create({
    companyId,
    name: faker.string.alphanumeric(12),
    startDate,
    cycleLength: String(days.length),
    ...Object.fromEntries(
      days.flatMap((times, index) =>
        times.map((time, timeIndex) => [
          getDayTimeFieldName(index + 1, TIME_FIELDS[timeIndex]),
          time
        ])
      )
    )
  })
  await shiftAssignmentModel.create({
    companyId,
    userId,
    shiftPatternId,
    startDate,
    endDate: '',
    cycleStartDay: '1'
  })
}

// Writes the rows directly: the model would require a new password on the first access, and it never adds
// an employee
const createMember = async ({
  companyId,
  role,
  name,
  email,
  password
}: {
  companyId: string
  role: string
  name: string
  email: string
  password: string
}): Promise<string> => {
  const [user] = await database
    .insert(authUsers)
    .values({ name, email })
    .returning()
  await database.insert(authAccounts).values({
    accountId: user.id,
    providerId: 'credential',
    userId: user.id,
    password: await hashPassword(password)
  })
  await database
    .insert(members)
    .values({ organizationId: companyId, userId: user.id, role })
  return user.id
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  createCompanyData,
  populateDatabaseWithRealData,
  createOvertimeBands,
  populateDatabaseWithMockedData,
  findMockedCompanyId,
  assignShift,
  createMember
}

export default orchestrator
