'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { shiftPatternModel } from '@/models/shift-pattern/model'

import type { TRemoveState } from './types'

export const removeShiftPattern = async (
  _state: TRemoveState,
  formData: FormData
): Promise<TRemoveState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await shiftPatternModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}

export const removeShiftPatternVersion = async (
  _state: TRemoveState,
  formData: FormData
): Promise<TRemoveState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await shiftPatternModel.removeVersion({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}
