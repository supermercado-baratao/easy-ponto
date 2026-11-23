import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import {
  companies,
  justifications as justificationsTable
} from '@/infra/database/schema'
import type {
  Company,
  Justification,
  PunchRecord,
  Schedule,
  ScheduleDay,
  TInputData,
  User
} from '@/infra/database/types'

import {
  justificationCodeMappingRepository,
  type TCodeResolutionsSaveData
} from './justification-code-mapping-repository'
import { punchRecordRepository } from './punch-record-repository'
import { scheduleRepository } from './schedule-repository'
import { userRepository } from './user-repository'

type TFileImportData = {
  company: { id: string; registration: string | null } | null
  users: (Partial<TInputData<User>> & { id: string })[]
  punchRecords: Pick<PunchRecord, 'companyId' | 'pis' | 'datetime'>[]
  schedules: (TInputData<Schedule> & {
    days: Omit<TInputData<ScheduleDay>, 'scheduleId'>[]
  })[]
  codeResolutions: TCodeResolutionsSaveData
  justifications: TInputData<Justification>[]
}

export const synchronizationRepository = {
  importFile: async ({
    company,
    users,
    punchRecords,
    schedules,
    codeResolutions,
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
      await justificationCodeMappingRepository.saveResolutions(
        codeResolutions,
        tx
      )
      if (justifications.length > 0) {
        await tx.insert(justificationsTable).values(justifications)
      }
      return updatedCompany
    })
}
