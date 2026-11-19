import type { DeviceCredentials } from '@/infra/database/types'
import { companyRepository } from '@/repositories/company-repository'
import { deviceCredentialsRepository } from '@/repositories/device-credentials-repository'

import { schema } from './schema'
import { TDeviceCredentialsUpsertData } from './types'

const upsert = async ({
  companyId,
  ...data
}: TDeviceCredentialsUpsertData): Promise<DeviceCredentials> => {
  const company = await companyRepository.findUniqueById(companyId)
  if (!company) throw new Error(`Company ${companyId} not found`)
  const { deviceCredentials } = company
  const { id, ...deviceData } = schema.parse({
    ...data,
    id: deviceCredentials?.id,
    password: data.password || deviceCredentials?.password
  })
  return await deviceCredentialsRepository.upsertForCompany({
    id,
    companyId,
    data: deviceData
  })
}

export const deviceCredentialsModel = {
  upsert
}
