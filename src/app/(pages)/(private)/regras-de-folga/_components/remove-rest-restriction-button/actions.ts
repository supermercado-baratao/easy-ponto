'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { restRestrictionModel } from '@/models/rest-restriction/model'

import type { TRemoveRestRestrictionState } from './types'

export const removeRestRestriction = async (
  _state: TRemoveRestRestrictionState,
  formData: FormData
): Promise<TRemoveRestRestrictionState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await restRestrictionModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}
