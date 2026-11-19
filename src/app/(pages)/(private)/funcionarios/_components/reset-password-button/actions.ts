'use server'

import { requireEditor } from '@/entry/session'
import { accountModel } from '@/models/account/model'

import type { TResetPasswordState } from './types'

export const resetPassword = async (
  state: TResetPasswordState,
  formData: FormData
): Promise<TResetPasswordState> => {
  const { company } = await requireEditor()
  try {
    await accountModel.resetEmployeePassword({
      companyId: company.id,
      userId: formData.get('id') as string
    })
    return { ...state, success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    return { ...state, success: false, fatalError: true }
  }
}
