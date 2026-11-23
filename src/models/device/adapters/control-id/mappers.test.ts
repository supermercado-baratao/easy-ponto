import { describe, expect, test } from 'vitest'

import { mapControlIdCompany, mapControlIdUser } from './mappers'
import type { TControlIdCompany, TControlIdUser } from './types'

const company: TControlIdCompany = {
  name: 'Supermercado Teste',
  address: 'Rua Teste, 1',
  cpf: 2_998_224_725,
  tipo_doc: 1,
  cpf_cnpj: 1_222_333_000_181,
  cei: 0
}

const user: TControlIdUser = {
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

describe('mapControlIdCompany', () => {
  test('Pads the CPF and the CNPJ with the zeros the device drops', () => {
    expect(mapControlIdCompany(company)).toEqual({
      name: 'Supermercado Teste',
      address: 'Rua Teste, 1',
      cpf: '02998224725',
      cpfCnpj: '01222333000181',
      cei: '0',
      tipoDoc: 1
    })
  })

  test('Pads the document as a CPF when the company is a person', () => {
    const { cpfCnpj } = mapControlIdCompany({
      ...company,
      tipo_doc: 0,
      cpf_cnpj: 2_998_224_725
    })

    expect(cpfCnpj).toBe('02998224725')
  })
})

describe('mapControlIdUser', () => {
  test('Maps the device fields and pads the PIS and the CPF with zeros', () => {
    expect(mapControlIdUser(user)).toEqual({
      name: 'Maria Teste',
      pis: '012345678901',
      cpf: '02998224725',
      code: '10',
      registration: '42',
      rfid: '0',
      bars: '',
      password: '',
      templatesCount: 2
    })
  })

  test('Leaves the CPF empty when the device has none', () => {
    expect(mapControlIdUser({ ...user, cpf: undefined }).cpf).toBeNull()
  })
})
