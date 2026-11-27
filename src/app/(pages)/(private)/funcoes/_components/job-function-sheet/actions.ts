'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { jobFunctionModel } from '@/models/job-function/model'

import type { TJobFunctionFormState, TJobFunctionFormValues } from './types'

export const save = async (
  state: TJobFunctionFormState,
  formData: FormData
): Promise<TJobFunctionFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TJobFunctionFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } = formData.get('id')
    ? await handleFormAction(jobFunctionModel.update, state, formData)
    : await handleFormAction(jobFunctionModel.create, state, formData)
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
