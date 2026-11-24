import { z } from 'zod'

import type {
  Company,
  Justification,
  JustificationType,
  TCompanyWithDeviceCredentials,
  TInputData,
  User
} from '@/infra/database/types'
import { NotFoundError, ValidationError } from '@/infra/errors'
import { accountModel } from '@/models/account/model'
import { companyModel } from '@/models/company/model'
import { updateSchema as companyUpdateSchema } from '@/models/company/schema'
import type {
  TCompanyChange,
  TDeviceCompanyField
} from '@/models/company/types'
import {
  DEVICE_COMPANY_FIELDS,
  diffDeviceCompany
} from '@/models/company/utils'
import { deviceModel } from '@/models/device/model'
import type {
  TDeviceAdapter,
  TDeviceCompany,
  TDeviceUser
} from '@/models/device/types'
import { hoursBankModel } from '@/models/hours-bank/model'
import { createSchema as justificationCreateSchema } from '@/models/justification/schema'
import { findOverlappingJustification } from '@/models/justification/utils'
import { justificationTypeModel } from '@/models/justification-type/model'
import { isSameTypeName } from '@/models/justification-type/utils'
import { punchRecordModel } from '@/models/punch-record/model'
import { saveSchema as scheduleSaveSchema } from '@/models/schedule/schema'
import { timeCardReportModel } from '@/models/time-card-report/model'
import type { TTimeCardReportFormat } from '@/models/time-card-report/types'
import { userModel } from '@/models/user/model'
import {
  justificationCodeMappingRepository,
  type TCodeResolutionsSaveData
} from '@/repositories/justification-code-mapping-repository'
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
import { companySynchronizationSchema, importFileSchema } from './schema'
import {
  TAfdSynchronizationParams,
  TCompanySynchronizationParams,
  TFileImportResult,
  TFileSynchronizationParams,
  TInitialBalanceImportParams,
  TInitialBalanceImportResult,
  TUnresolvedImport,
  TUserSynchronizationParams
} from './types'

const loadCompanies = async ({
  companyId,
  credentials
}: TCompanySynchronizationParams): Promise<
  [TCompanyWithDeviceCredentials, TDeviceCompany]
> =>
  await Promise.all([
    companyModel.findUniqueById(companyId),
    deviceModel.connect(credentials).loadCompany()
  ])

const loadCompanyChanges = async (
  params: TCompanySynchronizationParams
): Promise<TCompanyChange[]> => {
  const [company, deviceCompany] = await loadCompanies(params)
  return diffDeviceCompany(company, deviceCompany)
}

