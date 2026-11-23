import { describe, expect, test } from 'vitest'

import type { DeviceCredentials } from '@/infra/database/types'

import { DeviceNotConfiguredError, UnsupportedDeviceModelError } from './errors'
import { deviceModel } from './model'

describe('Device Model', () => {
  describe('connect', () => {
    test('Refuses a device model without an adapter', () => {
      expect(() =>
        deviceModel.connect({ model: 'unknown' } as DeviceCredentials)
      ).toThrow(UnsupportedDeviceModelError)
    })

    test('Refuses a company without a device', () => {
      expect(() => deviceModel.connect(null)).toThrow(DeviceNotConfiguredError)
    })
  })
})
