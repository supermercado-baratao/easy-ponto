'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { hoursBankModel } from '@/models/hours-bank/model'

import type {
  TAdjustmentFormState,
  TAdjustmentFormValues,
  TRemoveAdjustmentState
} from './types'

export const save = async (
  state: TAdjustmentFormState,
  formData: FormData
): Promise<TAdjustmentFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TAdjustmentFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } = formData.get('id')
    ? await handleFormAction(hoursBankModel.updateAdjustment, state, formData)
    : await handleFormAction(hoursBankModel.createAdjustment, state, formData)
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return {
    success,
    errors,
    fatalError,
    message,
    action,
    values: success ? undefined : values
  }
}

export const removeAdjustment = async (
  _state: TRemoveAdjustmentState,
  formData: FormData
): Promise<TRemoveAdjustmentState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await hoursBankModel.removeAdjustment({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}
