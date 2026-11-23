'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { memberModel } from '@/models/member/model'

import type { TAddMemberFormState } from './types'

export const addMember = async (
  state: TAddMemberFormState,
  formData: FormData
): Promise<TAddMemberFormState> => {
  const { user, role, company } = await requireEditor()
  const values = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    role: formData.get('role') as string
  }
  formData.set('companyId', company.id)
  formData.set('actorUserId', user.id)
  formData.set('actorRole', role)
  const { success, errors, fatalError, message, action } =
    await handleFormAction(memberModel.add, state, formData)
  if (success) refresh()
  // React resets the form after the action, so the typed values (but never the password) come back
  // as the defaults on an error (#56)
  return {
    success,
    errors,
    fatalError,
    message,
    action,
    values: success ? undefined : values
  }
}
