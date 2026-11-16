import { faker } from '@faker-js/faker'
import { describe, expect, test } from 'vitest'

import { saveSchema } from './schema'

const data = {
  companyId: faker.string.uuid(),
  userId: faker.string.uuid(),
  year: '2027'
}

describe('saveSchema', () => {
  test('Reads the month and the year of the form', () => {
    expect(saveSchema.parse({ ...data, month: '7' })).toMatchObject({
      year: 2027,
      month: 7
    })
  })

  test('Reads an empty month as no vacation planned', () => {
    expect(saveSchema.parse({ ...data, month: '' }).month).toBeNull()
    expect(saveSchema.parse(data).month).toBeNull()
  })

  test('Rejects a month outside the year', () => {
    for (const month of ['0', '13', '1.5', 'julho']) {
      const result = saveSchema.safeParse({ ...data, month })
      expect(result.error?.issues).toMatchObject([
        { path: ['month'], message: 'Selecione um mês válido' }
      ])
    }
  })
})
