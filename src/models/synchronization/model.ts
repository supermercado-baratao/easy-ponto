import { z } from 'zod'

import type {
  Company,
  Justification,
  JustificationType,
  TInputData,
  User
} from '@/infra/database/types'
import { companyModel } from '@/models/company/model'
import { updateSchema as companyUpdateSchema } from '@/models/company/schema'
import { createDeviceApiInstance } from '@/models/device/device-api'
import { deviceModel } from '@/models/device/model'
import { TDeviceUser } from '@/models/device/types'
import { hoursBankModel } from '@/models/hours-bank/model'
import { createSchema as justificationCreateSchema } from '@/models/justification/schema'
import { findOverlappingJustification } from '@/models/justification/utils'
import { justificationTypeModel } from '@/models/justification-type/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { saveSchema as scheduleSaveSchema } from '@/models/schedule/schema'
import { userModel } from '@/models/user/model'
import { justificationRepository } from '@/repositories/justification-repository'
import { synchronizationRepository } from '@/repositories/synchronization-repository'

import {
  filterExistingDeviceUsersInTheParsedAfd,
  mapParsedAfdToPunchRecordCreateMany,
  parseAfd
} from './_utils/afd'
import { mapDeviceCompanyToCompany } from './_utils/company'
import {
  extractDataFromJson,
  extractPeriod,
  getPunchRecordsToCreate,
  getSchedulesToSave,
  getUsersToUpdate,
  parseXlsToJson
} from './_utils/file'
import {
  extractHoursBankFromJson,
  getInitialBalancesToSave
} from './_utils/hours-bank'
import { extractJustificationsFromJson } from './_utils/justification'
import { getSession } from './_utils/session'
import { mapDeviceUserToUser, mapDeviceUserToUserFields } from './_utils/user'
import { importFileSchema } from './schema'
import {
  TAfdSynchronizationParams,
  TCompanySynchronizationParams,
  TFileImportResult,
  TFileSynchronizationParams,
  TInitialBalanceImportParams,
  TInitialBalanceImportResult,
  TUserSynchronizationParams
} from './types'

