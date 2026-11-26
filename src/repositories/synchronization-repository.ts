import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import {
  companies,
  justifications as justificationsTable
} from '@/infra/database/schema'
import type {
  Company,
  Justification,
  JustificationCodeMapping,
  PunchRecord,
  Schedule,
  ScheduleDay,
  TInputData,
  User
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'

import { justificationCodeMappingRepository } from './justification-code-mapping-repository'
import { punchRecordRepository } from './punch-record-repository'
import { scheduleRepository } from './schedule-repository'
import { shiftAssignmentRepository } from './shift-assignment-repository'
import {
  shiftPatternRepository,
  type TShiftPatternVersionData
} from './shift-pattern-repository'
import { userRepository } from './user-repository'

type TFileImportData = {
  company: { id: string; registration: string | null } | null
  users: (Partial<TInputData<User>> & { id: string })[]
  punchRecords: Pick<PunchRecord, 'companyId' | 'pis' | 'datetime'>[]
  schedules: (TInputData<Schedule> & {
    days: Omit<TInputData<ScheduleDay>, 'scheduleId'>[]
  })[]
  shiftPatterns: {
    key: string
    companyId: string
    name: string
    version: TShiftPatternVersionData
  }[]
  shiftAssignments: ({
    userId: string
    startDate: string
    cycleStartDay: number
  } & ({ shiftPatternId: string } | { shiftPatternKey: string }))[]
  codeMappings: TInputData<JustificationCodeMapping>[]
  justifications: TInputData<Justification>[]
}

export const synchronizationRepository = {
  importFile: async ({
    company,
    users,
    punchRecords,
    schedules,
    shiftPatterns,
    shiftAssignments,
    codeMappings,
    justifications
  }: TFileImportData): Promise<Company | null> =>
    await database.transaction(async (tx) => {
      const [updatedCompany = null] = company
        ? await tx
            .update(companies)
            .set({ registration: company.registration })
            .where(eq(companies.id, company.id))
            .returning()
        : []
      if (users.length > 0) await userRepository.updateMany(users, tx)
      if (punchRecords.length > 0) {
        await punchRecordRepository.createMany(punchRecords, tx)
      }
      for (const schedule of schedules) {
        await scheduleRepository.save(schedule, tx)
      }
      const shiftPatternIds = new Map<string, string>()
      for (const { key, ...shiftPattern } of shiftPatterns) {
        const { id } = await shiftPatternRepository.create(shiftPattern, tx)
        shiftPatternIds.set(key, id)
      }
      for (const {
        userId,
        startDate,
        cycleStartDay,
        ...link
      } of shiftAssignments) {
        await shiftAssignmentRepository.replaceFrom(
          {
            userId,
            startDate,
            endDate: dayjs(startDate).subtract(1, 'day').format('YYYY-MM-DD')
          },
          tx
        )
        await shiftAssignmentRepository.create(
          {
            userId,
            startDate,
            endDate: null,
            cycleStartDay,
            shiftPatternId:
              'shiftPatternId' in link
                ? link.shiftPatternId
                : shiftPatternIds.get(link.shiftPatternKey)!
          },
          tx
        )
      }
      await justificationCodeMappingRepository.saveMany(codeMappings, tx)
      if (justifications.length > 0) {
        await tx.insert(justificationsTable).values(justifications)
      }
      return updatedCompany
    })
}
