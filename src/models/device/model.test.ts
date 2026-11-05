import { AxiosInstance } from 'axios'
import { describe, expect, test, vi } from 'vitest'

import { deviceModel } from './model'
import { TDeviceUser } from './types'

type TLoadUsersBody = { limit: number; offset: number }

const createApi = (
  total: number
): {
  api: AxiosInstance
  deviceUsers: TDeviceUser[]
  getLoadUsersBodies: () => (TLoadUsersBody | undefined)[]
} => {
  const deviceUsers = Array.from(
    { length: total },
    (_, index) => ({ pis: index }) as TDeviceUser
  )
  const post = vi.fn(async (url: string, body?: TLoadUsersBody) => {
    if (url.startsWith('/count_users')) return { data: { count: total } }
    const { limit, offset } = body!
    return { data: { users: deviceUsers.slice(offset, offset + limit) } }
  })
  const getLoadUsersBodies = (): (TLoadUsersBody | undefined)[] =>
    post.mock.calls
      .filter(([url]) => url.startsWith('/load_users'))
      .map(([, body]) => body)

  return {
    api: { post } as unknown as AxiosInstance,
    deviceUsers,
    getLoadUsersBodies
  }
}

describe('Device Model', () => {
  describe('loadUsers', () => {
    test('Does not load users when the device has none', async () => {
      const { api, getLoadUsersBodies } = createApi(0)

      const users = await deviceModel.loadUsers(api, 'session')

      expect(users).toEqual([])
      expect(getLoadUsersBodies()).toEqual([])
    })

    test('Makes one request when the users fit in one page', async () => {
      const { api, deviceUsers, getLoadUsersBodies } = createApi(100)

      const users = await deviceModel.loadUsers(api, 'session')

      expect(users).toEqual(deviceUsers)
      expect(getLoadUsersBodies()).toEqual([{ limit: 100, offset: 0 }])
    })

    test('Loads every user across pages', async () => {
      const { api, deviceUsers, getLoadUsersBodies } = createApi(250)

      const users = await deviceModel.loadUsers(api, 'session')

      expect(users).toEqual(deviceUsers)
      expect(getLoadUsersBodies()).toEqual([
        { limit: 100, offset: 0 },
        { limit: 100, offset: 100 },
        { limit: 100, offset: 200 }
      ])
    })
  })
})
