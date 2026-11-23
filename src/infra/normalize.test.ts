import { describe, expect, test } from 'vitest'

import {
  normalizeCnpj,
  normalizeCpf,
  normalizeLeftZeros,
  normalizePis
} from './normalize'

describe('normalizeLeftZeros', () => {
  test.each([
    [123, 6, '000123'],
    ['123', 6, '000123'],
    [123_456, 6, '123456'],
    ['1234567', 6, '1234567']
  ])('turns %j with length %i into %s', (value, length, expected) => {
    expect(normalizeLeftZeros(value, length)).toBe(expected)
  })
})

describe('normalizePis', () => {
  test('Removes the padding zero and the last digit of a 12-digit PIS', () => {
    expect(normalizePis('012345678901')).toBe('1234567890')
  })

  test.each(['12345678901', '112345678901'])('Keeps %s as it is', (pis) => {
    expect(normalizePis(pis)).toBe(pis)
  })
})

describe('normalizeCnpj', () => {
  test.each([
    ['11.222.333/0001-81', '11222333000181'],
    ['1.222.333/0001-81', '01222333000181']
  ])('turns %s into %s', (cnpj, expected) => {
    expect(normalizeCnpj(cnpj)).toBe(expected)
  })
})

describe('normalizeCpf', () => {
  test.each([
    ['529.982.247-25', '52998224725'],
    ['29.982.247-25', '02998224725']
  ])('turns %s into %s', (cpf, expected) => {
    expect(normalizeCpf(cpf)).toBe(expected)
  })
})
