import type { Company } from '@/infra/database/types'

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

// A company starts without the device and with only its name (#94): the rest is read from the device
export const isCompanyConfigured = ({
  deviceCredentialsId,
  cpfCnpj
}: Pick<Company, 'deviceCredentialsId' | 'cpfCnpj'>): boolean =>
  Boolean(deviceCredentialsId && cpfCnpj)
