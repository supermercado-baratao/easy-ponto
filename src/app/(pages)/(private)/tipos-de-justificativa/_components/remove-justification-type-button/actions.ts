'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { ValidationError } from '@/infra/errors'
import { justificationTypeModel } from '@/models/justification-type/model'

import type { TRemoveJustificationTypeState } from './types'

export const removeJustificationType = async (
  state: TRemoveJustificationTypeState,
  formData: FormData
): Promise<TRemoveJustificationTypeState> => {
  try {
    const { id, companyId } = await getAdminUser()
    if (!companyId) throw new Error(`AdminUser ${id} has no company`)
    await justificationTypeModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return { success: true, fatalError: false }
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
