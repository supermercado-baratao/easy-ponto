import { isCNPJ, isCPF } from 'validation-br'
import * as xlsx from 'xlsx'

import type { User } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { TPunchRecordCreateNonExistentInAfdData } from '@/models/punch-record/types'

import { InvalidExcelFileError } from '../errors'
import {
  TCompanyInJson,
  TDataInJson,
  TPunchRecordInJson,
  TUserInJson
} from '../types'
import { normalizeCnpj, normalizeCpf } from './normalize'

export const parseXlsToJson = async (file: File): Promise<unknown[]> => {
  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = xlsx.read(buffer, { type: 'buffer' })
  const result = xlsx.utils.sheet_to_json(
    workbook.Sheets[workbook.SheetNames[0]],
    {
      raw: false
    }
  )
  return result
}

const days = new Set(['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'])

export const ddMMYYYYToDate = (date: string): Date => {
  const [day, month, year] = date.split('/', 3)
  return dayjs(`${year}-${month}-${day}`).toDate()
}

const isValidDate = (date: string): boolean => {
  const [day, month, year] = date.split('/', 3)
  return (
    !Number.isNaN(Number(day)) &&
    !Number.isNaN(Number(month)) &&
    !Number.isNaN(Number(year))
  )
}

const isTwoDigitNumber = (value: string | undefined): boolean =>
  value?.length === 2 && !Number.isNaN(Number(value))

const isValidTime = (time: string): boolean => {
  const [hours, minutes] = time.replace('*', '').split(':', 2)
  return isTwoDigitNumber(hours) && isTwoDigitNumber(minutes)
}

const toDatetime = (date: string, time: string): Date => {
  const [day, month, year] = date.split('/', 3)
  const [hour, minute] = time.replace('*', '').split(':', 2)
  return dayjs(
    `${Number(year) + 2000}-${month}-${day} ${hour}:${minute}:00`
  ).toDate()
}

export const extractDataFromJson = (json: any[]): TDataInJson => {
  try {
    const cnpj = normalizeCnpj(json[3]['__EMPTY'])

    const company: TCompanyInJson = {
      name: json[2]['__EMPTY'],
      cpfCnpj: isCNPJ(cnpj) ? cnpj : '',
      registration: json[4]['__EMPTY']
    }

    const users: TUserInJson[] = []

    const punchRecords: TPunchRecordInJson[] = []

    for (const [index, item] of json.entries()) {
      const keys = Object.keys(item)
      const values = Object.values(item)
      if (keys[0] === 'CARTÃO PONTO' && values[0] === 'Departamento') {
        const cpf = normalizeCpf(json[index - 3]['__EMPTY_3'])
        const admissionDate = json[index - 2]['__EMPTY_3']
        const user: TUserInJson = {
          department: values[1] as string,
          position: json[index - 1]['__EMPTY'],
          admissionDate: isValidDate(admissionDate)
            ? ddMMYYYYToDate(admissionDate)
            : null,
          payrollNumber: json[index - 3]['__EMPTY'],
          cpf: isCPF(cpf) ? cpf : null,
          name: json[index - 4]['__EMPTY'],
          registration: json[index - 6]['__EMPTY']
        }
        users.push(user)
        continue
      }

      const [date, day] = (values[0] as string)
        .split('-')
        .filter(Boolean)
        .map((item) => item.trim())
      if (keys[0] !== 'CARTÃO PONTO' || !isValidDate(date) || !days.has(day)) {
        continue
      }

      const times = values.filter((value) => isValidTime(value as string))
      for (const time of times as string[]) {
        const datetime = toDatetime(date, time)
        punchRecords.push({
          userName: users.at(-1)!.name,
          datetime,
          // Times marked with `*` are not in the AFD
          afdDatetime: time.includes('*') ? null : datetime
        })
      }
    }

    return {
      company,
      users,
      punchRecords
    }
  } catch (error) {
    throw new InvalidExcelFileError(error as Error)
  }
}

export const getUsersToUpdate = (
  savedUsers: User[],
  users: TUserInJson[]
): User[] => {
  const usersToUpdate: User[] = []

  for (const user of users) {
    const foundUser = savedUsers.find(
      (foundUser) => foundUser.name === user.name
    )
    if (!foundUser) continue
    const userToUpdate: User = {
      ...foundUser,
      ...user
    }

    usersToUpdate.push(userToUpdate)
  }

  return usersToUpdate
}

export const getPunchRecordsToCreate = (
  punchRecordsInJson: TPunchRecordInJson[],
  users: User[]
): TPunchRecordCreateNonExistentInAfdData[] => {
  const punchRecordsToCreate: TPunchRecordCreateNonExistentInAfdData[] = []

  for (const punchRecordInJson of punchRecordsInJson) {
    const foundUser = users.find(
      (user) => user.name === punchRecordInJson.userName
    )
    if (!foundUser || punchRecordInJson.afdDatetime) continue
    punchRecordsToCreate.push({
      pis: foundUser.pis,
      datetime: punchRecordInJson.datetime
    })
  }

  return punchRecordsToCreate
}
