'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireCompany } from '@/entry/session'
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
  const { company } = await requireCompany()
  const values = Object.fromEntries(formData) as TJustificationFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError } = formData.get('id')
    ? await handleFormAction(justificationModel.update, state, formData)
    : await handleFormAction(justificationModel.create, state, formData)
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { success, errors, fatalError, values: success ? undefined : values }
}

export const removeJustification = async (
  state: TRemoveJustificationState,
  formData: FormData
): Promise<TRemoveJustificationState> => {
  const {
    company: { id: companyId }
  } = await requireCompany()
  try {
    await justificationModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return { success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    return { success: false, fatalError: true }
  }
}
