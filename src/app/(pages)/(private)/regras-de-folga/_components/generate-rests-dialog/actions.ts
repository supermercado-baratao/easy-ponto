'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { restRuleModel } from '@/models/rest-rule/model'

import type { TGenerateRestsState, TPreviewRestsState } from './types'

export const previewRests = async (
  state: TPreviewRestsState,
  formData: FormData
): Promise<TPreviewRestsState> => {
  const { company } = await requireEditor()
  formData.set('companyId', company.id)
  const result = await handleFormAction(restRuleModel.preview, state, formData)
  // The state keeps the last result, so a failed preview must not show the previous one
  return {
    ...result,
    data: result.success ? result.data : null,
    month: formData.get('month') as string
  }
}

export const generateRests = async (
  _state: TGenerateRestsState,
  formData: FormData
): Promise<TGenerateRestsState> => {
  const { company } = await requireEditor()
  return await handleAction(async () => {
    const result = await restRuleModel.generate({
      companyId: company.id,
      month: formData.get('month') as string
    })
    refresh()
    return result
  })
}
