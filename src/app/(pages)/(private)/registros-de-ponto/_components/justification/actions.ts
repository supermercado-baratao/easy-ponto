'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { justificationModel } from '@/models/justification/model'

import type {
  TJustificationFormState,
  TJustificationFormValues,
  TRemoveJustificationState
} from './types'

export const save = async (
  state: TJustificationFormState,
  formData: FormData
): Promise<TJustificationFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TJustificationFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } = formData.get('id')
    ? await handleFormAction(justificationModel.update, state, formData)
    : await handleFormAction(justificationModel.create, state, formData)
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

export const removeJustification = async (
  _state: TRemoveJustificationState,
  formData: FormData
): Promise<TRemoveJustificationState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await justificationModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}
