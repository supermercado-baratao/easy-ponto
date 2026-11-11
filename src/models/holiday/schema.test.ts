import { faker } from '@faker-js/faker'
import { describe, expect, test } from 'vitest'

import { createSchema } from './schema'

const data = {
  companyId: faker.string.uuid(),
  date: '2026-11-20',
  name: ' Consciência Negra ',
  scope: 'national'
}

describe('createSchema', () => {
  test('Reads the recurring checkbox of the form', () => {
    expect(createSchema.parse({ ...data, recurring: 'on' })).toMatchObject({
      name: 'Consciência Negra',
      recurring: true
    })
    expect(createSchema.parse(data).recurring).toBe(false)
  })

  test('Rejects a recurring holiday on February 29', () => {
    const result = createSchema.safeParse({
      ...data,
      date: '2028-02-29',
      recurring: true
    })
    expect(result.error?.issues).toMatchObject([
      {
        path: ['date'],
        message: 'Um feriado que repete todo ano não pode ser em 29/02'
      }
    ])
    expect(
      createSchema.safeParse({ ...data, date: '2028-02-29' }).success
    ).toBe(true)
  })

  test('Rejects an unknown scope', () => {
    const result = createSchema.safeParse({ ...data, scope: 'world' })
    expect(result.error?.issues).toMatchObject([
      { path: ['scope'], message: 'Selecione a abrangência' }
    ])
  })
})
