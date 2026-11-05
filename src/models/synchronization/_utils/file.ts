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

const days = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

const ddMMYYYYToDate = (date: string): Date => {
  const [day, month, year] = date.split('/')
  return dayjs(`${year}-${Number(month) - 1}-${day}`).toDate()
}

const isValidDate = (date: string): boolean => {
  const [day, month, year] = date.split('/')
  return !isNaN(Number(day)) && !isNaN(Number(month)) && !isNaN(Number(year))
}

const isValidTime = (time: any): boolean => {
  const [hours, minutes] = time.replace('*', '').split(':')
  if (!hours || !minutes) return false
  return (
    !isNaN(Number(hours)) &&
    !isNaN(Number(minutes)) &&
    hours.length === 2 &&
    minutes.length === 2
  )
}

const toDatetime = (date: string, time: string): Date => {
  const [day, month, year] = date.split('/')
  const [hour, minute] = time.replace('*', '').split(':')
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

    json.forEach((item, index) => {
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
        return
      }

      const [date, day] = (values[0] as string)
        .split('-')
        .filter((item) => item)
        .map((item) => item.trim())
      if (
        keys[0] === 'CARTÃO PONTO' &&
        isValidDate(date) &&
        days.includes(day)
      ) {
        const times = values.filter(isValidTime) as string[]
        times.forEach((time) => {
          const datetime = toDatetime(date, time)
          let afdDatetime: Date | null = null

          if (!time.includes('*')) {
            afdDatetime = datetime
          }
          punchRecords.push({
            userName: users[users.length - 1].name,
            datetime,
            afdDatetime
          })
        })
      }
    })

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

  users.forEach((user) => {
    const foundUser = savedUsers.find(
      (foundUser) => foundUser.name === user.name
    )
    if (!foundUser) return
    const userToUpdate: User = {
      ...foundUser,
      ...user
    }

    usersToUpdate.push(userToUpdate)
  })

  return usersToUpdate
}

export const getPunchRecordsToCreate = (
  punchRecordsInJson: TPunchRecordInJson[],
  users: User[]
): TPunchRecordCreateNonExistentInAfdData[] => {
  const punchRecordsToCreate: TPunchRecordCreateNonExistentInAfdData[] = []

  punchRecordsInJson.forEach((punchRecordInJson) => {
    const foundUser = users.find(
      (user) => user.name === punchRecordInJson.userName
    )
    if (!foundUser) return
    if (punchRecordInJson.afdDatetime) return
    punchRecordsToCreate.push({
      pis: foundUser.pis,
      datetime: punchRecordInJson.datetime
    })
  })

  return punchRecordsToCreate
}
