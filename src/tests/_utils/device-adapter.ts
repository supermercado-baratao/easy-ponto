import { vi } from 'vitest'

import { deviceModel } from '@/models/device/model'
import type { TDeviceAdapter } from '@/models/device/types'

const notMocked = async (): Promise<never> => {
  throw new Error('This device call is not mocked')
}

export const mockDeviceAdapter = (adapter: Partial<TDeviceAdapter>): void => {
  vi.spyOn(deviceModel, 'connect').mockReturnValue({
    loadCompany: notMocked,
    loadUsers: notMocked,
    loadAfd: notMocked,
    ...adapter
  })
}
