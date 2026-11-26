'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'

import type {
  TRemoveState,
  TShiftAssignmentFormState,
  TShiftAssignmentFormValues
} from './types'

export const save = async (
  state: TShiftAssignmentFormState,
  formData: FormData
): Promise<TShiftAssignmentFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TShiftAssignmentFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } = formData.get('id')
    ? await handleFormAction(shiftAssignmentModel.update, state, formData)
    : await handleFormAction(shiftAssignmentModel.create, state, formData)
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

export const remove = async (
  _state: TRemoveState,
  formData: FormData
): Promise<TRemoveState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await shiftAssignmentModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}
