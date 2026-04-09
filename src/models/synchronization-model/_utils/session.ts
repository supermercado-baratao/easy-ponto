import { AxiosInstance } from 'axios'

import { deviceModel, deviceSessionModel } from '@/models'

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
