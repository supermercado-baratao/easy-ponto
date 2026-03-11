'use server'

import { DeviceCredentials } from '@prisma/client'

import { handleFormAction, TState } from '@/infra'
import { deviceCredentialsModel, TDeviceCredentialsFormData } from '@/models'

export const saveDeviceSettings = async (
  userId: string,
  state: TState<TDeviceCredentialsFormData, DeviceCredentials>,
  formData: FormData
) => {
  formData.set('userId', userId)
  return handleFormAction(deviceCredentialsModel.save, state, formData)
}
