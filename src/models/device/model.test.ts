import { describe, expect, test } from 'vitest'

import type { DeviceCredentials } from '@/infra/database/types'

import { deviceModel } from './model'

describe('Device Model', () => {
  describe('connect', () => {
    test('Refuses a device model without an adapter', () => {
      expect(() =>
        deviceModel.connect({ model: 'unknown' } as DeviceCredentials)
      ).toThrow('Device model unknown has no adapter')
    })
  })
})
