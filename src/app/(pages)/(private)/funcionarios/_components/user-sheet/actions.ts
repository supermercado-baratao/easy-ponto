'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { handleFormAction } from '@/entry/form-action'
import { userModel } from '@/models/user/model'

import type { TUserFormState, TUserFormValues } from './types'

export const save = async (
  state: TUserFormState,
  formData: FormData
): Promise<TUserFormState> => {
  const adminUser = await getAdminUser()
  const values = Object.fromEntries(formData) as TUserFormValues
  formData.set('companyId', adminUser.companyId ?? '')
  const { success, errors, fatalError } = await handleFormAction(
    userModel.update,
    state,
    formData
  )
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { success, errors, fatalError, values: success ? undefined : values }
}
