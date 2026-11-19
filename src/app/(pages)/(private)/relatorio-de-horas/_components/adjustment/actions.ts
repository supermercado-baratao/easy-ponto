'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireCompany } from '@/entry/session'
import { ValidationError } from '@/infra/errors'
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
  const { company } = await requireCompany()
  const values = Object.fromEntries(formData) as TAdjustmentFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError } = formData.get('id')
    ? await handleFormAction(hoursBankModel.updateAdjustment, state, formData)
    : await handleFormAction(hoursBankModel.createAdjustment, state, formData)
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { success, errors, fatalError, values: success ? undefined : values }
}

export const removeAdjustment = async (
  _state: TRemoveAdjustmentState,
  formData: FormData
): Promise<TRemoveAdjustmentState> => {
  const {
    company: { id: companyId }
  } = await requireCompany()
  try {
    await hoursBankModel.removeAdjustment({
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
