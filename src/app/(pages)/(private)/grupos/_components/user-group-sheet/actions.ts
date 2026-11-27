'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { userGroupModel } from '@/models/user-group/model'

import type { TUserGroupFormState, TUserGroupFormValues } from './types'

export const save = async (
  state: TUserGroupFormState,
  formData: FormData
): Promise<TUserGroupFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TUserGroupFormValues
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } = formData.get('id')
    ? await handleFormAction(userGroupModel.update, state, formData)
    : await handleFormAction(userGroupModel.create, state, formData)
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
