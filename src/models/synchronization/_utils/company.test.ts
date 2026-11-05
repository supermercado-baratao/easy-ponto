import { describe, expect, test } from 'vitest'

import { TDeviceCompany } from '@/models/device/types'

import { mapDeviceCompanyToCompany } from './company'

const deviceCompany: TDeviceCompany = {
  name: 'Supermercado Teste',
  address: 'Rua Teste, 1',
  cpf: 2_998_224_725,
  tipo_doc: 1,
  cpf_cnpj: 1_222_333_000_181,
  cei: 0
}

describe('mapDeviceCompanyToCompany', () => {
  test('Pads the CPF and the CNPJ with the zeros the device drops', () => {
    expect(mapDeviceCompanyToCompany(deviceCompany)).toEqual({
      name: 'Supermercado Teste',
      address: 'Rua Teste, 1',
      cpf: '02998224725',
      cpfCnpj: '01222333000181',
      cei: '0',
      tipoDoc: 1,
      registration: null
    })
  })

  test('Pads the document as a CPF when the company is a person', () => {
    const company = mapDeviceCompanyToCompany({
      ...deviceCompany,
      tipo_doc: 0,
      cpf_cnpj: 2_998_224_725
    })

    expect(company.cpfCnpj).toBe('02998224725')
  })
})
