import { describe, expect, test } from 'vitest'

import { isCompanyConfigured } from './utils'

describe('isCompanyConfigured', () => {
  test('Requires the device credentials and the data imported from the device', () => {
    expect(
      isCompanyConfigured({
        deviceCredentialsId: 'device',
        cpfCnpj: '12345678000190'
      })
    ).toBe(true)
    expect(
      isCompanyConfigured({
        deviceCredentialsId: null,
        cpfCnpj: '12345678000190'
      })
    ).toBe(false)
    expect(
      isCompanyConfigured({ deviceCredentialsId: 'device', cpfCnpj: null })
    ).toBe(false)
    expect(
      isCompanyConfigured({ deviceCredentialsId: null, cpfCnpj: null })
    ).toBe(false)
  })
})
