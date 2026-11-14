'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { handleFormAction } from '@/entry/form-action'
import { companyModel } from '@/models/company/model'
import { synchronizationModel } from '@/models/synchronization/model'

import type { TCompanyFormValues, TCompanyState } from './types'

export const save = async (
  state: TCompanyState,
  formData: FormData
): Promise<TCompanyState> => {
  const adminUser = await getAdminUser()
  const values = Object.fromEntries(formData) as TCompanyFormValues
  formData.delete('updatedAt')
  formData.set('adminUserId', adminUser.id)
  const result = await handleFormAction(
    companyModel.upsertForAdminUser,
    state,
    formData
  )
  if (result.success) {
    refresh()
    return { ...result, values: undefined }
  }
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { ...result, values }
}

export const importFromDevice = async (
  state: TCompanyState
): Promise<TCompanyState> => {
  try {
    const { id, deviceCredentials } = await getAdminUser()
    if (!deviceCredentials) throw new Error(`AdminUser ${id} has no device`)
    const data = await synchronizationModel.synchronizeCompany({
      adminUserId: id,
      credentials: deviceCredentials
    })
    refresh()
    return { ...state, data, success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    return { ...state, success: false, fatalError: true }
  }
}
