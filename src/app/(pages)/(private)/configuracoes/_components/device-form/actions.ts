'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { handleFormAction } from '@/entry/form-action'
import { deviceCredentialsModel } from '@/models/device-credentials/model'

import { TDeviceFormState } from './types'

export const save = async (
  state: TDeviceFormState,
  formData: FormData
): Promise<TDeviceFormState> => {
  const adminUser = await getAdminUser()
  formData.set('adminUserId', adminUser.id)
  const { success, errors, fatalError } = await handleFormAction(
    deviceCredentialsModel.upsert,
    state,
    formData
  )
  if (success) refresh()
  return { success, errors, fatalError }
}
