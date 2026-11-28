import type { Company, OvertimeBand } from '@/infra/database/types'
import type { TDeviceCompany } from '@/models/device/types'
import { hasOvertimeBands } from '@/models/journey-rules/utils'

import type { TCompanyChange, TDeviceCompanyField } from './types'

const SLUG_SUFFIX_LENGTH = 6

// The slug is only the unique key better-auth requires for an organization, never shown, so a
// random suffix keeps two companies with the same name apart
export const toSlug = (name: string): string => {
  const base = name
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
  const suffix = crypto.randomUUID().slice(0, SLUG_SUFFIX_LENGTH)
  return base ? `${base}-${suffix}` : suffix
}

export const COMPANY_SETUP_STEPS = [
  'device',
  'company',
  'overtime-bands'
] as const

export type TCompanySetupStep = (typeof COMPANY_SETUP_STEPS)[number]

// A company starts without the device and with only its name (#94): the rest is read from the device,
// except the overtime percentages of its agreement (#105)
export const getMissingSetupSteps = (
  {
    deviceCredentialsId,
    cpfCnpj
  }: Pick<Company, 'deviceCredentialsId' | 'cpfCnpj'>,
  overtimeBands: Pick<OvertimeBand, 'dayKind'>[]
): TCompanySetupStep[] =>
  COMPANY_SETUP_STEPS.filter((step) => {
    switch (step) {
      case 'device': {
        return !deviceCredentialsId
      }
      case 'company': {
        return !cpfCnpj
      }
      case 'overtime-bands': {
        return !hasOvertimeBands(overtimeBands)
      }
    }
  })

export const isCompanyConfigured = (
  company: Pick<Company, 'deviceCredentialsId' | 'cpfCnpj'>,
  overtimeBands: Pick<OvertimeBand, 'dayKind'>[]
): boolean => getMissingSetupSteps(company, overtimeBands).length === 0

export const DEVICE_COMPANY_FIELDS = [
  'name',
  'address',
  'cpf',
  'tipoDoc',
  'cpfCnpj',
  'cei'
] as const satisfies readonly (keyof TDeviceCompany)[]

export const DEVICE_COMPANY_FIELD_LABELS: Record<TDeviceCompanyField, string> =
  {
    name: 'Nome',
    address: 'Endereço',
    cpf: 'CPF do Responsável',
    tipoDoc: 'Tipo de Documento',
    cpfCnpj: 'CPF/CNPJ',
    cei: 'CEI'
  }

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  '0': '0 - CPF',
  '1': '1 - CNPJ'
}

const toText = (value: string | number | null): string =>
  value === null ? '' : String(value)

const formatValue = (
  field: TDeviceCompanyField,
  value: string | number | null
): string | null => {
  const text = toText(value)
  if (!text) return null
  return field === 'tipoDoc' ? (DOCUMENT_TYPE_LABELS[text] ?? text) : text
}

export const diffDeviceCompany = (
  company: Pick<Company, TDeviceCompanyField>,
  deviceCompany: TDeviceCompany
): TCompanyChange[] =>
  DEVICE_COMPANY_FIELDS.filter(
    (field) => toText(company[field]) !== toText(deviceCompany[field])
  ).map((field) => ({
    field,
    label: DEVICE_COMPANY_FIELD_LABELS[field],
    current: formatValue(field, company[field]),
    device: formatValue(field, deviceCompany[field])
  }))