const synchronizeCompany = async ({
  adminUserId,
  credentials
}: TCompanySynchronizationParams): Promise<Company> => {
  const api = createDeviceApiInstance(credentials.ip)
  const session = await getSession(api, credentials)
  const deviceCompany = await deviceModel.loadCompany(api, session)
  return await companyModel.upsertForAdminUser({
    ...mapDeviceCompanyToCompany(deviceCompany),
    adminUserId
  })
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

const resolveTypes = (
  codes: string[],
  resolutions: z.infer<typeof importFileSchema>['resolutions'],
  savedTypes: JustificationType[],
  companyId: string
): {
  typeIds: Map<string, string>
  typesToCreate: (TInputData<JustificationType> & { id: string })[]
} => {
  const typeIds = new Map(savedTypes.map((type) => [type.code, type.id]))
  const typesToCreate: (TInputData<JustificationType> & { id: string })[] = []
  const issues: z.core.$ZodIssue[] = []

  for (const code of codes) {
    if (typeIds.has(code)) continue
    const resolution = resolutions[code]
    if (resolution.action === 'associate') {
      if (savedTypes.every((type) => type.id !== resolution.typeId)) {
        throw new Error(
          `JustificationType ${resolution.typeId} not found in company ${companyId}`
        )
      }
      typeIds.set(code, resolution.typeId)
      continue
    }
    const type = {
      code: resolution.code,
      description: resolution.description,
      effect: resolution.effect
    }
    if (
      savedTypes.some((saved) => saved.code === type.code) ||
      typesToCreate.some((created) => created.code === type.code)
    ) {
      issues.push({
        code: 'custom',
        path: ['resolutions', code, 'code'],
        message: 'Já existe um tipo com esse código',
        input: type.code
      })
      continue
    }
    const id = crypto.randomUUID()
    typesToCreate.push({ ...type, id, companyId })
    typeIds.set(code, id)
  }

  if (issues.length > 0) throw new z.ZodError(issues)
  return { typeIds, typesToCreate }
}

const toCompanyUpdate = ({
  id,
  registration = null
}: z.infer<typeof companyUpdateSchema>): {
  id: string
  registration: string | null
} => ({ id, registration })

const isSameJustification = (
  justification: TInputData<Justification>,
  other: Justification
): boolean =>
  justification.typeId === other.typeId &&
  justification.startDate === other.startDate &&
  justification.endDate === other.endDate &&
  justification.startTime === other.startTime &&
  justification.endTime === other.endTime

const importFile = async ({
  file,
  company,
  credentials,
  resolutions
}: TFileSynchronizationParams): Promise<TFileImportResult> => {
  const { resolutions: validResolutions } = importFileSchema.parse({
    resolutions
  })
  const [json, users, savedTypes] = await Promise.all([
    parseXlsToJson(file),
    synchronizeUsers({ companyId: company.id, credentials }),
    justificationTypeModel.findManyByCompanyId(company.id)
  ])
  const dataInJson = extractDataFromJson(json)
  const justificationsInJson = extractJustificationsFromJson(
    json,
    dataInJson.schedules
  ).filter(({ userName }) => users.some((user) => user.name === userName))

  const codes = [...new Set(justificationsInJson.map(({ code }) => code))]
  const unknownCodes = codes.filter(
    (code) =>
      savedTypes.every((type) => type.code !== code) &&
      !Object.hasOwn(validResolutions, code)
  )
  if (unknownCodes.length > 0) {
    return {
      status: 'unresolved',
      unknownCodes,
      types: savedTypes.map(({ id, code, description }) => ({
        id,
        code,
        description
      }))
    }
  }

  const { typeIds, typesToCreate } = resolveTypes(
    codes,
    validResolutions,
    savedTypes,
    company.id
  )
  const { startDate, endDate } = extractPeriod(json)
  const savedJustifications =
    await justificationRepository.findManyInPeriodByUserIds({
      userIds: users.map(({ id }) => id),
      initialDate: startDate,
      finalDate: endDate
    })

  let skippedJustifications = 0
  const justificationsToCreate: TInputData<Justification>[] = []
  for (const { userName, code, ...period } of justificationsInJson) {
    const user = users.find(({ name }) => name === userName)!
    const { userId, typeId, startDate, endDate, startTime, endTime, note } =
      justificationCreateSchema.parse({
        ...period,
        companyId: company.id,
        userId: user.id,
        typeId: typeIds.get(code)
      })
    const justification = {
      userId,
      typeId,
      startDate,
      endDate,
      startTime,
      endTime,
      note
    }
    const overlapping = findOverlappingJustification(
      justification,
      savedJustifications.filter(({ userId }) => userId === user.id)
    )
    if (!overlapping) {
      justificationsToCreate.push(justification)
      continue
    }
    if (!isSameJustification(justification, overlapping)) {
      skippedJustifications++
    }
  }

  const updatedCompany = await synchronizationRepository.importFile({
    company:
      company.registration === dataInJson.company.registration
        ? null
        : toCompanyUpdate(
            companyUpdateSchema.parse({
              id: company.id,
              registration: dataInJson.company.registration
            })
          ),
    users: getUsersToUpdate(users, dataInJson.users),
    punchRecords: await punchRecordModel.findNewNonExistentInAfd(
      getPunchRecordsToCreate(dataInJson.punchRecords, users)
    ),
    schedules: getSchedulesToSave(dataInJson.schedules, users).map(
      (schedule) => {
        const { userId, startDate, days } = scheduleSaveSchema.parse(schedule)
        return { userId, startDate, days }
      }
    ),
    justificationTypes: typesToCreate,
    justifications: justificationsToCreate
  })

  return {
    status: 'imported',
    company: updatedCompany ?? company,
    skippedJustifications
  }
}

const importInitialBalance = async ({
  file,
  companyId
}: TInitialBalanceImportParams): Promise<TInitialBalanceImportResult> => {
  const [json, users] = await Promise.all([
    parseXlsToJson(file),
    userModel.findManyByCompanyId(companyId)
  ])
  const { balances: balancesInJson, ...period } = extractHoursBankFromJson(json)
  const { balances, unmatchedNames } = getInitialBalancesToSave(
    balancesInJson,
    users
  )
  const closing = await hoursBankModel.createInitialBalance({
    companyId,
    ...period,
    balances
  })
  return { closing, unmatchedNames }
}

export const synchronizationModel = {
  synchronizeCompany,
  synchronizeUsers,
  synchronizeAfd,
  importFile,
  importInitialBalance
}
