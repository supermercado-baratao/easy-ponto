import { hashPassword } from 'better-auth/crypto'
import { isCPF } from 'validation-br'

import type { Company, TMemberWithCompany } from '@/infra/database/types'
import { NotFoundError, ValidationError } from '@/infra/errors'
import { toSlug } from '@/models/company/utils'
import { DEFAULT_JOURNEY_RULES } from '@/models/journey-rules/utils'
import { DEFAULT_JUSTIFICATION_TYPES } from '@/models/justification-type/utils'
import { accountRepository } from '@/repositories/account-repository'
import { userRepository } from '@/repositories/user-repository'

import {
  changePasswordSchema,
  cpfSignInSchema,
  emailSignInSchema,
  resetEmployeePasswordSchema,
  setupSchema
} from './schema'
import type {
  TAccountSetupData,
  TChangePasswordData,
  TCpfSignInData,
  TEmailSignInData,
  TResetEmployeePasswordData,
  TSignInCredentials
} from './types'
import {
  EMPLOYEE_ROLE,
  getDefaultPassword,
  getEmployeeEmail,
  OWNER_ROLE
} from './utils'

const isSetUp = async (): Promise<boolean> =>
  (await accountRepository.count()) > 0

const setup = async (
  data: TAccountSetupData
): Promise<{ company: Company; credentials: TSignInCredentials }> => {
  if (await isSetUp()) {
    throw new ValidationError({
      message: 'A configuração inicial já foi feita.',
      action: 'Entre com a sua conta.'
    })
  }
  const { companyName, name, email, password } = setupSchema.parse(data)
  const { company } = await accountRepository.createWithCompany({
    company: {
      company: { name: companyName, slug: toSlug(companyName) },
      justificationTypes: DEFAULT_JUSTIFICATION_TYPES,
      journeyRules: DEFAULT_JOURNEY_RULES
    },
    user: { name, email, mustChangePassword: false },
    role: OWNER_ROLE,
    passwordHash: await hashPassword(password)
  })
  return { company, credentials: { email, password } }
}

const toEmailCredentials = (data: TEmailSignInData): TSignInCredentials =>
  emailSignInSchema.parse(data)

const toCpfCredentials = (data: TCpfSignInData): TSignInCredentials => {
  const { cpf, password } = cpfSignInSchema.parse(data)
  return { email: getEmployeeEmail(cpf), password }
}

const parseChangePassword = (
  data: TChangePasswordData
): { currentPassword: string; newPassword: string } => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(data)
  return { currentPassword, newPassword }
}

const completePasswordChange = async (authUserId: string): Promise<void> => {
  await accountRepository.setMustChangePassword(authUserId, false)
}

const createEmployeeAccounts = async (companyId: string): Promise<void> => {
  const employees = await userRepository.findManyByCompanyId(companyId)
  const accounts = await Promise.all(
    employees
      .filter(({ cpf, authUserId }) => !authUserId && cpf && isCPF(cpf))
      .map(async ({ id, name, cpf }) => ({
        employeeId: id,
        companyId,
        role: EMPLOYEE_ROLE,
        user: {
          name,
          email: getEmployeeEmail(cpf!),
          mustChangePassword: true
        },
        passwordHash: await hashPassword(getDefaultPassword(name, cpf!))
      }))
  )
  if (accounts.length > 0) {
    await accountRepository.createEmployeeAccounts(accounts)
  }
}

const resetEmployeePassword = async (
  data: TResetEmployeePasswordData
): Promise<void> => {
  const { companyId, userId } = resetEmployeePasswordSchema.parse(data)
  const employee = await userRepository.findUniqueById(userId)
  if (employee?.companyId !== companyId) {
    throw new NotFoundError({
      message: 'O funcionário não foi encontrado.',
      cause: `User ${userId} not found in company ${companyId}`
    })
  }
  if (!employee.authUserId || !employee.cpf) {
    throw new Error(`User ${userId} has no account`)
  }
  await accountRepository.resetPassword({
    authUserId: employee.authUserId,
    passwordHash: await hashPassword(
      getDefaultPassword(employee.name, employee.cpf)
    )
  })
}

const findMembership = async (params: {
  authUserId: string
  companyId: string
}): Promise<TMemberWithCompany | null> =>
  await accountRepository.findMembership(params)

const findMemberships = async (
  authUserId: string
): Promise<TMemberWithCompany[]> =>
  await accountRepository.findMemberships(authUserId)

export const accountModel = {
  isSetUp,
  setup,
  toEmailCredentials,
  toCpfCredentials,
  parseChangePassword,
  completePasswordChange,
  createEmployeeAccounts,
  resetEmployeePassword,
  findMembership,
  findMemberships
}
