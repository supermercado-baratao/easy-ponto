'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { synchronizationModel } from '@/models/synchronization/model'
import type { TTimeCardReportFormat } from '@/models/time-card-report/types'

import type { TInitialBalanceState } from './types'

export const importInitialBalance = async (
  _state: TInitialBalanceState,
  formData: FormData
): Promise<TInitialBalanceState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    const { closing, unmatchedNames } =
      await synchronizationModel.importInitialBalance({
        file: formData.get('file') as File,
        format: formData.get('format') as TTimeCardReportFormat,
        companyId
      })
    refresh()
    return {
      startDate: closing.startDate,
      endDate: closing.endDate,
      unmatchedNames
    }
  })
}
