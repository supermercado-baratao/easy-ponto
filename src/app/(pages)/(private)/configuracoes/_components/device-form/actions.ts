'use server'

import { handleFormAction } from '@/infra/form-action'
import { deviceCredentialsModel } from '@/models/device-credentials/model'

import { TDeviceFormState } from './types'

export const save = async (
  adminUserId: string,
  state: TDeviceFormState,
  formData: FormData
): Promise<TDeviceFormState> => {
  formData.set('adminUserId', adminUserId)
  return handleFormAction(deviceCredentialsModel.upsert, state, formData)
}