// The device has no registration, so the saved one is kept like every field the user chose to keep
const synchronizeCompany = async ({
  fields = DEVICE_COMPANY_FIELDS,
  ...params
}: TCompanySynchronizationParams & {
  fields?: readonly TDeviceCompanyField[]
}): Promise<Company> => {
  const input = companySynchronizationSchema.parse({ fields })
  const [company, deviceCompany] = await loadCompanies(params)
  const chosen = Object.fromEntries(
    input.fields.map((field) => [field, deviceCompany[field]])
  )
  try {
    return await companyModel.save({
      id: company.id,
      name: company.name,
      address: company.address ?? '',
      cpf: company.cpf ?? '',
      tipoDoc: company.tipoDoc ?? '',
      cpfCnpj: company.cpfCnpj ?? '',
      cei: company.cei ?? '',
      registration: company.registration,
      ...chosen
    })
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error
    throw new ValidationError({
      cause: error,
      message: 'Os dados escolhidos não formam um cadastro válido.',
      action:
        'Use os dados do relógio nos campos vazios ou inválidos, ou corrija-os no formulário da empresa.'
    })
  }
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

type TResolvedCodes = {
  typesByCode: Map<string, Pick<JustificationType, 'id' | 'effect'>>
  codeResolutions: TCodeResolutionsSaveData
}

// A code is resolved by the user's choice in this import, then by the choice of an earlier one,
// then by a type with the same code. The choices are saved, so each code is asked only once (#98)
const resolveCodes = async ({
  codes,
  format,
  companyId,
  resolutions
}: {
  codes: string[]
  format: TTimeCardReportFormat
  companyId: string
  resolutions: z.infer<typeof importFileSchema>['resolutions']
}): Promise<TResolvedCodes | TUnresolvedImport> => {
  const [savedTypes, mappings] = await Promise.all([
    justificationTypeModel.findManyByCompanyId(companyId),
    justificationCodeMappingRepository.findManyByFormat({ companyId, format })
  ])
  const savedTypesById = new Map(savedTypes.map((type) => [type.id, type]))
  // A report code spelled exactly like a type name needs no question, so the match is case-sensitive like the codes (FOLGA is not Folga)
  const savedTypesByName = new Map(savedTypes.map((type) => [type.name, type]))
  const mappedTypeIds = new Map(
    mappings.map(({ code, typeId }) => [code, typeId])
  )
  const findSavedType = (code: string): JustificationType | undefined => {
    const typeId = mappedTypeIds.get(code)
    return typeId ? savedTypesById.get(typeId) : savedTypesByName.get(code)
  }

  const unknownCodes = codes.filter(
    (code) => !Object.hasOwn(resolutions, code) && !findSavedType(code)
  )
  if (unknownCodes.length > 0) {
    return {
      status: 'unresolved',
      unknownCodes,
      types: savedTypes.map(({ id, name }) => ({ id, name }))
    }
  }

  const typesByCode: TResolvedCodes['typesByCode'] = new Map()
  const codeResolutions: TCodeResolutionsSaveData = {
    justificationTypes: [],
    mappings: []
  }
  const issues: z.core.$ZodIssue[] = []

  for (const code of codes) {
    const resolution = resolutions[code]
    if (!resolution) {
      typesByCode.set(code, findSavedType(code)!)
      continue
    }

    let type: Pick<JustificationType, 'id' | 'effect'> | undefined
    if (resolution.action === 'associate') {
      type = savedTypesById.get(resolution.typeId)
      if (!type) {
        throw new NotFoundError({
          message: 'O tipo de justificativa não foi encontrado.',
          cause: `JustificationType ${resolution.typeId} not found in company ${companyId}`
        })
      }
    } else {
      const { name, effect } = resolution
      if (
        [...savedTypes, ...codeResolutions.justificationTypes].some((type) =>
          isSameTypeName(type.name, name)
        )
      ) {
        issues.push({
          code: 'custom',
          path: ['resolutions', code, 'name'],
          message: 'Já existe um tipo com esse nome',
          input: name
        })
        continue
      }
      type = { id: crypto.randomUUID(), effect }
      codeResolutions.justificationTypes.push({
        id: type.id,
        name,
        effect,
        companyId
      })
    }
    typesByCode.set(code, type)
    codeResolutions.mappings.push({ companyId, format, code, typeId: type.id })
  }

  if (issues.length > 0) throw new z.ZodError(issues)
  return { typesByCode, codeResolutions }
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
  const [report, users] = await Promise.all([
    timeCardReportModel.read(format, file),
    synchronizeUsers({ companyId: company.id, credentials })
  ])
  const reportJustifications = report.justifications.filter(({ userName }) =>
    users.some((user) => user.name === userName)
  )

  const resolved = await resolveCodes({
    codes: [...new Set(reportJustifications.map(({ code }) => code))],
    format,
    companyId: company.id,
    resolutions: validResolutions
  })
  if ('status' in resolved) return resolved
  const { typesByCode, codeResolutions } = resolved
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
        typeId: typesByCode.get(code)?.id
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
    codeResolutions,
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
  companyId,
  resolutions
}: TInitialBalanceImportParams): Promise<TInitialBalanceImportResult> => {
  const { resolutions: validResolutions } = importFileSchema.parse({
    resolutions
  })
  const [report, users] = await Promise.all([
    timeCardReportModel.read(format, file),
    userModel.findManyByCompanyId(companyId)
  ])
  const reportBalances = report.balances.filter(({ userName }) =>
    users.some((user) => user.name === userName)
  )
  const resolved = await resolveCodes({
    codes: [
      ...new Set(
        reportBalances.flatMap(({ justificationMinutes }) =>
          Object.keys(justificationMinutes)
        )
      )
    ],
    format,
    companyId,
    resolutions: validResolutions
  })
  if ('status' in resolved) return resolved

  const deductedCodes = new Set(
    [...resolved.typesByCode]
      .filter(([, type]) => type.effect === 'deduct')
      .map(([code]) => code)
  )
  const { balances, unmatchedNames } = getInitialBalancesToSave(
    report.balances,
    users,
    deductedCodes
  )
  await justificationCodeMappingRepository.saveResolutions(
    resolved.codeResolutions
  )
  const closing = await hoursBankModel.createInitialBalance({
    companyId,
    ...report.period,
    balances
  })
  return { status: 'imported', closing, unmatchedNames }
}

export const synchronizationModel = {
  loadCompanyChanges,
  synchronizeCompany,
  synchronizeUsers,
  synchronizeAfd,
  importFile,
  importInitialBalance
}
