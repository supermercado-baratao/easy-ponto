import { faker } from '@faker-js/faker'
import { describe, expect, test } from 'vitest'

import { createSchema, updateSchema } from './schema'

const data = {
  companyId: faker.string.uuid(),
  date: '2026-11-20',
  name: ' Consciência Negra ',
  scope: 'national'
}

describe('createSchema', () => {
  test('Keeps only the fields of each recurrence', () => {
    expect(
      createSchema.parse({
        ...data,
        recurrence: 'once',
        firstYear: '2020',
        easterDays: '2'
      })
    ).toEqual({
      ...data,
      name: 'Consciência Negra',
      recurrence: 'once',
      easterOffset: null,
      firstYear: null,
      lastYear: null
    })
    expect(
      createSchema.parse({
        ...data,
        recurrence: 'yearly',
        firstYear: '2020',
        lastYear: ''
      })
    ).toMatchObject({ date: '2026-11-20', firstYear: 2020, lastYear: null })
  })

  test('Reads the days before or after Easter of a moveable holiday', () => {
    const moveable = {
      ...data,
      recurrence: 'easter',
      easterDays: '48',
      easterSide: 'after'
    }
    expect(createSchema.parse(moveable)).toMatchObject({
      date: null,
      easterOffset: 48
    })
    expect(
      createSchema.parse({ ...moveable, easterDays: '2', easterSide: 'before' })
    ).toMatchObject({ easterOffset: -2 })
  })

  test('Rejects a moveable holiday that leaves the year of its Easter', () => {
    const result = createSchema.safeParse({
      ...data,
      recurrence: 'easter',
      easterDays: '81',
      easterSide: 'before'
    })
    expect(result.error?.issues).toMatchObject([{ path: ['easterDays'] }])
  })

  test('Rejects a last year before the first one', () => {
    const result = createSchema.safeParse({
      ...data,
      recurrence: 'yearly',
      firstYear: '2027',
      lastYear: '2026'
    })
    expect(result.error?.issues).toMatchObject([
      {
        path: ['lastYear'],
        message: 'O último ano não pode ser antes do primeiro'
      }
    ])
  })

  test('Rejects a fixed holiday on February 29', () => {
    const result = createSchema.safeParse({
      ...data,
      date: '2028-02-29',
      recurrence: 'yearly'
    })
    expect(result.error?.issues).toMatchObject([
      {
        path: ['date'],
        message: 'Um feriado que repete todo ano não pode ser em 29/02'
      }
    ])
    expect(
      createSchema.safeParse({
        ...data,
        date: '2028-02-29',
        recurrence: 'once'
      }).success
    ).toBe(true)
  })

  test('Rejects an unknown scope or recurrence', () => {
    expect(
      createSchema.safeParse({ ...data, recurrence: 'once', scope: 'world' })
        .error?.issues
    ).toMatchObject([{ path: ['scope'], message: 'Selecione a abrangência' }])
    expect(
      createSchema.safeParse({ ...data, recurrence: 'monthly' }).error?.issues
    ).toMatchObject([
      { path: ['recurrence'], message: 'Selecione a repetição' }
    ])
  })
})

describe('updateSchema', () => {
  test('Applies the change to every year unless a year is given', () => {
    const update = { ...data, id: faker.string.uuid(), recurrence: 'yearly' }
    expect(updateSchema.parse({ ...update, fromYear: 'all' }).fromYear).toBe(
      undefined
    )
    expect(updateSchema.parse({ ...update, fromYear: '2027' }).fromYear).toBe(
      2027
    )
  })
})
