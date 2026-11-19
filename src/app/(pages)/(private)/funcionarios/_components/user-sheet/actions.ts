'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { userModel } from '@/models/user/model'

import type { TUserFormState, TUserFormValues } from './types'

export const save = async (
  state: TUserFormState,
  formData: FormData
): Promise<TUserFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TUserFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError } = await handleFormAction(
    userModel.update,
    state,
    formData
  )
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { success, errors, fatalError, values: success ? undefined : values }
}
