'use server'

import { DeviceCredentials } from '@prisma/client'

import { handleFormAction, TState } from '@/infra/form-action'
import { deviceCredentialsModel, TDeviceCredentialsFormData } from '@/models'

export const save = async (
  adminUserId: string,
  state: TState<TDeviceCredentialsFormData, DeviceCredentials>,
  formData: FormData
): Promise<TState<TDeviceCredentialsFormData, DeviceCredentials>> => {
  formData.set('adminUserId', adminUserId)
  return handleFormAction(deviceCredentialsModel.upsert, state, formData)
}
