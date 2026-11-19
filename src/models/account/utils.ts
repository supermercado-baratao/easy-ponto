import { CPF_LENGTH } from '@/constants/length'

export const OWNER_ROLE = 'owner'

export const EMPLOYEE_ROLE = 'employee'

const DEFAULT_PASSWORD_CPF_DIGITS = 5

// Employees sign in with the CPF, but better-auth requires an email on every account. The `.invalid`
// top-level domain is reserved (RFC 2606), so this address never reaches anyone
const EMPLOYEE_EMAIL_DOMAIN = 'funcionario.invalid'

export const toCpfDigits = (cpf: string): string =>
  cpf.replaceAll(/\D/g, '').padStart(CPF_LENGTH, '0')

export const getEmployeeEmail = (cpf: string): string =>
  `${toCpfDigits(cpf)}@${EMPLOYEE_EMAIL_DOMAIN}`

export const getDefaultPassword = (name: string, cpf: string): string => {
  const lastName =
    name
      .normalize('NFD')
      .replaceAll(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase('pt-BR')
      .replaceAll(/[^a-z\s]/g, '')
      .trim()
      .split(/\s+/)
      .at(-1) ?? ''
  return `${toCpfDigits(cpf).slice(0, DEFAULT_PASSWORD_CPF_DIGITS)}${lastName}`
}
