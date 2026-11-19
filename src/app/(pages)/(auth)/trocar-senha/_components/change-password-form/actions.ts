'use server'

import { redirect } from 'next/navigation'

import { handleFormAction } from '@/entry/form-action'
import { changePassword, PRIVATE_HOME_PATH } from '@/entry/session'

import type { TChangePasswordState } from './types'

export const save = async (
  state: TChangePasswordState,
  formData: FormData
): Promise<TChangePasswordState> => {
  const { success, errors, fatalError } = await handleFormAction(
    changePassword,
    state,
    formData
  )
  if (success) redirect(PRIVATE_HOME_PATH)
  return { success, errors, fatalError }
}
