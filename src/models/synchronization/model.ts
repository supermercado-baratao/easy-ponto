import { z } from 'zod'

import type {
  Company,
  Justification,
  JustificationType,
  TInputData,
  User
} from '@/infra/database/types'
import { accountModel } from '@/models/account/model'
import { companyModel } from '@/models/company/model'
import { updateSchema as companyUpdateSchema } from '@/models/company/schema'
import { deviceModel } from '@/models/device/model'
import type { TDeviceAdapter, TDeviceUser } from '@/models/device/types'
import { hoursBankModel } from '@/models/hours-bank/model'
import { createSchema as justificationCreateSchema } from '@/models/justification/schema'
import { findOverlappingJustification } from '@/models/justification/utils'
import { justificationTypeModel } from '@/models/justification-type/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { saveSchema as scheduleSaveSchema } from '@/models/schedule/schema'
import { timeCardReportModel } from '@/models/time-card-report/model'
import { userModel } from '@/models/user/model'
import { justificationRepository } from '@/repositories/justification-repository'
import { synchronizationRepository } from '@/repositories/synchronization-repository'

import {
  filterExistingDeviceUsersInTheParsedAfd,
  mapParsedAfdToPunchRecordCreateMany,
  parseAfd
} from './_utils/afd'
import {
  getInitialBalancesToSave,
  getPunchRecordsToCreate,
  getSchedulesToSave,
  getUsersToUpdate
} from './_utils/report'
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
  companyId,
  credentials
}: TCompanySynchronizationParams): Promise<Company> => {
  const deviceCompany = await deviceModel.connect(credentials).loadCompany()
  return await companyModel.save({
    ...deviceCompany,
    registration: null,
    id: companyId
  })
}

const saveDeviceUsers = async (
  device: TDeviceAdapter,
  companyId: string
): Promise<User[]> => {
  const deviceUsers = await device.loadUsers()
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

  await accountModel.createEmployeeAccounts(companyId)

  return await userModel.findManyByCompanyId(companyId)
}

const synchronizeUsers = async ({
  companyId,
  credentials
}: TUserSynchronizationParams): Promise<User[]> =>
  await saveDeviceUsers(deviceModel.connect(credentials), companyId)

const synchronizeAfd = async ({
  params,
  credentials,
  companyId
}: TAfdSynchronizationParams): Promise<void> => {
  // One adapter for both calls, so they share a single session on the device
  const device = deviceModel.connect(credentials)
  const [users, afd] = await Promise.all([
    saveDeviceUsers(device, companyId),
    device.loadAfd(params)
  ])
  const parsedAfd = filterExistingDeviceUsersInTheParsedAfd(
    parseAfd(afd),
    users
  )
  const punchRecords = mapParsedAfdToPunchRecordCreateMany(parsedAfd, companyId)
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
  format,
  company,
  credentials,
  resolutions
}: TFileSynchronizationParams): Promise<TFileImportResult> => {
  const { resolutions: validResolutions } = importFileSchema.parse({
    resolutions
  })
  const [report, users, savedTypes] = await Promise.all([
    timeCardReportModel.read(format, file),
    synchronizeUsers({ companyId: company.id, credentials }),
    justificationTypeModel.findManyByCompanyId(company.id)
  ])
  const reportJustifications = report.justifications.filter(({ userName }) =>
    users.some((user) => user.name === userName)
  )

  const codes = [...new Set(reportJustifications.map(({ code }) => code))]
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
  const { startDate, endDate } = report.period
  const savedJustifications =
    await justificationRepository.findManyInPeriodByUserIds({
      userIds: users.map(({ id }) => id),
      initialDate: startDate,
      finalDate: endDate
    })

  let skippedJustifications = 0
  const justificationsToCreate: TInputData<Justification>[] = []
  for (const { userName, code, ...period } of reportJustifications) {
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
      company.registration === report.company.registration
        ? null
        : toCompanyUpdate(
            companyUpdateSchema.parse({
              id: company.id,
              registration: report.company.registration
            })
          ),
    users: getUsersToUpdate(users, report.users),
    punchRecords: await punchRecordModel.findNewNonExistentInAfd(
      getPunchRecordsToCreate(report.punchRecords, users)
    ),
    schedules: getSchedulesToSave(report.schedules, users).map((schedule) => {
      const { userId, startDate, days } = scheduleSaveSchema.parse(schedule)
      return { userId, startDate, days }
    }),
    justificationTypes: typesToCreate,
    justifications: justificationsToCreate
  })
  // The report may fill the CPF of an employee the device saved without one
  await accountModel.createEmployeeAccounts(company.id)

  return {
    status: 'imported',
    company: updatedCompany ?? company,
    skippedJustifications
  }
}

const importInitialBalance = async ({
  file,
  format,
  companyId
}: TInitialBalanceImportParams): Promise<TInitialBalanceImportResult> => {
  const [report, users] = await Promise.all([
    timeCardReportModel.read(format, file),
    userModel.findManyByCompanyId(companyId)
  ])
  const { balances, unmatchedNames } = getInitialBalancesToSave(
    report.balances,
    users
  )
  const closing = await hoursBankModel.createInitialBalance({
    companyId,
    ...report.period,
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
