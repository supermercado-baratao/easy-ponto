'use server'

import { redirect } from 'next/navigation'

import { handleFormAction } from '@/entry/form-action'
import { EMPLOYEE_HOME_PATH, signInWithCpf } from '@/entry/session'

import type { TCpfSignInState } from './types'

export const signIn = async (
  state: TCpfSignInState,
  formData: FormData
): Promise<TCpfSignInState> => {
  const cpf = formData.get('cpf')?.toString()
  const { success, errors, fatalError } = await handleFormAction(
    signInWithCpf,
    state,
    formData
  )
  // Only employee accounts have a CPF email, so they skip the bounce through the private layout
  if (success) redirect(EMPLOYEE_HOME_PATH)
  // React resets the form after the action, so the typed CPF comes back as the default on an
  // error. The password is left out, so it never travels back to the client (#56)
  return { success, errors, fatalError, values: { cpf } }
}
