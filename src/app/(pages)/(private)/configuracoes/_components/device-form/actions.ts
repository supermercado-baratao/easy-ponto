'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { deviceCredentialsModel } from '@/models/device-credentials/model'

import { TDeviceFormState } from './types'

export const save = async (
  state: TDeviceFormState,
  formData: FormData
): Promise<TDeviceFormState> => {
  const { company } = await requireEditor()
  const model = formData.get('model')?.toString()
  const ip = formData.get('ip')?.toString()
  const login = formData.get('login')?.toString()
  formData.set('companyId', company.id)
  const { success, errors, fatalError } = await handleFormAction(
    deviceCredentialsModel.upsert,
    state,
    formData
  )
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error.
  // The password is left out, so it never travels back to the client (#54, #56)
  return {
    success,
    errors,
    fatalError,
    values: success ? undefined : { model, ip, login }
  }
}
