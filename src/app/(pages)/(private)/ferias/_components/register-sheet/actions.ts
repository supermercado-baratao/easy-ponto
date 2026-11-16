'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { handleFormAction } from '@/entry/form-action'
import { vacationPlanModel } from '@/models/vacation-plan/model'

import type { TRegisterFormState, TRegisterFormValues } from './types'

export const register = async (
  state: TRegisterFormState,
  formData: FormData
): Promise<TRegisterFormState> => {
  const adminUser = await getAdminUser()
  const values = Object.fromEntries(formData) as TRegisterFormValues
  formData.set('companyId', adminUser.companyId ?? '')
  const { success, errors, fatalError } = await handleFormAction(
    vacationPlanModel.registerJustification,
    state,
    formData
  )
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { success, errors, fatalError, values: success ? undefined : values }
}
