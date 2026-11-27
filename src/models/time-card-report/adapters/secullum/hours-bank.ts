import { InvalidExcelFileError } from '@/models/time-card-report/errors'
import type { TReportBalance } from '@/models/time-card-report/types'

import { PAIR_COLUMNS, REST_CODE, toCode } from './justification'

// The store's rules for the Secullum balance, from the spreadsheet it used before the migration:
// a code in two pairs of the day counts a whole workday and in one pair half a day, and a worked
// holiday credits a whole workday. Not the rules of Easy Ponto's own journey (#65)
export const WORKDAY_MINUTES = 440
export const HALF_DAY_MINUTES = 200

const DAY_ROW_PATTERN = /^\d{2}\/\d{2}\/\d{2} - (\S+)$/

const TOTAL_COLUMNS = {
  absence: 'Faltas',
  adjustment: 'Ajuste'
} as const

// The report splits the overtime into the two percentages of the store's agreement
const OVERTIME_COLUMNS = [
  { percentage: 60, label: 'Ex60%' },
  { percentage: 100, label: 'Ex100%' }
] as const

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

const readTotal = (
  totals: Record<string, unknown>,
  columns: Map<string, string>,
  label: string
): number => {
  const key = columns.get(label)
  if (!key) throw new Error(`Column ${label} not found`)
  return timeToSignedMinutes(totals[key]) ?? 0
}

const readTotals = (
  totals: Record<string, unknown>,
  columns: Map<string, string>
): Omit<TReportBalance, 'userName' | 'justificationMinutes'> => ({
  absence: readTotal(totals, columns, TOTAL_COLUMNS.absence),
  overtime: OVERTIME_COLUMNS.map(({ percentage, label }) => ({
    percentage,
    minutes: readTotal(totals, columns, label)
  })).filter(({ minutes }) => minutes !== 0),
  adjustment: readTotal(totals, columns, TOTAL_COLUMNS.adjustment)
})

const applyDay = (
  balance: TReportBalance,
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

  const cellsByCode = new Map<string, number>()
  for (const { entry, exit } of PAIR_COLUMNS) {
    for (const label of [entry, exit]) {
      const code = toCode(row[columns.get(label) ?? ''])
      // The spreadsheet never deducted the weekly rest, even on a day the schedule marks as work
      if (!code || code === REST_CODE) continue
      cellsByCode.set(code, (cellsByCode.get(code) ?? 0) + 1)
    }
  }
  for (const [code, cells] of cellsByCode) {
    if (cells !== 2 && cells < 4) continue
    balance.justificationMinutes[code] =
      (balance.justificationMinutes[code] ?? 0) +
      (cells === 2 ? HALF_DAY_MINUTES : WORKDAY_MINUTES)
  }
}

export const extractHoursBankFromJson = (json: any[]): TReportBalance[] => {
  try {
    const balances: TReportBalance[] = []
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
          justificationMinutes: {}
        })
        continue
      }
      const balance = balances.at(-1)
      if (balance) applyDay(balance, row, columns)
    }

    return balances
  } catch (error) {
    throw new InvalidExcelFileError(error as Error)
  }
}
