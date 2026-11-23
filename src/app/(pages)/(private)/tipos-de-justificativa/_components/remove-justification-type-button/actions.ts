'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { justificationTypeModel } from '@/models/justification-type/model'

import type { TRemoveJustificationTypeState } from './types'

export const removeJustificationType = async (
  _state: TRemoveJustificationTypeState,
  formData: FormData
): Promise<TRemoveJustificationTypeState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await justificationTypeModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}
