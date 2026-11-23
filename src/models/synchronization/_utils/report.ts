import type { User } from '@/infra/database/types'
import type { THoursBankInitialBalanceItem } from '@/models/hours-bank/types'
import type { TPunchRecordCreateNonExistentInAfdData } from '@/models/punch-record/types'
import type { TScheduleSaveData } from '@/models/schedule/types'
import type {
  TReportBalance,
  TReportPunchRecord,
  TReportSchedule,
  TReportUser
} from '@/models/time-card-report/types'

export const getUsersToUpdate = (
  savedUsers: User[],
  reportUsers: TReportUser[]
): User[] => {
  const usersToUpdate: User[] = []

  for (const user of reportUsers) {
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
  reportPunchRecords: TReportPunchRecord[],
  users: User[]
): TPunchRecordCreateNonExistentInAfdData[] => {
  const punchRecordsToCreate: TPunchRecordCreateNonExistentInAfdData[] = []

  for (const reportPunchRecord of reportPunchRecords) {
    const foundUser = users.find(
      (user) => user.name === reportPunchRecord.userName
    )
    if (!foundUser || reportPunchRecord.afdDatetime) continue
    punchRecordsToCreate.push({
      companyId: foundUser.companyId,
      pis: foundUser.pis,
      datetime: reportPunchRecord.datetime
    })
  }

  return punchRecordsToCreate
}

export const getSchedulesToSave = (
  reportSchedules: TReportSchedule[],
  users: User[]
): TScheduleSaveData[] => {
  const schedulesToSave: TScheduleSaveData[] = []

  for (const { userName, ...schedule } of reportSchedules) {
    const foundUser = users.find((user) => user.name === userName)
    if (!foundUser) continue
    schedulesToSave.push({
      ...schedule,
      companyId: foundUser.companyId,
      userId: foundUser.id
    })
  }

  return schedulesToSave
}

const sumDeductedMinutes = (
  justificationMinutes: Record<string, number>,
  deductedCodes: Set<string>
): number => {
  let total = 0
  for (const [code, minutes] of Object.entries(justificationMinutes)) {
    if (deductedCodes.has(code)) total += minutes
  }
  return total
}

export const getInitialBalancesToSave = (
  reportBalances: TReportBalance[],
  users: User[],
  deductedCodes: Set<string>
): {
  balances: THoursBankInitialBalanceItem[]
  unmatchedNames: string[]
} => {
  const balances: THoursBankInitialBalanceItem[] = []
  const unmatchedNames: string[] = []

  for (const { userName, justificationMinutes, ...totals } of reportBalances) {
    const user = users.find(({ name }) => name === userName)
    if (!user) {
      unmatchedNames.push(userName)
      continue
    }
    balances.push({
      userId: user.id,
      ...totals,
      compensation: sumDeductedMinutes(justificationMinutes, deductedCodes)
    })
  }

  return { balances, unmatchedNames }
}
