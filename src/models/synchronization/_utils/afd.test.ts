import { describe, expect, test } from 'vitest'

import type { User } from '@/infra/database/types'

import {
  filterExistingDeviceUsersInTheParsedAfd,
  mapParsedAfdToPunchRecordCreateMany,
  parseAfd
} from './afd'

// The device ends each AFD line with `\r\n`
const createLine = ({
  nsr = 344,
  date = '01102025',
  time = '0727',
  pis = '012345678901'
} = {}): string =>
  `${nsr.toString().padStart(9, '0')}3${date}${time}${pis}687a\r`

describe('parseAfd', () => {
  test('Parses each field of a punch record', () => {
    expect(parseAfd(createLine())).toEqual([
      {
        nsr: 344,
        registrationType: '3',
        date: '01102025',
        time: '0727',
        pis: '012345678901',
        hexadecimalCheckDigit: '687a'
      }
    ])
  })

  test('Keeps the records in the file order', () => {
    const afd = [createLine({ nsr: 2 }), createLine({ nsr: 1 })].join('\n')

    expect(parseAfd(afd).map(({ nsr }) => nsr)).toEqual([2, 1])
  })

  test('Ignores the lines that are not punch records', () => {
    const header = `${'0'.repeat(9)}1${'9'.repeat(100)}\r`
    const afd = [header, createLine(), '', 'trailer\r'].join('\n')

    expect(parseAfd(afd)).toHaveLength(1)
  })

  test('Returns no records for an empty file', () => {
    expect(parseAfd('')).toEqual([])
  })
})

describe('mapParsedAfdToPunchRecordCreateMany', () => {
  test('Converts the date and time to a UTC datetime', () => {
    const [record] = parseAfd(createLine({ date: '31122025', time: '2359' }))

    const [punchRecord] = mapParsedAfdToPunchRecordCreateMany([record])

    expect(punchRecord).toEqual({
      pis: '012345678901',
      datetime: new Date('2025-12-31T23:59:00.000Z'),
      afdDatetime: new Date('2025-12-31T23:59:00.000Z'),
      nsr: 344,
      registrationType: '3',
      hexadecimalCheckDigit: '687a'
    })
  })
})

describe('filterExistingDeviceUsersInTheParsedAfd', () => {
  test('Keeps only the records of saved users', () => {
    const afd = [
      createLine({ nsr: 1, pis: '000000000001' }),
      createLine({ nsr: 2, pis: '000000000002' }),
      createLine({ nsr: 3, pis: '000000000001' })
    ].join('\n')
    const users = [{ pis: '000000000001' }] as User[]

    const records = filterExistingDeviceUsersInTheParsedAfd(
      parseAfd(afd),
      users
    )

    expect(records.map(({ nsr }) => nsr)).toEqual([1, 3])
  })
})
