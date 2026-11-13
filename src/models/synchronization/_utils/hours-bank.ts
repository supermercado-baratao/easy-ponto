import type { User } from '@/infra/database/types'
import type { THoursBankInitialBalanceItem } from '@/models/hours-bank/types'

import { InvalidExcelFileError } from '../errors'
import type { THoursBankBalanceInJson, THoursBankInJson } from '../types'
import { extractPeriod } from './file'

// The store's rules for the Secullum balance, from the spreadsheet it used before the migration:
// a day off (FOLGA) is deducted from the hours bank, and a worked holiday credits a whole
// workday. Not the rules of Easy Ponto's own journey (#65)
export const WORKDAY_MINUTES = 440
export const HALF_DAY_OFF_MINUTES = 200

const DAY_OFF = 'FOLGA'

const DAY_ROW_PATTERN = /^\d{2}\/\d{2}\/\d{2} - (\S+)$/

const TOTAL_COLUMNS = {
  absence: 'Faltas',
  overtime60: 'Ex60%',
  overtime100: 'Ex100%',
  adjustment: 'Ajuste'
} as const

const TIME_PATTERN = /^(-)?(\d+):(\d{2})/

export const timeToSignedMinutes = (value: unknown): number | null => {
  const [, sign, hours, minutes] =
    TIME_PATTERN.exec(typeof value === 'string' ? value.trim() : '') ?? []
  if (hours === undefined) return null
  const total = Number(hours) * 60 + Number(minutes)
  return sign ? -total : total
}

const mapColumns = (header: Record<string, unknown>): Map<string, string> =>
  new Map(
    Object.entries(header).map(([key, label]) => [String(label).trim(), key])
  )

const readTotals = (
  totals: Record<string, unknown>,
  columns: Map<string, string>
): Omit<THoursBankBalanceInJson, 'userName' | 'dayOff'> => {
  const result = { absence: 0, overtime60: 0, overtime100: 0, adjustment: 0 }
  for (const [field, label] of Object.entries(TOTAL_COLUMNS)) {
    const key = columns.get(label)
    if (!key) throw new Error(`Column ${label} not found`)
    result[field as keyof typeof result] = timeToSignedMinutes(totals[key]) ?? 0
  }
  return result
}

const applyDay = (
  balance: THoursBankBalanceInJson,
  row: Record<string, unknown>,
  columns: Map<string, string>
): void => {
  const [, weekday] = DAY_ROW_PATTERN.exec(String(row['CARTÃO PONTO'])) ?? []
  if (!weekday) return

  if (weekday === 'feri') {
    const firstEntry = row[columns.get('Ent. 1') ?? '']
    const worked = timeToSignedMinutes(row[columns.get('Ex100%') ?? ''])
    if (worked && timeToSignedMinutes(firstEntry) !== null) {
      balance.adjustment += WORKDAY_MINUTES - worked
    }
    return
  }

  const daysOff = Object.values(row).filter((value) => value === DAY_OFF)
  if (daysOff.length >= 4) balance.dayOff += WORKDAY_MINUTES
  else if (daysOff.length === 2) balance.dayOff += HALF_DAY_OFF_MINUTES
}

export const extractHoursBankFromJson = (json: any[]): THoursBankInJson => {
  try {
    const balances: THoursBankBalanceInJson[] = []
    let columns = new Map<string, string>()

    for (const [index, row] of json.entries()) {
      if (row['CARTÃO PONTO'] === 'Departamento') {
        columns = mapColumns(json[index + 1])
        const totals = json[index + 2]
        balances.push({
          userName: json[index - 4]['__EMPTY'],
          // `sheet_to_json` skips a blank totals row, so the row below may already be a day
          ...readTotals(
            totals && !('CARTÃO PONTO' in totals) ? totals : {},
            columns
          ),
          dayOff: 0
        })
        continue
      }
      const balance = balances.at(-1)
      if (balance) applyDay(balance, row, columns)
    }

    return { ...extractPeriod(json), balances }
  } catch (error) {
    throw new InvalidExcelFileError(error as Error)
  }
}

export const getInitialBalancesToSave = (
  balancesInJson: THoursBankBalanceInJson[],
  users: User[]
): {
  balances: THoursBankInitialBalanceItem[]
  unmatchedNames: string[]
} => {
  const balances: THoursBankInitialBalanceItem[] = []
  const unmatchedNames: string[] = []

  for (const { userName, ...balance } of balancesInJson) {
    const user = users.find(({ name }) => name === userName)
    if (user) balances.push({ userId: user.id, ...balance })
    else unmatchedNames.push(userName)
  }

  return { balances, unmatchedNames }
}
