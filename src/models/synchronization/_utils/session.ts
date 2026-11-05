import { AxiosInstance } from 'axios'

import { deviceModel } from '@/models/device/model'
import { deviceSessionModel } from '@/models/device-session/model'

import { TSynchronizationCredentials } from '../types'

export const getSession = async (
  api: AxiosInstance,
  credentials: TSynchronizationCredentials
): Promise<string> => {
  let session: string | undefined

  const deviceSession =
    await deviceSessionModel.findUniqueByDeviceCredentialsId(credentials.id)
  session = deviceSession?.token

  if (session) {
    const sessionIsValid = await deviceModel.sessionIsValid(api, session)
    if (sessionIsValid) {
      return session
    }
  }

  session = await deviceModel.login(api, credentials)
  await deviceSessionModel.upsert(session, credentials.id)

  return session
}
