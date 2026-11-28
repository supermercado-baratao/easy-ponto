'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { restRuleModel } from '@/models/rest-rule/model'

import type { TRemoveRestRuleState } from './types'

export const removeRestRule = async (
  _state: TRemoveRestRuleState,
  formData: FormData
): Promise<TRemoveRestRuleState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await restRuleModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}
