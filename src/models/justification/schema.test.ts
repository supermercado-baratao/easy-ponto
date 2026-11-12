import { faker } from '@faker-js/faker'
import { describe, expect, test } from 'vitest'

import { createSchema } from './schema'

const data = {
  companyId: faker.string.uuid(),
  userId: faker.string.uuid(),
  typeId: faker.string.uuid(),
  startDate: '2026-11-10',
  endDate: '2026-11-10'
}

const getIssues = (input: Partial<Record<string, string>>): unknown =>
  createSchema.safeParse({ ...data, ...input }).error?.issues

describe('createSchema', () => {
  test('Turns the blank times and note of a whole-day justification into null', () => {
    expect(createSchema.parse({ ...data, note: '  ' })).toMatchObject({
      startTime: null,
      endTime: null,
      note: null
    })
  })

  test('Converts the times of a single-day justification to minutes', () => {
    expect(
      createSchema.parse({ ...data, startTime: '14:00', endTime: '15:40' })
    ).toMatchObject({ startTime: 840, endTime: 940 })
  })

  test('Rejects an end date before the start date', () => {
    expect(getIssues({ endDate: '2026-11-09' })).toMatchObject([
      {
        path: ['endDate'],
        message: 'A data final deve ser igual ou depois da inicial'
      }
    ])
  })

  test('Rejects times on a justification of several days', () => {
    expect(
      getIssues({ endDate: '2026-11-11', startTime: '14:00', endTime: '15:40' })
    ).toMatchObject([
      {
        path: ['startTime'],
        message:
          'O horário só pode ser informado numa justificativa de um único dia'
      }
    ])
  })

  test('Requires both times when one is given', () => {
    expect(getIssues({ endTime: '15:40' })).toMatchObject([
      { path: ['startTime'], message: 'Informe o horário de início' }
    ])
    expect(getIssues({ startTime: '14:00' })).toMatchObject([
      { path: ['endTime'], message: 'Informe o horário de fim' }
    ])
  })

  test('Rejects an end time that is not after the start time', () => {
    expect(getIssues({ startTime: '14:00', endTime: '14:00' })).toMatchObject([
      {
        path: ['endTime'],
        message: 'O horário de fim deve ser depois do de início'
      }
    ])
  })
})
