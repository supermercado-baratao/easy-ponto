import type { DeviceCredentials } from '@/infra/database/types'
import type { TDeviceAdapter, TDeviceUser } from '@/models/device/types'

import { controlIdApi, createApiInstance } from './api'
import { mapControlIdCompany, mapControlIdUser } from './mappers'
import { getSession } from './session'

export const createControlIdAdapter = (
  credentials: DeviceCredentials
): TDeviceAdapter => {
  const api = createApiInstance(credentials.ip)
  let session: Promise<string> | undefined
  const getAdapterSession = (): Promise<string> =>
    (session ??= getSession(api, credentials))

  return {
    loadCompany: async () =>
      mapControlIdCompany(
        await controlIdApi.loadCompany(api, await getAdapterSession())
      ),
    loadUsers: async (): Promise<TDeviceUser[]> => {
      const users = await controlIdApi.loadUsers(api, await getAdapterSession())
      return users.map((user) => mapControlIdUser(user))
    },
    loadAfd: async (query) =>
      await controlIdApi.getAfd(api, {
        ...query,
        session: await getAdapterSession()
      })
  }
}
