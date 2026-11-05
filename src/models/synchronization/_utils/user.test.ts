import { describe, expect, test } from 'vitest'

import { TDeviceUser } from '@/models/device/types'

import { mapDeviceUserToUser, mapDeviceUserToUserFields } from './user'

const deviceUser: TDeviceUser = {
  name: 'Maria Teste',
  pis: 12_345_678_901,
  cpf: 2_998_224_725,
  code: 10,
  templates_count: 2,
  password: '',
  admin: false,
  rfid: 0,
  bars: '',
  registration: 42
}

describe('mapDeviceUserToUserFields', () => {
  test('Maps the device fields and pads the PIS and the CPF with zeros', () => {
    expect(mapDeviceUserToUserFields(deviceUser, 'company-id')).toEqual({
      bars: '',
      code: '10',
      cpf: '02998224725',
      name: 'Maria Teste',
      password: '',
      pis: '012345678901',
      rfid: '0',
      registration: '42',
      templatesCount: 2,
      companyId: 'company-id'
    })
  })

  test('Leaves the CPF empty when the device has none', () => {
    const fields = mapDeviceUserToUserFields(
      { ...deviceUser, cpf: undefined },
      'company-id'
    )

    expect(fields.cpf).toBeNull()
  })
})

describe('mapDeviceUserToUser', () => {
  test('Leaves empty the fields that only the file has', () => {
    const [user] = mapDeviceUserToUser([deviceUser], 'company-id')

    expect(user).toMatchObject({
      adminUserId: null,
      admissionDate: null,
      department: null,
      payrollNumber: null,
      position: null
    })
  })
})
