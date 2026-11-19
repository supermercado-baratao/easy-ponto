'use server'

import { refresh } from 'next/cache'

import { requireEditor } from '@/entry/session'
import { ValidationError } from '@/infra/errors'
import { synchronizationModel } from '@/models/synchronization/model'

import type { TInitialBalanceState } from './types'

export const importInitialBalance = async (
  _state: TInitialBalanceState,
  formData: FormData
): Promise<TInitialBalanceState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  try {
    const { closing, unmatchedNames } =
      await synchronizationModel.importInitialBalance({
        file: formData.get('file') as File,
        companyId
      })
    refresh()
    return {
      success: true,
      fatalError: false,
      data: {
        startDate: closing.startDate,
        endDate: closing.endDate,
        unmatchedNames
      }
    }
  } catch (error) {
    console.error(error)
    if (error instanceof ValidationError) {
      return {
        success: false,
        fatalError: false,
        message: error.message,
        action: error.action
      }
    }
    return { success: false, fatalError: true }
  }
}
