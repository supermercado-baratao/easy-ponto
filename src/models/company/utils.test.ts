import { describe, expect, test } from 'vitest'

import { diffDeviceCompany, isCompanyConfigured } from './utils'

describe('isCompanyConfigured', () => {
  const device = { deviceCredentialsId: 'device', cpfCnpj: '12345678000190' }
  const overtimeBands = [
    { dayKind: 'workday' },
    { dayKind: 'day-off' },
    { dayKind: 'holiday' }
  ]

  test('Requires the device credentials and the data imported from the device', () => {
    expect(isCompanyConfigured(device, overtimeBands)).toBe(true)
    expect(
      isCompanyConfigured(
        { ...device, deviceCredentialsId: null },
        overtimeBands
      )
    ).toBe(false)
    expect(
      isCompanyConfigured({ ...device, cpfCnpj: null }, overtimeBands)
    ).toBe(false)
  })

  test('Requires the overtime percentages of every day kind', () => {
    expect(isCompanyConfigured(device, [])).toBe(false)
    expect(isCompanyConfigured(device, overtimeBands.slice(0, 2))).toBe(false)
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
