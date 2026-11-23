'use server'

import { redirect } from 'next/navigation'

import { handleFormAction } from '@/entry/form-action'
import { PRIVATE_HOME_PATH, setUpFirstAccount } from '@/entry/session'

import type { TSetupState } from './types'

export const setUp = async (
  state: TSetupState,
  formData: FormData
): Promise<TSetupState> => {
  const values = {
    companyName: formData.get('companyName')?.toString(),
    name: formData.get('name')?.toString(),
    email: formData.get('email')?.toString()
  }
  const { success, errors, fatalError, message, action } =
    await handleFormAction(setUpFirstAccount, state, formData)
  if (success) redirect(PRIVATE_HOME_PATH)
  // React resets the form after the action, so the typed values come back as the defaults on an
  // error. The passwords are left out, so they never travel back to the client (#56)
  return { success, errors, fatalError, message, action, values }
}
