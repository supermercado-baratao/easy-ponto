import type { TTimeCardReportAdapter } from '@/models/time-card-report/types'

import { extractDataFromJson, extractPeriod, parseXlsToJson } from './file'
import { extractHoursBankFromJson } from './hours-bank'
import { extractJustificationsFromJson } from './justification'

export const secullumAdapter: TTimeCardReportAdapter = {
  read: async (file) => {
    const json = await parseXlsToJson(file)
    const { company, users, punchRecords, schedules } =
      extractDataFromJson(json)
    return {
      period: extractPeriod(json),
      company,
      users,
      punchRecords,
      schedules,
      justifications: extractJustificationsFromJson(json, schedules),
      balances: extractHoursBankFromJson(json)
    }
  }
}
