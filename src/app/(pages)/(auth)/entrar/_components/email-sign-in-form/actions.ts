'use server'

import { redirect } from 'next/navigation'

import { handleFormAction } from '@/entry/form-action'
import { PRIVATE_HOME_PATH, signInWithEmail } from '@/entry/session'

import type { TEmailSignInState } from './types'

export const signIn = async (
  state: TEmailSignInState,
  formData: FormData
): Promise<TEmailSignInState> => {
  const email = formData.get('email')?.toString()
  const { success, errors, fatalError, message, action } =
    await handleFormAction(signInWithEmail, state, formData)
  if (success) redirect(PRIVATE_HOME_PATH)
  // React resets the form after the action, so the typed email comes back as the default on an
  // error. The password is left out, so it never travels back to the client (#56)
  return { success, errors, fatalError, message, action, values: { email } }
}
