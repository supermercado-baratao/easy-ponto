import { describe, expect, test } from 'vitest'

import {
  ADMIN_ROLE,
  canEdit,
  EMPLOYEE_ROLE,
  getDefaultPassword,
  getEmployeeEmail,
  OWNER_ROLE,
  VIEWER_ROLE
} from './utils'

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

describe('canEdit', () => {
  test('Lets the owner and the admin edit', () => {
    expect(canEdit(OWNER_ROLE)).toBe(true)
    expect(canEdit(ADMIN_ROLE)).toBe(true)
  })

  test('Keeps the viewer, the employee and an unknown role from editing', () => {
    expect(canEdit(VIEWER_ROLE)).toBe(false)
    expect(canEdit(EMPLOYEE_ROLE)).toBe(false)
    expect(canEdit('member')).toBe(false)
  })
})
