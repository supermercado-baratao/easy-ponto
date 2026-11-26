'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { shiftPatternModel } from '@/models/shift-pattern/model'

import type { TShiftPatternFormState, TShiftPatternFormValues } from './types'

export const save = async (
  state: TShiftPatternFormState,
  formData: FormData
): Promise<TShiftPatternFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TShiftPatternFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } = formData.get('id')
    ? await handleFormAction(shiftPatternModel.update, state, formData)
    : await handleFormAction(shiftPatternModel.create, state, formData)
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
