'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { justificationTypeModel } from '@/models/justification-type/model'

import type {
  TJustificationTypeFormState,
  TJustificationTypeFormValues
} from './types'

export const save = async (
  state: TJustificationTypeFormState,
  formData: FormData
): Promise<TJustificationTypeFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TJustificationTypeFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError } = formData.get('id')
    ? await handleFormAction(justificationTypeModel.update, state, formData)
    : await handleFormAction(justificationTypeModel.create, state, formData)
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { success, errors, fatalError, values: success ? undefined : values }
}
