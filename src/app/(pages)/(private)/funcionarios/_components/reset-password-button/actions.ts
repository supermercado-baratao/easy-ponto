'use server'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { accountModel } from '@/models/account/model'

import type { TResetPasswordState } from './types'

export const resetPassword = async (
  _state: TResetPasswordState,
  formData: FormData
): Promise<TResetPasswordState> => {
  const { company } = await requireEditor()
  return await handleAction(async () => {
    await accountModel.resetEmployeePassword({
      companyId: company.id,
      userId: formData.get('id') as string
    })
    return null
  })
}
