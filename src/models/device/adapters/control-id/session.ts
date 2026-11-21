import type { AxiosInstance } from 'axios'

import type { DeviceCredentials } from '@/infra/database/types'
import { deviceSessionModel } from '@/models/device-session/model'

import { controlIdApi } from './api'

export const getSession = async (
  api: AxiosInstance,
  credentials: DeviceCredentials
): Promise<string> => {
  const deviceSession =
    await deviceSessionModel.findUniqueByDeviceCredentialsId(credentials.id)
  if (
    deviceSession &&
    (await controlIdApi.sessionIsValid(api, deviceSession.token))
  ) {
    return deviceSession.token
  }

  const session = await controlIdApi.login(api, credentials)
  await deviceSessionModel.upsert(session, credentials.id)
  return session
}
