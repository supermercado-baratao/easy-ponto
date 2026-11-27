'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { jobFunctionModel } from '@/models/job-function/model'

import type { TRemoveJobFunctionState } from './types'

export const removeJobFunction = async (
  _state: TRemoveJobFunctionState,
  formData: FormData
): Promise<TRemoveJobFunctionState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await jobFunctionModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}
