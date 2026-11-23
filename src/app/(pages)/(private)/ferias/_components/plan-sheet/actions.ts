'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { vacationPlanModel } from '@/models/vacation-plan/model'

import type { TPlanFormState, TPlanFormValues } from './types'

export const save = async (
  state: TPlanFormState,
  formData: FormData
): Promise<TPlanFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TPlanFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } =
    await handleFormAction(vacationPlanModel.save, state, formData)
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
