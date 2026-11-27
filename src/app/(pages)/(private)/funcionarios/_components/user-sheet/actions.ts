'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { userModel } from '@/models/user/model'

import type { TUserFormState } from './types'
import { getFormValues } from './utils'

export const save = async (
  state: TUserFormState,
  formData: FormData
): Promise<TUserFormState> => {
  const { company } = await requireEditor()
  const values = getFormValues(formData)
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } =
    await handleFormAction(userModel.update, state, formData)
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
