import { describe, expect, test } from 'vitest'

import { getDefaultPassword, getEmployeeEmail } from './utils'

describe('getDefaultPassword', () => {
  test('Joins the first five CPF digits and the last name in lowercase', () => {
    expect(getDefaultPassword('Maria Aparecida Souza', '123.456.789-10')).toBe(
      '12345souza'
    )
  })

  test('Strips the accents of the last name', () => {
    expect(getDefaultPassword('Maria Conceição', '98765432100')).toBe(
      '98765conceicao'
    )
  })

  test('Takes a suffix as the last name', () => {
    expect(getDefaultPassword('Pedro Alves Júnior', '11122233344')).toBe(
      '11122junior'
    )
    expect(getDefaultPassword('Carlos Souza Filho', '11122233344')).toBe(
      '11122filho'
    )
  })

  test('Ignores extra spaces and punctuation in the name', () => {
    expect(getDefaultPassword('  Ana   D’Ávila  ', '11122233344')).toBe(
      '11122davila'
    )
  })

  test('Restores the leading zeros of the CPF', () => {
    expect(getDefaultPassword('Ana Lima', '1234567890')).toBe('01234lima')
  })
})

describe('getEmployeeEmail', () => {
  test('Builds the same address from a CPF with or without the mask', () => {
    expect(getEmployeeEmail('123.456.789-10')).toBe(
      getEmployeeEmail('12345678910')
    )
  })
})
