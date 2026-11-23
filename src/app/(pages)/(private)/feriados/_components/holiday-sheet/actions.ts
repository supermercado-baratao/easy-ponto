'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { holidayModel } from '@/models/holiday/model'

import type { THolidayFormState, THolidayFormValues } from './types'

export const save = async (
  state: THolidayFormState,
  formData: FormData
): Promise<THolidayFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as THolidayFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } = formData.get('id')
    ? await handleFormAction(holidayModel.update, state, formData)
    : await handleFormAction(holidayModel.create, state, formData)
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
