import { describe, expect, test } from 'vitest'

import { diffDeviceCompany, isCompanyConfigured } from './utils'

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

describe('diffDeviceCompany', () => {
  const deviceCompany = {
    name: 'MERCADO',
    address: 'RUA A, 1',
    cpf: '12345678909',
    tipoDoc: 1,
    cpfCnpj: '12345678000190',
    cei: '0'
  }

  test('Lists only the fields that differ from the device', () => {
    expect(
      diffDeviceCompany(
        { ...deviceCompany, name: 'MERCADO NOVO', cei: '123' },
        deviceCompany
      )
    ).toEqual([
      {
        field: 'name',
        label: 'Nome',
        current: 'MERCADO NOVO',
        device: 'MERCADO'
      },
      { field: 'cei', label: 'CEI', current: '123', device: '0' }
    ])
  })

  test('Shows an empty saved field as null and the document type by its label', () => {
    expect(
      diffDeviceCompany(
        { ...deviceCompany, address: null, tipoDoc: null },
        deviceCompany
      )
    ).toEqual([
      {
        field: 'address',
        label: 'Endereço',
        current: null,
        device: 'RUA A, 1'
      },
      {
        field: 'tipoDoc',
        label: 'Tipo de Documento',
        current: null,
        device: '1 - CNPJ'
      }
    ])
  })

  test('Returns no change when the saved company matches the device', () => {
    expect(diffDeviceCompany(deviceCompany, deviceCompany)).toEqual([])
  })
})
