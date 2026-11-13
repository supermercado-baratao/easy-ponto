'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { ValidationError } from '@/infra/errors'
import { synchronizationModel } from '@/models/synchronization/model'

import type { TInitialBalanceState } from './types'

export const importInitialBalance = async (
  _state: TInitialBalanceState,
  formData: FormData
): Promise<TInitialBalanceState> => {
  try {
    const { id, companyId } = await getAdminUser()
    if (!companyId) throw new Error(`AdminUser ${id} has no company`)
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
