import type { User } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { TPunchRecordCreateManyExistentsInAfdData } from '@/models/punch-record/types'

import { TParsedAfdRecord } from '../types'

const toDatetime = (date: string, time: string): Date => {
  const day = date.slice(0, 2)
  const month = date.slice(2, 4)
  const year = date.slice(4, 8)
  const hour = time.slice(0, 2)
  const minute = time.slice(2, 4)
  return dayjs(`${year}-${month}-${day} ${hour}:${minute}:00`).toDate()
}

export const mapParsedAfdToPunchRecordCreateMany = (
  parsedAfd: TParsedAfdRecord[]
): TPunchRecordCreateManyExistentsInAfdData =>
  parsedAfd.map((record) => ({
    pis: record.pis,
    datetime: toDatetime(record.date, record.time),
    afdDatetime: toDatetime(record.date, record.time),
    nsr: record.nsr,
    registrationType: record.registrationType,
    hexadecimalCheckDigit: record.hexadecimalCheckDigit
  }))

export const parseAfd = (afd: string): TParsedAfdRecord[] => {
  const lines = afd.split('\n')
  const records: TParsedAfdRecord[] = lines
    .map((line) => {
      if (line.length !== 39) {
        return undefined
      }
      return {
        nsr: Number(line.slice(0, 9)),
        registrationType: line.slice(9, 10),
        date: line.slice(10, 18),
        time: line.slice(18, 22),
        pis: line.slice(22, 34),
        hexadecimalCheckDigit: line.slice(34, 38)
      }
    })
    .filter((line) => line !== undefined)
  return records
}

export const filterExistingDeviceUsersInTheParsedAfd = (
  parsedAfd: TParsedAfdRecord[],
  users: User[]
): TParsedAfdRecord[] =>
  parsedAfd.filter((record) => users.some((user) => user.pis === record.pis))
