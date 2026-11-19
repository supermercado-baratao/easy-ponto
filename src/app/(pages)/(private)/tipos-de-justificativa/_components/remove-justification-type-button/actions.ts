'use server'

import { refresh } from 'next/cache'

import { requireEditor } from '@/entry/session'
import { ValidationError } from '@/infra/errors'
import { justificationTypeModel } from '@/models/justification-type/model'

import type { TRemoveJustificationTypeState } from './types'

export const removeJustificationType = async (
  state: TRemoveJustificationTypeState,
  formData: FormData
): Promise<TRemoveJustificationTypeState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  try {
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
