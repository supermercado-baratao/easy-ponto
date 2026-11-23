import { describe, expect, test } from 'vitest'

import type { TDeviceUser } from '@/models/device/types'

import { mapDeviceUserToUser } from './user'

const deviceUser: TDeviceUser = {
  name: 'Maria Teste',
  pis: '012345678901',
  cpf: '02998224725',
  code: '10',
  registration: '42',
  rfid: '0',
  bars: '',
  password: '',
  templatesCount: 2
}

describe('mapDeviceUserToUser', () => {
  test('Leaves empty the fields that only the file has and sets the status to registered', () => {
    const [user] = mapDeviceUserToUser([deviceUser], 'company-id')

    expect(user).toEqual({
      ...deviceUser,
      companyId: 'company-id',
      authUserId: null,
      admissionDate: null,
      department: null,
      payrollNumber: null,
      position: null,
      status: 'registered'
    })
  })
})
